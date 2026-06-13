import { getToken } from "./auth";

const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const storageBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "portfolio";

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
    return parsed.error_description || parsed.message || parsed.error || responseText;
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

export const login = async (username, password) => {
  assertSupabaseConfig();

  const res = await fetch(
    `${supabaseProjectUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: String(username).trim(),
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
