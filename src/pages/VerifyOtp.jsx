// src\pages\VerifyOtp.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authApi } from "@/api/authApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { getApiData } from "@/utils/api";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone || "";
  
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authApi.verifyOtp(phone, otp);
      const data = getApiData(response, null);
      setSuccess(true);
      
      // Navigate to reset password page
      setTimeout(() => {
        navigate("/reset-password", { state: { resetToken: data?.resetToken } });
      }, 1500);
    } catch (err) {
      const msg = err.message || "فشل التحقق من الرمز";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!phone) {
    return (
      <div className="min-h-screen bg-primary-s flex items-center justify-center px-4">
        <Card className="w-full rounded-xl">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 font-medium mb-4">لم يتم العثور على رقم الهاتف</p>
            <Button
              onClick={() => navigate("/forgot-password")}
              className="bg-primary-f hover:bg-primary"
            >
              العودة إلى استعادة كلمة المرور
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
            التحقق من الرمز
          </CardTitle>
          <CardDescription>
            أدخل الرمز المرسل إلى {phone}
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
                تم التحقق بنجاح
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium">رمز التحقق</label>
              <Input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={loading || success}
                maxLength="6"
                className="h-11 pr-10 bg-white text-center text-2xl tracking-widest"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || success}
              className="w-full h-11 bg-primary-f hover:bg-primary text-white font-medium"
            >
              {loading ? "جاري التحقق..." : "تحقق من الرمز"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/forgot-password")}
              className="w-full text-primary-f"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة إلى الخطوة السابقة
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
