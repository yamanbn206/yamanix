import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));

// ============================================================
// إعداد Supabase Admin (للتحقق من التوكن)
// ============================================================
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// دوال مساعدة للتحقق من المصادقة والصلاحيات
// ============================================================
async function authenticateUser(token: string) {
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

async function isAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'admin';
}

// ============================================================
// Middleware لحماية نقاط API التي تحتاج صلاحية أدمن
// ============================================================
async function adminGuard(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const token = authHeader.split(' ')[1];
  const user = await authenticateUser(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
  const admin = await isAdmin(user.id);
  if (!admin) {
    return res.status(403).json({ error: 'Forbidden: Admin role required' });
  }
  req.user = user;
  next();
}

// ============================================================
// نقاط API العامة
// ============================================================
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Fleet Management Server" });
});

app.post("/api/ai-analysis", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    const { fleetData, lang = "ar" } = req.body;
    const isAr = lang === "ar";

    const ai = new GoogleGenAI({ apiKey });
    const prompt = isAr
      ? `أنت استشاري خبير في إدارة أسطول المركبات...` // استخدم النص الكامل كما كان
      : `You are a fleet management expert...`; // النص الإنجليزي

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ analysis: response.text });
  } catch (err: any) {
    console.error("AI Analysis error:", err);
    res.status(500).json({ error: err.message || "An error occurred during AI analysis." });
  }
});

// ============================================================
// نقاط API المحمية (للأدمن)
// ============================================================
app.get("/api/admin/users", adminGuard, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/users/:userId/role", adminGuard, async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  if (!role || !['admin', 'manager', 'user', 'disabled'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// خدمة الملفات الثابتة (في الإنتاج)
// ============================================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();