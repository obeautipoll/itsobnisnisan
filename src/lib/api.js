import { createClient } from "@supabase/supabase-js";
import { clearToken, getRefreshToken, getToken, setSession } from "./auth";

const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const storageBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "portfolio";
const adminSignupEnabled = import.meta.env.VITE_ENABLE_ADMIN_SIGNUP === "true";

const normalizeProjectUrl = (url) =>
  url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

const supabaseProjectUrl = normalizeProjectUrl(configuredSupabaseUrl);
const supabaseRestUrl = `${supabaseProjectUrl}/rest/v1`;

const cmsRealtimeTables = [
  "cms_profile",
  "cms_education_schools",
  "cms_education_coursework",
  "cms_education_memberships",
  "cms_skills_languages",
  "cms_skills_tools",
  "cms_experience_roles",
  "cms_projects_meta",
  "cms_projects_featured",
  "cms_projects_cards",
  "cms_certificates_meta",
  "cms_certificates_items",
  "cms_leadership_roles",
  "cms_contact",
];

let browserClient = null;
let browserClientToken = null;

const assertSupabaseConfig = () => {
  if (!supabaseProjectUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY."
    );
  }
};

const getBrowserClient = () => {
  assertSupabaseConfig();
  const token = getToken() || null;

  if (!browserClient || browserClientToken !== token) {
    browserClientToken = token;
    browserClient = createClient(supabaseProjectUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      },
    });
  }

  if (token) {
    browserClient.realtime.setAuth(token);
  }

  return browserClient;
};

const supabaseHeaders = (options = {}) => {
  const token = options.forceAnon ? null : getToken();
  const headers = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${token || supabaseAnonKey}`,
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (options.body instanceof FormData || options.rawBody) {
    delete headers["Content-Type"];
  }

  return headers;
};

const parseError = async (res) => {
  const responseText = await res.text();
  if (!responseText) return "Request failed";

  try {
    const parsed = JSON.parse(responseText);
    const message =
      parsed.error_description || parsed.message || parsed.error || responseText;

    if (/invalid login credentials/i.test(message)) {
      return "Invalid login. Use a Supabase Auth email/password. If you have not created a Supabase Auth user yet, enable signup locally and create one first.";
    }

    if (/email not confirmed/i.test(message)) {
      return "Email is not confirmed. Confirm the user in Supabase Authentication or disable email confirmations while testing.";
    }

    return message;
  } catch {
    return responseText;
  }
};

const parseJsonOrNull = async (res) => {
  const responseText = await res.text();
  if (!responseText) return null;
  return JSON.parse(responseText);
};

const refreshAdminSession = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${supabaseProjectUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    clearToken();
    return null;
  }

  const data = await res.json();
  const expiresAt = data.expires_at
    ? data.expires_at * 1000
    : Date.now() + (data.expires_in || 3600) * 1000;

  setSession({
    token: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
  });

  browserClient = null;
  browserClientToken = null;

  return data.access_token;
};

const supabaseRequest = async (path, options = {}) => {
  assertSupabaseConfig();

  const request = () =>
    fetch(`${supabaseRestUrl}${path}`, {
      ...options,
      headers: supabaseHeaders(options),
    });

  let res = await request();

  if (res.status === 401 && !options.forceAnon && getRefreshToken()) {
    const refreshedToken = await refreshAdminSession();
    if (refreshedToken) {
      res = await request();
    }
  }

  if (res.status === 401 && !options.forceAnon) {
    clearToken();
    throw new Error("Admin session expired. Sign in again to read admin-only data.");
  }

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  if (res.status === 204) return null;
  return parseJsonOrNull(res);
};

const selectRows = (table, query = "select=*") =>
  supabaseRequest(`/${table}?${query}`);

const selectSingle = async (table, query = "select=*&limit=1") => {
  const rows = await selectRows(table, query);
  return Array.isArray(rows) ? rows[0] || null : null;
};

const upsertRows = (table, rows, conflictTarget = "id") =>
  supabaseRequest(`/${table}?on_conflict=${conflictTarget}`, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });

const deleteAllRows = (table) =>
  supabaseRequest(`/${table}?id=not.is.null`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });

const replaceRows = async (table, rows) => {
  await deleteAllRows(table);
  if (!rows.length) return null;
  return upsertRows(table, rows);
};

const sortByOrder = (rows) =>
  [...(rows || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

const toTextArray = (value) => (Array.isArray(value) ? value : []);

const fetchProfile = async () => {
  const row = await selectSingle("cms_profile");
  if (!row) return null;

  return {
    name: row.name,
    shortName: row.short_name,
    heroTag: row.hero_tag,
    tagline: row.tagline,
    email: row.email,
    phone: row.phone,
    resume: row.resume,
    avatar: row.avatar,
    links: {
      github: row.github_url,
      facebook: row.facebook_url,
      linkedin: row.linkedin_url,
    },
  };
};

const saveProfile = (profile) =>
  upsertRows("cms_profile", [
    {
      id: 1,
      name: profile.name || "",
      short_name: profile.shortName || "",
      hero_tag: profile.heroTag || "",
      tagline: profile.tagline || "",
      email: profile.email || "",
      phone: profile.phone || "",
      resume: profile.resume || "",
      avatar: profile.avatar || "",
      github_url: profile.links?.github || "",
      facebook_url: profile.links?.facebook || "",
      linkedin_url: profile.links?.linkedin || "",
    },
  ]);

const fetchEducation = async () => {
  const [schools, coursework, memberships] = await Promise.all([
    selectRows("cms_education_schools", "select=*&order=sort_order.asc"),
    selectRows("cms_education_coursework", "select=*&order=sort_order.asc"),
    selectRows("cms_education_memberships", "select=*&order=sort_order.asc"),
  ]);

  if (!schools.length && !coursework.length && !memberships.length) return null;

  return {
    schools: sortByOrder(schools).map((school) => ({
      name: school.name,
      period: school.period,
      program: school.program,
      note: school.note,
      highlight: school.highlight,
    })),
    coursework: sortByOrder(coursework).map((item) => item.title),
    memberships: sortByOrder(memberships).map((item) => item.title),
  };
};

const saveEducation = async (education) => {
  await Promise.all([
    replaceRows(
      "cms_education_schools",
      (education.schools || []).map((school, index) => ({
        sort_order: index,
        name: school.name || "",
        period: school.period || "",
        program: school.program || "",
        note: school.note || "",
        highlight: Boolean(school.highlight),
      }))
    ),
    replaceRows(
      "cms_education_coursework",
      (education.coursework || []).map((title, index) => ({
        sort_order: index,
        title,
      }))
    ),
    replaceRows(
      "cms_education_memberships",
      (education.memberships || []).map((title, index) => ({
        sort_order: index,
        title,
      }))
    ),
  ]);
};

const fetchSkills = async () => {
  const [languages, tools] = await Promise.all([
    selectRows("cms_skills_languages", "select=*&order=sort_order.asc"),
    selectRows("cms_skills_tools", "select=*&order=sort_order.asc"),
  ]);

  if (!languages.length && !tools.length) return null;

  return {
    languages: sortByOrder(languages).map((skill) => ({
      name: skill.name,
      icon: skill.icon,
    })),
    tools: sortByOrder(tools).map((skill) => ({
      name: skill.name,
      icon: skill.icon,
    })),
  };
};

const saveSkills = async (skills) => {
  await Promise.all([
    replaceRows(
      "cms_skills_languages",
      (skills.languages || []).map((skill, index) => ({
        sort_order: index,
        name: skill.name || "",
        icon: skill.icon || "",
      }))
    ),
    replaceRows(
      "cms_skills_tools",
      (skills.tools || []).map((skill, index) => ({
        sort_order: index,
        name: skill.name || "",
        icon: skill.icon || "",
      }))
    ),
  ]);
};

const fetchExperience = async () => {
  const rows = await selectRows("cms_experience_roles", "select=*&order=sort_order.asc");
  if (!rows.length) return null;

  return sortByOrder(rows).map((role) => ({
    title: role.title,
    period: role.period,
    bullets: toTextArray(role.bullets),
  }));
};

const saveExperience = (experience) =>
  replaceRows(
    "cms_experience_roles",
    (experience || []).map((role, index) => ({
      sort_order: index,
      title: role.title || "",
      period: role.period || "",
      bullets: toTextArray(role.bullets),
    }))
  );

const fetchProjects = async () => {
  const [meta, featured, cards] = await Promise.all([
    selectSingle("cms_projects_meta"),
    selectRows("cms_projects_featured", "select=*&order=sort_order.asc"),
    selectRows("cms_projects_cards", "select=*&order=sort_order.asc"),
  ]);

  if (!meta && !featured.length && !cards.length) return null;

  return {
    description: meta?.description || "",
    badge: meta?.badge || "",
    featured: sortByOrder(featured).map((project) => ({
      title: project.title,
      period: project.period,
      badge: project.badge,
      description: project.description,
      image: project.image,
      link: project.link,
      icons: toTextArray(project.icons),
    })),
    cards: sortByOrder(cards).map((project) => ({
      title: project.title,
      tag: project.tag,
      description: project.description,
      image: project.image,
      icons: toTextArray(project.icons),
    })),
  };
};

const saveProjects = async (projects) => {
  await Promise.all([
    upsertRows("cms_projects_meta", [
      {
        id: 1,
        description: projects.description || "",
        badge: projects.badge || "",
      },
    ]),
    replaceRows(
      "cms_projects_featured",
      (projects.featured || []).map((project, index) => ({
        sort_order: index,
        title: project.title || "",
        period: project.period || "",
        badge: project.badge || "",
        description: project.description || "",
        image: project.image || "",
        link: project.link || "",
        icons: toTextArray(project.icons),
      }))
    ),
    replaceRows(
      "cms_projects_cards",
      (projects.cards || []).map((project, index) => ({
        sort_order: index,
        title: project.title || "",
        tag: project.tag || "",
        description: project.description || "",
        image: project.image || "",
        icons: toTextArray(project.icons),
      }))
    ),
  ]);
};

const fetchCertificates = async () => {
  const [meta, items] = await Promise.all([
    selectSingle("cms_certificates_meta"),
    selectRows("cms_certificates_items", "select=*&order=sort_order.asc"),
  ]);

  if (!meta && !items.length) return null;

  return {
    description: meta?.description || "",
    badge: meta?.badge || "",
    items: sortByOrder(items).map((cert) => ({
      tag: cert.tag,
      title: cert.title,
      description: cert.description,
      pdf: cert.pdf,
    })),
  };
};

const saveCertificates = async (certificates) => {
  await Promise.all([
    upsertRows("cms_certificates_meta", [
      {
        id: 1,
        description: certificates.description || "",
        badge: certificates.badge || "",
      },
    ]),
    replaceRows(
      "cms_certificates_items",
      (certificates.items || []).map((cert, index) => ({
        sort_order: index,
        tag: cert.tag || "",
        title: cert.title || "",
        description: cert.description || "",
        pdf: cert.pdf || "",
      }))
    ),
  ]);
};

const fetchLeadership = async () => {
  const rows = await selectRows("cms_leadership_roles", "select=*&order=sort_order.asc");
  if (!rows.length) return null;

  return sortByOrder(rows).map((role) => ({
    title: role.title,
    role: role.role,
    period: role.period,
    bullets: toTextArray(role.bullets),
    accent: role.accent,
  }));
};

const saveLeadership = (leadership) =>
  replaceRows(
    "cms_leadership_roles",
    (leadership || []).map((role, index) => ({
      sort_order: index,
      title: role.title || "",
      role: role.role || "",
      period: role.period || "",
      bullets: toTextArray(role.bullets),
      accent: role.accent || "gold",
    }))
  );

const fetchContact = async () => {
  const row = await selectSingle("cms_contact");
  if (!row) return null;

  return {
    headline: row.headline,
    description: row.description,
  };
};

const saveContact = (contact) =>
  upsertRows("cms_contact", [
    {
      id: 1,
      headline: contact.headline || "",
      description: contact.description || "",
    },
  ]);

export const login = async (email, password) => {
  assertSupabaseConfig();

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!normalizedEmail.includes("@")) {
    throw new Error("Use the email address from Supabase Auth.");
  }

  const res = await fetch(
    `${supabaseProjectUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const data = await res.json();
  const expiresAt = data.expires_at
    ? data.expires_at * 1000
    : Date.now() + (data.expires_in || 3600) * 1000;

  return {
    token: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    user: data.user,
  };
};

export const canCreateAdminAccount = () => adminSignupEnabled;

export const createAdminAccount = async (email, password) => {
  assertSupabaseConfig();

  if (!adminSignupEnabled) {
    throw new Error("Admin signup is disabled.");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!normalizedEmail.includes("@")) {
    throw new Error("Use a valid email address.");
  }

  if (String(password).length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const res = await fetch(`${supabaseProjectUrl}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: normalizedEmail,
      password,
    }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return parseJsonOrNull(res);
};

export const fetchContent = async () => {
  const [
    profile,
    education,
    skills,
    experience,
    projects,
    certificates,
    leadership,
    contact,
  ] = await Promise.all([
    fetchProfile(),
    fetchEducation(),
    fetchSkills(),
    fetchExperience(),
    fetchProjects(),
    fetchCertificates(),
    fetchLeadership(),
    fetchContact(),
  ]);

  const content = {
    ...(profile ? { profile } : {}),
    ...(education ? { education } : {}),
    ...(skills ? { skills } : {}),
    ...(experience ? { experience } : {}),
    ...(projects ? { projects } : {}),
    ...(certificates ? { certificates } : {}),
    ...(leadership ? { leadership } : {}),
    ...(contact ? { contact } : {}),
  };

  return { content: Object.keys(content).length ? content : null };
};

export const subscribeToContentUpdates = (onChange) => {
  const client = getBrowserClient();
  const channel = client.channel("public-cms-content");
  let refreshTimer = null;

  const scheduleRefresh = () => {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(onChange, 250);
  };

  cmsRealtimeTables.forEach((table) => {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      scheduleRefresh
    );
  });

  channel.subscribe();

  return () => {
    window.clearTimeout(refreshTimer);
    client.removeChannel(channel);
  };
};

export const saveContent = async (content) => {
  const writes = [];

  if (content.profile !== undefined) writes.push(saveProfile(content.profile));
  if (content.education !== undefined) writes.push(saveEducation(content.education));
  if (content.skills !== undefined) writes.push(saveSkills(content.skills));
  if (content.experience !== undefined) writes.push(saveExperience(content.experience));
  if (content.projects !== undefined) writes.push(saveProjects(content.projects));
  if (content.certificates !== undefined) writes.push(saveCertificates(content.certificates));
  if (content.leadership !== undefined) writes.push(saveLeadership(content.leadership));
  if (content.contact !== undefined) writes.push(saveContact(content.contact));

  await Promise.all(writes);

  return { ok: true };
};

export const uploadImage = async (file, section) => {
  assertSupabaseConfig();

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileTypeFolder = file.type.startsWith("image/") ? "images" : "documents";
  const path = `${fileTypeFolder}/${Date.now()}-${safeName}`;
  const token = getToken() || supabaseAnonKey;
  const uploadResponse = await fetch(
    `${supabaseProjectUrl}/storage/v1/object/${storageBucket}/${path}`,
    {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "false",
      },
      body: file,
    }
  );

  if (!uploadResponse.ok) {
    throw new Error(await parseError(uploadResponse));
  }

  const publicUrl = `${supabaseProjectUrl}/storage/v1/object/public/${storageBucket}/${path}`;

  try {
    await supabaseRequest("/media_assets", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        bucket: storageBucket,
        path,
        public_url: publicUrl,
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        asset_type: file.type.startsWith("image/") ? "image" : "pdf",
        related_section: section || null,
      }),
    });
  } catch {
    // Uploads should still succeed if the optional metadata table is not present.
  }

  return {
    asset: null,
    url: publicUrl,
    path,
  };
};

export const submitContact = (payload) =>
  supabaseRequest("/messages", {
    method: "POST",
    forceAnon: true,
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  });

export const fetchMessages = async () => {
  const messages = await supabaseRequest(
    "/messages?select=*&order=created_at.desc&limit=50"
  );
  return { messages };
};

export const subscribeToMessages = (onMessage) => {
  const client = getBrowserClient();
  const channel = client
    .channel("admin-contact-inbox")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (payload) => onMessage(payload.new)
    );

  channel.subscribe();

  return () => {
    client.removeChannel(channel);
  };
};
