import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import admin from "firebase-admin";
import multer from "multer";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is required.");
}

if (!process.env.FIREBASE_STORAGE_BUCKET) {
  throw new Error("FIREBASE_STORAGE_BUCKET is required.");
}

if (!process.env.DEFAULT_USER_EMAIL || !process.env.DEFAULT_USER_PASSWORD) {
  throw new Error("DEFAULT_USER_EMAIL and DEFAULT_USER_PASSWORD are required.");
}

const serviceAccount = JSON.parse(serviceAccountJson);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const db = admin.firestore();
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

const getSectionRef = (section) => db.collection(section).doc("main");
const messagesRef = db.collection("messages");
const usersRef = db.collection("users");
const bucket = admin.storage().bucket();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const ensureDefaultUser = async () => {
  const email = process.env.DEFAULT_USER_EMAIL;
  const password = process.env.DEFAULT_USER_PASSWORD;

  const existing = await usersRef.where("email", "==", email).limit(1).get();
  if (!existing.empty) return;

  const passwordHash = await bcrypt.hash(password, 10);
  await usersRef.add({
    email,
    passwordHash,
    role: "admin",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

ensureDefaultUser().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to ensure default user:", err);
});

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

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const email = String(username).trim().toLowerCase();
  const snapshot = await usersRef.where("email", "==", email).limit(1).get();
  const userDoc = snapshot.docs[0];

  if (!userDoc) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const user = userDoc.data();
  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { userId: userDoc.id, email: user.email, role: user.role || "admin" },
    process.env.CMS_JWT_SECRET,
    { expiresIn: "12h" }
  );

  return res.json({ token });
});

app.get("/api/content", async (_req, res) => {
  const reads = await Promise.all(
    sectionNames.map(async (section) => {
      const snapshot = await getSectionRef(section).get();
      return [section, snapshot.exists ? snapshot.data() : null];
    })
  );

  const content = reads.reduce((acc, [section, data]) => {
    if (data) acc[section] = data;
    return acc;
  }, {});

  return res.json({ content: Object.keys(content).length ? content : null });
});

app.put("/api/content", requireAuth, async (req, res) => {
  const { content } = req.body || {};
  if (!content || typeof content !== "object") {
    return res.status(400).json({ error: "Content object required" });
  }

  const writes = sectionNames.map((section) => {
    if (content[section] === undefined) return null;
    return getSectionRef(section).set(content[section], { merge: true });
  });

  await Promise.all(writes.filter(Boolean));
  return res.json({ ok: true });
});

app.post(
  "/api/upload",
  requireAuth,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({ error: "Only image uploads are allowed" });
    }

    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `uploads/${Date.now()}-${safeName}`;
    const file = bucket.file(fileName);

    await file.save(req.file.buffer, {
      contentType: req.file.mimetype,
      resumable: false,
    });

    await file.makePublic();

    return res.json({
      url: `https://storage.googleapis.com/${bucket.name}/${fileName}`,
      path: fileName,
    });
  }
);

app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message required" });
  }

  await messagesRef.add({
    name,
    email,
    message,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return res.json({ ok: true });
});

app.get("/api/messages", requireAuth, async (_req, res) => {
  const snapshot = await messagesRef
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const messages = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return res.json({ messages });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`CMS API running on http://localhost:${port}`);
});
