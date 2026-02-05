import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/api/authApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authApi.forgotPassword(phone);
      setSuccess(true);
      
      // Navigate to OTP verification page
      setTimeout(() => {
        navigate("/verify-otp", { state: { phone } });
      }, 1500);
    } catch (err) {
      const msg = err.message || "فشل في إرسال رمز التحقق";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-s flex items-center justify-center px-4">
      <Card className="w-full rounded-xl shadow-3xl border border-primary/50">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-primary-f">
            استعادة كلمة المرور
          </CardTitle>
          <CardDescription>
            أدخل رقم هاتفك لاستلام رمز التحقق
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
                تم إرسال رمز التحقق بنجاح
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium">رقم الهاتف</label>
              <Input
                type="tel"
                placeholder="0599000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading || success}
                className="h-11 pr-10 bg-white"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || success}
              className="w-full h-11 bg-primary-f hover:bg-primary text-white font-medium"
            >
              {loading ? "جاري الإرسال..." : "إرسال رمز التحقق"}
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
