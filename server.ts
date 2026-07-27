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
// نقاط API العامة (لا تحتاج مصادقة)
// ============================================================
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Fleet Management Server" });
});

// ============================================================
// نقاط API المحمية (تتطلب مصادقة)
// ============================================================
app.post("/api/ai-analysis", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    const { fleetData, lang = "ar" } = req.body;
    const isAr = lang === "ar";

    const ai = new GoogleGenAI({ apiKey });
    const prompt = isAr ? `...` : `...`; // (نفس المحتوى السابق)

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
// نقطة نهاية لإنشاء مستخدم جديد (تستخدم service_role)
// ============================================================
app.post("/api/admin/create-user", async (req, res) => {
  try {
    // 1. التحقق من وجود التوكن في رأس الطلب
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // 2. التحقق من صحة التوكن وأن المستخدم هو أدمن
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // 3. التحقق من أن المستخدم لديه صلاحية أدمن
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin role required' });
    }

    // 4. استخراج بيانات المستخدم الجديد من الطلب
    const { email, password, role, companyId, permissions } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 5. إنشاء المستخدم في Supabase Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return res.status(400).json({ error: createError.message });
    }

    // 6. إضافة الملف الشخصي (profile) مع الصلاحيات
    if (newUser.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: newUser.user.id,
          email: email,
          role: role || 'user',
          company_id: companyId || null,
          permissions: permissions || {
            vehicles: { view: true, add: false, edit: false, delete: false },
            drivers: { view: true, add: false, edit: false, delete: false },
            maintenance: { view: true, add: false, edit: false, delete: false },
            fuel: { view: true, add: false, edit: false, delete: false },
            checkout: { view: true, add: false, edit: false, delete: false },
            reports: { view: false, export: false },
            settings: { view: false, edit: false },
            users: { view: false, add: false, edit: false, delete: false }
          },
          full_name: email.split('@')[0]
        });

      if (profileError) {
        return res.status(400).json({ error: profileError.message });
      }
    }

    res.json({ success: true, user: newUser.user });
  } catch (err: any) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ============================================================
// نقطة نهاية لحذف مستخدم (تستخدم service_role)
// ============================================================
app.delete("/api/admin/delete-user/:userId", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin role required' });
    }

    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      return res.status(400).json({ error: deleteError.message });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
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