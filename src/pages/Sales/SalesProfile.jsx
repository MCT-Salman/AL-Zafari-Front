import { useEffect, useState } from "react";
import { authApi } from "../../api/authApi";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import PageHeader from "../../components/common/PageHeader";
import MessageAlert from "../../components/common/MessageAlert";
import { getApiData, getApiMessage } from "../../utils/api";

export default function SalesProfile() {
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authApi.getProfile();
        const data = getApiData(response, null);
        if (data) {
          setFormData({
            full_name: data.full_name || "",
            username: data.username || "",
            phone: (data.phone || "").replace(/^(\+963|00963|963)/, "").replace(/^0+/, ""),
          });
        }
      } catch (err) {
        setError(err.message || "فشل في تحميل الملف الشخصي");
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "").replace(/^0+/, "");
      setFormData((prev) => ({ ...prev, phone: digitsOnly }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const dataToSend = {
        ...formData,
        phone: formData.phone
          ? `+963${formData.phone.replace(/\D/g, "").replace(/^0+/, "")}`
          : "",
      };
      const response = await authApi.updateProfile(dataToSend);
      setMessage(getApiMessage(response, "تم تحديث الملف الشخصي بنجاح"));
    } catch (err) {
      setError(err.message || "فشل في تحديث الملف الشخصي");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <PageHeader
        title="الملف الشخصي للمبيعات"
        subtitle="واجهة لمس مبسطة لإدارة بيانات الحساب"
      />

      <Card className="p-6 max-w-2xl">
        {error && (
          <MessageAlert
            type="error"
            message={error}
            dismissable={true}
            onDismiss={() => setError("")}
          />
        )}
        {message && (
          <MessageAlert
            type="success"
            message={message}
            dismissable={true}
            onDismiss={() => setMessage("")}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base">الاسم الكامل</Label>
            <Input
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              className="h-12 text-lg"
              placeholder="أدخل الاسم الكامل"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base">اسم المستخدم</Label>
            <Input
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="h-12 text-lg"
              placeholder="أدخل اسم المستخدم"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base">رقم الهاتف</Label>
            <div className="flex items-center gap-2">
              <span className="h-12 px-3 flex items-center rounded-lg border bg-gray-100 text-sm font-bold" dir="ltr">
                +963
              </span>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="h-12 text-lg"
                placeholder="912345678"
                disabled={loading}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-lg bg-primary-f hover:bg-secondary-f"
          >
            {loading ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
