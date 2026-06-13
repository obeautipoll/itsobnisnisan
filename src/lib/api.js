import { getToken } from "./auth";

const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const storageBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "portfolio";
const adminSignupEnabled = import.meta.env.VITE_ENABLE_ADMIN_SIGNUP === "true";

const normalizeProjectUrl = (url) =>
  url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

const supabaseProjectUrl = normalizeProjectUrl(configuredSupabaseUrl);
const supabaseRestUrl = `${supabaseProjectUrl}/rest/v1`;
const sectionNames = [
  "profile",
  "education",
  "skills",
  "experience",
  "projects",
  "certificates",
  "leadership",
  "contact",
];

const assertSupabaseConfig = () => {
  if (!supabaseProjectUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY."
    );
  }
};

const supabaseHeaders = (options = {}) => {
  const token = getToken();
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

const supabaseRequest = async (path, options = {}) => {
  assertSupabaseConfig();

  const res = await fetch(`${supabaseRestUrl}${path}`, {
    ...options,
    headers: supabaseHeaders(options),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  if (res.status === 204) return null;
  return res.json();
};

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
  return { token: data.access_token, user: data.user };
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

  return res.json();
};

export const fetchContent = async () => {
  const rows = await supabaseRequest(
    "/content_sections?select=section,data"
  );
  const content = rows.reduce((acc, row) => {
    acc[row.section] = row.data;
    return acc;
  }, {});

  return { content: Object.keys(content).length ? content : null };
};

export const saveContent = async (content) => {
  const rows = sectionNames
    .filter((section) => content[section] !== undefined)
    .map((section) => ({
      section,
      data: content[section],
    }));

  if (!rows.length) return { ok: true };

  await supabaseRequest("/content_sections?on_conflict=section", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });

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
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  });

export const fetchMessages = async () => {
  const messages = await supabaseRequest(
    "/messages?select=*&order=created_at.desc&limit=50"
  );
  return { messages };
};
