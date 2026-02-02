import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import admin from "firebase-admin";

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

const serviceAccount = JSON.parse(serviceAccountJson);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
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

app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  if (
    username !== process.env.CMS_USERNAME ||
    password !== process.env.CMS_PASSWORD
  ) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { username },
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

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`CMS API running on http://localhost:${port}`);
});
