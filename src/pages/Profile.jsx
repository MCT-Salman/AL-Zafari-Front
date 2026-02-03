import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Save, Camera } from "lucide-react";
import { useState } from "react";

// Profile page | صفحة الملف الشخصي
export default function Profile() {
  const [formData, setFormData] = useState({
    fullName: "أحمد محمد",
    email: "ahmed@example.com",
    phone: "+966 50 123 4567"
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-primary-s rounded-lg p-6 border border-border">
        <h1 className="text-2xl font-bold text-text-strong mb-2">الملف الشخصي • Profile</h1>
        <p className="text-text-subtle">إدارة معلوماتك الشخصية • Manage your personal information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="bg-surface border border-border">
            <CardHeader>
              <CardTitle className="text-text-strong">الصورة الشخصية • Photo</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-secondary-f to-secondary-s flex items-center justify-center text-white text-2xl font-bold mx-auto">
                  أ م
                </div>
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 bg-secondary-s hover:bg-secondary-f text-primary-s"
                >
                  <Camera size={16} />
                </Button>
              </div>
              <h3 className="mt-4 font-semibold text-text-strong">{formData.fullName}</h3>
              <p className="text-sm text-text-subtle">{formData.email}</p>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          <Card className="bg-surface border border-border">
            <CardHeader>
              <CardTitle className="text-text-strong">المعلومات الشخصية • Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fullName" className="text-text-strong flex items-center gap-2">
                    <User size={16} />
                    الاسم الكامل • Full Name
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="mt-1 bg-primary-alpha border-border text-text-strong"
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-text-strong flex items-center gap-2">
                    <Mail size={16} />
                    البريد الإلكتروني • Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 bg-primary-alpha border-border text-text-strong"
                    placeholder="أدخل بريدك الإلكتروني"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-text-strong flex items-center gap-2">
                    <Phone size={16} />
                    رقم الهاتف • Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 bg-primary-alpha border-border text-text-strong"
                    placeholder="أدخل رقم هاتفك"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-secondary-s hover:bg-secondary-f text-primary-s flex items-center gap-2"
                  >
                    <Save size={16} />
                    {loading ? "جاري الحفظ..." : "حفظ التغييرات • Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border text-text-strong hover:bg-primary-alpha"
                  >
                    إلغاء • Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
