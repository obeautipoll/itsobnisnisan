import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: join(__dirname, ".env"), override: true });

const app = express();
const port = process.env.PORT || 4000;
const configuredOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,https://itsobnisnisan.vercel.app")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const corsOptions = {
  origin(origin, callback) {
    const isAllowed =
      !origin ||
      configuredOrigins.includes(origin) ||
      (process.env.NODE_ENV !== "production" && localOriginPattern.test(origin));

    callback(null, isAllowed);
  },
  credentials: true,
  optionsSuccessStatus: 204,
};

app.options("*", cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

if (!process.env.DEFAULT_USER_EMAIL || !process.env.DEFAULT_USER_PASSWORD) {
  throw new Error("DEFAULT_USER_EMAIL and DEFAULT_USER_PASSWORD are required.");
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_API_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_API_KEY are required.");
}

if (!process.env.CMS_JWT_SECRET) {
  throw new Error("CMS_JWT_SECRET is required.");
}

const supabaseUrl = process.env.SUPABASE_URL.endsWith("/")
  ? process.env.SUPABASE_URL
  : `${process.env.SUPABASE_URL}/`;
const supabaseOrigin = new URL(supabaseUrl).origin;
const supabaseServerKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;
const supabaseHeaders = {
  apikey: supabaseServerKey,
  Authorization: `Bearer ${supabaseServerKey}`,
  "Content-Type": "application/json",
};
const supabaseStorageBucket =
  process.env.SUPABASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;

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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const supabaseRequest = async (
  table,
  { query = "", method = "GET", body, prefer } = {}
) => {
  const response = await fetch(`${supabaseUrl}${table}${query}`, {
    method,
    headers: {
      ...supabaseHeaders,
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase ${method} ${table} failed: ${message}`);
  }

  if (response.status === 204) return null;
  return response.json();
};

const readSingle = async (table, query) => {
  const rows = await supabaseRequest(table, { query: `${query}&limit=1` });
  return Array.isArray(rows) ? rows[0] : null;
};

const getSectionData = async (section) => {
  const row = await readSingle(
    "content_sections",
    `?section=eq.${encodeURIComponent(section)}&select=data`
  );
  return row?.data || null;
};

const saveSectionData = async (section, data) =>
  supabaseRequest("content_sections", {
    method: "POST",
    query: "?on_conflict=section",
    prefer: "resolution=merge-duplicates,return=representation",
    body: { section, data },
  });

const saveMediaAsset = async (asset) =>
  supabaseRequest("media_assets", {
    method: "POST",
    prefer: "return=representation",
    body: asset,
  });

const ensureDefaultUser = async () => {
  const email = process.env.DEFAULT_USER_EMAIL;
  const username = (process.env.DEFAULT_USERNAME || email.split("@")[0])
    .trim()
    .toLowerCase();
  const password = process.env.DEFAULT_USER_PASSWORD;

  const existing = await readSingle(
    "users",
    `?or=(email.eq.${encodeURIComponent(email)},username.eq.${encodeURIComponent(username)})&select=id`
  );
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 10);
  await supabaseRequest("users", {
    method: "POST",
    prefer: "return=representation",
    body: {
      username,
      email,
      password_hash: passwordHash,
      role: "admin",
    },
  });
};

ensureDefaultUser().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to ensure default user:", err);
});

const createCmsToken = (user) =>
  jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role || "admin",
    },
    process.env.CMS_JWT_SECRET,
    { expiresIn: "12h" }
  );

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.CMS_JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const requireCmsRole = (req, res, next) => {
  if (!["admin", "editor"].includes(req.user?.role)) {
    return res.status(403).json({ error: "Admin or editor role required" });
  }
  return next();
};

app.get("/api/health", asyncHandler(async (_req, res) => {
  const checks = {
    api: true,
    supabase: false,
  };

  try {
    await supabaseRequest("content_sections", {
      query: "?select=section&limit=1",
    });
    checks.supabase = true;
  } catch (err) {
    return res.status(503).json({
      ok: false,
      checks,
      error: err.message,
    });
  }

  return res.json({ ok: true, checks });
}));

app.post("/api/login", asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const loginName = String(username).trim().toLowerCase();
  let user = null;

  try {
    user = await readSingle(
      "users",
      `?or=(email.eq.${encodeURIComponent(loginName)},username.eq.${encodeURIComponent(loginName)})&select=id,username,email,password_hash,role`
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Database login lookup failed:", err);
  }

  if (user) {
    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.json({ token: createCmsToken(user) });
  }

  return res.status(401).json({ error: "Invalid credentials" });
}));

app.get("/api/content", asyncHandler(async (_req, res) => {
  const reads = await Promise.all(
    sectionNames.map(async (section) => {
      const data = await getSectionData(section);
      return [section, data];
    })
  );

  const content = reads.reduce((acc, [section, data]) => {
    if (data) acc[section] = data;
    return acc;
  }, {});

  return res.json({ content: Object.keys(content).length ? content : null });
}));

app.put("/api/content", requireAuth, requireCmsRole, asyncHandler(async (req, res) => {
  const { content } = req.body || {};
  if (!content || typeof content !== "object") {
    return res.status(400).json({ error: "Content object required" });
  }

  const writes = sectionNames.map((section) => {
    if (content[section] === undefined) return null;
    return saveSectionData(section, content[section]);
  });

  try {
    await Promise.all(writes.filter(Boolean));
    return res.json({ ok: true });
  } catch (err) {
    const message = err.message || "Failed to save content.";
    const status = message.includes("row-level security") ? 403 : 500;
    return res.status(status).json({
      error: message,
    });
  }
}));

app.post(
  "/api/upload",
  requireAuth,
  requireCmsRole,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const allowedMimeTypes = new Set(["application/pdf"]);
    const isImage = req.file.mimetype.startsWith("image/");
    const isAllowedFile = isImage || allowedMimeTypes.has(req.file.mimetype);

    if (!isAllowedFile) {
      return res.status(400).json({
        error: "Only image and PDF uploads are allowed.",
      });
    }

    if (!supabaseStorageBucket) {
      return res.status(501).json({
        error:
          "SUPABASE_STORAGE_BUCKET is required for uploads. Set it to an existing Supabase Storage bucket name.",
      });
    }

    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileTypeFolder = isImage ? "images" : "documents";
    const fileName = `${fileTypeFolder}/${Date.now()}-${safeName}`;
    const uploadResponse = await fetch(
      `${supabaseOrigin}/storage/v1/object/${supabaseStorageBucket}/${fileName}`,
      {
        method: "POST",
        headers: {
          apikey: supabaseServerKey,
          Authorization: `Bearer ${supabaseServerKey}`,
          "Content-Type": req.file.mimetype,
          "x-upsert": "false",
        },
        body: req.file.buffer,
      }
    );

    if (!uploadResponse.ok) {
      const message = await uploadResponse.text();
      return res.status(uploadResponse.status).json({
        error: `Supabase upload failed: ${message}`,
      });
    }

    const publicUrl = `${supabaseOrigin}/storage/v1/object/public/${supabaseStorageBucket}/${fileName}`;
    let asset = null;

    try {
      const rows = await saveMediaAsset({
        bucket: supabaseStorageBucket,
        path: fileName,
        public_url: publicUrl,
        file_name: req.file.originalname,
        mime_type: req.file.mimetype,
        file_size: req.file.size,
        asset_type: isImage ? "image" : "pdf",
        related_section: req.body?.section || null,
      });
      asset = Array.isArray(rows) ? rows[0] : null;
    } catch (err) {
      // Upload should still succeed if the optional metadata table is missing.
      // eslint-disable-next-line no-console
      console.error("Failed to save media asset metadata:", err);
    }

    return res.json({
      asset,
      url: publicUrl,
      path: fileName,
    });
  })
);

app.get("/api/media-assets", requireAuth, requireCmsRole, asyncHandler(async (_req, res) => {
  const assets = await supabaseRequest("media_assets", {
    query: "?select=*&order=created_at.desc&limit=100",
  });

  return res.json({ assets });
}));

app.post("/api/contact", asyncHandler(async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message required" });
  }

  await supabaseRequest("messages", {
    method: "POST",
    prefer: "return=representation",
    body: {
      name,
      email,
      message,
    },
  });

  return res.json({ ok: true });
}));

app.get("/api/messages", requireAuth, requireCmsRole, asyncHandler(async (_req, res) => {
  const messages = await supabaseRequest(
    "messages",
    { query: "?select=*&order=created_at.desc&limit=50" }
  );

  return res.json({ messages });
}));

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error("API error:", err);
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File is too large. Upload an image or PDF up to 20 MB."
        : err.message;
    return res.status(413).json({ error: message });
  }
  res.status(500).json({ error: "Server error" });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`CMS API running on http://localhost:${port}`);
});
