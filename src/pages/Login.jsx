// src\pages\Login.jsx
// import { Mail, Lock } from "lucide-react";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "@/context/AuthContext";

// // Login Page (standalone)
// // صفحة تسجيل الدخول (بدون الـ MainLayout)
// export default function Login() {
//   const navigate = useNavigate();
//   const { login } = useAuth();
//   const [form, setForm] = useState({ username: "", password: "" });
//   const [loading, setLoading] = useState(false);

//   const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  
//   const onSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       // TODO: integrate auth API
//       // ملاحظة: هنا يتم دمج واجهة برمجة تسجيل الدخول لاحقًا
//       await new Promise((r) => setTimeout(r, 600));
//       login({ username: form.username });
//       navigate("/dashboard");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen  bg-surface flex items-center justify-center p-4">
//       <Card className="w-[25%]  shadow-lg">
//         <CardHeader>
//           <CardTitle className="text-center text-xl">تسجيل الدخول • Login</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <form className="space-y-4" onSubmit={onSubmit}>
//             {/* username */}
//             <div>
//               <label className="block text-sm mb-1 text-text-strong">اسم المستخدم / username</label>
//               <div className="relative">
//                 <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
//                 <Input
//                   name="username"
//                   type="text"
//                   placeholder="username"
//                   value={form.username}
//                   onChange={onChange}
//                   className="pl-10"
//                   required
//                 />
//               </div>
//             </div>

//             {/* Password */}
//             <div>
//               <label className="block text-sm mb-1 text-text-strong">كلمة المرور / Password</label>
//               <div className="relative">
//                 <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
//                 <Input
//                   name="password"
//                   type="password"
//                   placeholder="••••••••"
//                   value={form.password}
//                   onChange={onChange}
//                   className="pl-10"
//                   required
//                 />
//               </div>
//             </div>

//             <Button type="submit" className="w-full" disabled={loading}>
//               {loading ? "جاري الدخول..." : "دخول"}
//             </Button>

//             <div className="text-center text-sm text-text-subtle">
//               <span>نسيت كلمة المرور؟</span> <Link to="#" className="text-secondary-s hover:underline">استعادة</Link>
//             </div>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }


// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; // الـ Hook الخاص بك
import { AuthTemplate } from "@/components/auth/AuthTemplate"; // المكون الجديد

// Assets
import logoImg from "/vite.svg";
import heroImg from "/vite.svg"; 

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");

  // 1. التعامل مع رسائل انتهاء الجلسة من الـ URL
  useEffect(() => {
    const message = searchParams.get('message');
    if (message) setError(decodeURIComponent(message));
  }, [searchParams]);

  // 2. التوجيه التلقائي إذا كان مسجلاً للدخول
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // 3. دالة تسجيل الدخول التي سيستدعيها المكون
  const handleLoginSubmit = async (formData) => {
    setError(""); // تصفير الأخطاء السابقة
    try {
      await login(formData.username, formData.password);
      // النجاح: التوجيه سيتم عبر useEffect أو هنا مباشرة
    } catch (err) {
      // استخراج رسالة الخطأ
      const msg = err.response?.data?.message || err.message || "فشل تسجيل الدخول";
      setError(msg);
      throw err; // رمي الخطأ ليقوم المكون بوقف الـ loading
    }
  };

  return (
    <AuthTemplate
      // النصوص والصور
      title="مرحباً بعودتك"
      description="سجل دخولك للمتابعة إلى لوحة التحكم"
      logo={logoImg}
      heroImage={heroImg}
      heroTitle="منصة تعلّم التعليمية"
      heroDescription="نظام متكامل لإدارة العملية التعليمية ومتابعة الطلاب والمعلمين بكفاءة عالية."
      
      // الدوال والبيانات
      onSubmit={handleLoginSubmit}
      onForgotPassword={() => navigate("/forgot-password")}
      error={error}
      
      // تخصيصات إضافية (اختياري)
      identifierLabel="اسم المستخدم"
    />
  );
}