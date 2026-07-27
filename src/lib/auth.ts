import { supabase } from './supabase';
import { User, Profile } from '../types';

export const auth = {
  // تسجيل الدخول (البريد الإلكتروني + كلمة المرور)
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  // إنشاء حساب جديد (يُستخدم من الأدمن فقط)
  signUp: async (email: string, password: string, role: string = 'user') => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // إنشاء الملف الشخصي (profile)
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email,
        role: role,
      });
    }
    return data;
  },

  // تسجيل الخروج
  signOut: async () => {
    await supabase.auth.signOut();
  },

  // جلب الملف الشخصي للمستخدم الحالي
  getProfile: async (): Promise<Profile | null> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();

    return data;
  },

  // جلب قائمة المستخدمين (لصفحة إدارة المستخدمين)
  listUsers: async (): Promise<Profile[]> => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    return data || [];
  },

  // تحديث دور مستخدم (للأدمن فقط)
  updateRole: async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    if (error) throw error;
  },

  // حذف مستخدم (للأدمن فقط)
  deleteUser: async (userId: string) => {
    // Supabase لا يسمح بحذف مستخدم عبر client SDK، لذا سنستدعي Edge Function أو API
    // الحل البديل: تعطيل الحساب بتحديث role إلى 'disabled'
    await supabase.from('profiles').update({ role: 'disabled' }).eq('id', userId);
  }
};