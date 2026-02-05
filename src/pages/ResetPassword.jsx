import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authApi } from "@/api/authApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const resetToken = location.state?.resetToken || "";
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      return;
    }

    if (password.length < 8) {
      setError("يجب أن تكون كلمة المرور 8 أحرف على الأقل");
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(resetToken, password);
      setSuccess(true);
      
      // Navigate to login page
      setTimeout(() => {
        navigate("/login", { state: { message: "تم تغيير كلمة المرور بنجاح" } });
      }, 1500);
    } catch (err) {
      const msg = err.message || "فشل في تغيير كلمة المرور";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <div className="min-h-screen bg-primary-s flex items-center justify-center px-4">
        <Card className="w-full rounded-xl">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 font-medium mb-4">توكن غير صالح</p>
            <Button
              onClick={() => navigate("/forgot-password")}
              className="bg-primary-f hover:bg-primary"
            >
              ابدأ من جديد
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-s flex items-center justify-center px-4">
      <Card className="w-full rounded-xl shadow-3xl border border-primary/50">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-primary-f">
            تعيين كلمة المرور الجديدة
          </CardTitle>
          <CardDescription>
            أدخل كلمة المرور الجديدة الخاصة بك
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-100 text-red-800 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">
                تم تغيير كلمة المرور بنجاح
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium">كلمة المرور الجديدة</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading || success}
                  className="h-11 pr-10 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || success}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">تأكيد كلمة المرور</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading || success}
                  className="h-11 pr-10 bg-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || success}
              className="w-full h-11 bg-primary-f hover:bg-primary text-white font-medium"
            >
              {loading ? "جاري التحديث..." : "تحديث كلمة المرور"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/login")}
              className="w-full text-primary-f"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة إلى تسجيل الدخول
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
