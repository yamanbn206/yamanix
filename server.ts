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
// إعداد Supabase Admin
// ============================================================
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// دوال مساعدة
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
// نقاط API العامة
// ============================================================
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Fleet Management Server" });
});

// ============================================================
// نقطة نهاية لإنشاء مستخدم جديد
// ============================================================
app.post("/api/admin/create-user", async (req, res) => {
  try {
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

    const { email, password, role, companyId, permissions } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: email.split('@')[0] }
    });

    if (createError) {
      console.error('Create user error:', createError);
      return res.status(400).json({ error: createError.message });
    }

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
        console.error('Profile insert error:', profileError);
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
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
// نقطة نهاية لحذف مستخدم (محسنة)
// ============================================================
app.delete("/api/admin/delete-user/:userId", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No Bearer token provided');
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const user = await authenticateUser(token);
    if (!user) {
      console.error('Invalid token');
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const admin = await isAdmin(user.id);
    if (!admin) {
      console.error('User is not admin:', user.id);
      return res.status(403).json({ error: 'Forbidden: Admin role required' });
    }

    const { userId } = req.params;
    if (!userId) {
      console.error('No userId provided');
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`Attempting to delete user: ${userId} by admin: ${user.id}`);

    // حذف الملف الشخصي أولاً (لتجنب قيود المفتاح الأجنبي)
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileDeleteError) {
      console.error('Profile deletion error:', profileDeleteError);
      // لا نوقف التنفيذ هنا، نكمل لحذف من Auth
    }

    // حذف المستخدم من Auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('Auth deletion error:', deleteError);
      return res.status(400).json({ error: deleteError.message });
    }

    console.log(`User ${userId} deleted successfully`);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ============================================================
// نقطة نهاية لإعادة تعيين كلمة المرور
// ============================================================
app.post("/api/admin/reset-password", async (req, res) => {
  try {
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

    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    const { data: userData, error: findError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (findError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Reset password error:', updateError);
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err: any) {
    console.error('Error resetting password:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ============================================================
// نقاط AI (مختصرة)
// ============================================================
app.post("/api/ai-analysis", (req, res) => {
  res.json({ analysis: "AI analysis placeholder" });
});
app.post("/api/ai-expense-summary", (req, res) => {
  res.json({ summary: "Expense summary placeholder" });
});
app.post("/api/ocr-scan", (req, res) => {
  res.json({ data: {} });
});

// ============================================================
// خدمة الملفات الثابتة
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