import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// Login Page (standalone)
// صفحة تسجيل الدخول (بدون الـ MainLayout)
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: integrate auth API
      // ملاحظة: هنا يتم دمج واجهة برمجة تسجيل الدخول لاحقًا
      await new Promise((r) => setTimeout(r, 600));
      login({ username: form.username });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen  bg-surface flex items-center justify-center p-4">
      <Card className="w-[25%]  shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl">تسجيل الدخول • Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            {/* username */}
            <div>
              <label className="block text-sm mb-1 text-text-strong">اسم المستخدم / username</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
                <Input
                  name="username"
                  type="text"
                  placeholder="username"
                  value={form.username}
                  onChange={onChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm mb-1 text-text-strong">كلمة المرور / Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
                <Input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={onChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "جاري الدخول..." : "دخول"}
            </Button>

            <div className="text-center text-sm text-text-subtle">
              <span>نسيت كلمة المرور؟</span> <Link to="#" className="text-secondary-s hover:underline">استعادة</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
