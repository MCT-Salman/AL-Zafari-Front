import { useState } from "react";
import { authApi } from "../../api/authApi";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import PageHeader from "../../components/common/PageHeader";
import MessageAlert from "../../components/common/MessageAlert";
import { getApiMessage } from "../../utils/api";

export default function PasswordResetOtp() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const normalizePhone = (value) => {
    const trimmed = value.trim();
    if (trimmed.startsWith("+")) return trimmed;
    const digitsOnly = trimmed.replace(/\D/g, "").replace(/^0+/, "");
    return digitsOnly ? `+963${digitsOnly}` : "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const fullPhone = normalizePhone(phone);
    if (!fullPhone) {
      setError("يرجى إدخال رقم هاتف صحيح");
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.forgotPassword(fullPhone);
      setSuccess(getApiMessage(response, "تم إرسال رمز التحقق للمستخدم"));
    } catch (err) {
      setError(err.message || "فشل إرسال رمز التحقق");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 space-y-6 p-4 md:p-8">
      <PageHeader
        title="إرسال رمز إعادة تعيين كلمة المرور"
        subtitle="قم بإرسال OTP للمستخدم عبر رقم الهاتف"
      />

      <Card className="p-6 ">
        {error && (
          <MessageAlert
            type="error"
            message={error}
            dismissable={true}
            onDismiss={() => setError("")}
          />
        )}
        {success && (
          <MessageAlert
            type="success"
            message={success}
            dismissable={true}
            onDismiss={() => setSuccess("")}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">رقم الهاتف</label>
            <Input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="مثال: 912345678"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="bg-primary-f hover:bg-secondary-f text-white"
          >
            {loading ? "جارٍ الإرسال..." : "إرسال OTP"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
