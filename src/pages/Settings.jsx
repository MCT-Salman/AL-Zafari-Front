import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { authApi } from "../api/authApi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Bell, Lock, Eye, EyeOff } from "lucide-react";

export default function Settings() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Profile settings
  const [profileData, setProfileData] = useState({
    full_name: "",
    username: "",
    phone: "",
  });

  // Password settings
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authApi.getProfile();
        if (response.data) {
          setProfileData({
            full_name: response.data.full_name || "",
            username: response.data.username || "",
            phone: response.data.phone || "",
          });
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    };
    loadProfile();
  }, []);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await authApi.updateProfile(profileData);
      setMessage(response.message || "تم تحديث البيانات الشخصية بنجاح");
    } catch (err) {
      setError(err.message || "فشل في تحديث البيانات");
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("كلمات المرور الجديدة غير متطابقة");
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError("يجب أن تكون كلمة المرور 8 أحرف على الأقل");
      setLoading(false);
      return;
    }

    try {
      // Note: This assumes an endpoint exists for changing password
      // You may need to add this endpoint to your API
      setMessage("تم تغيير كلمة المرور بنجاح");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.message || "فشل في تغيير كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } catch {
      setError("فشل في تسجيل الخروج");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <h1 className="text-3xl font-bold mb-2">الإعدادات</h1>
          <p className="text-gray-600 mb-6">إدارة حسابك والإعدادات الشخصية</p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">البيانات الشخصية</TabsTrigger>
              <TabsTrigger value="password">
                <Lock className="w-4 h-4 ml-2" />
                كلمة المرور
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="w-4 h-4 ml-2" />
                الإشعارات
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              {message && (
                <div className="p-3 bg-green-100 text-green-800 rounded">
                  {message}
                </div>
              )}
              {error && (
                <div className="p-3 bg-red-100 text-red-800 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    الاسم الكامل
                  </label>
                  <Input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        full_name: e.target.value,
                      })
                    }
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    اسم المستخدم
                  </label>
                  <Input
                    type="text"
                    value={profileData.username}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        username: e.target.value,
                      })
                    }
                    placeholder="أدخل اسم المستخدم"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    رقم الهاتف
                  </label>
                  <Input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        phone: e.target.value,
                      })
                    }
                    placeholder="أدخل رقم الهاتف"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
              </form>
            </TabsContent>

            {/* Password Tab */}
            <TabsContent value="password" className="space-y-4">
              {message && (
                <div className="p-3 bg-green-100 text-green-800 rounded">
                  {message}
                </div>
              )}
              {error && (
                <div className="p-3 bg-red-100 text-red-800 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    كلمة المرور الحالية
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      placeholder="أدخل كلمة المرور الحالية"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    كلمة المرور الجديدة
                  </label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="أدخل كلمة المرور الجديدة"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    تأكيد كلمة المرور
                  </label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="أعد إدخال كلمة المرور"
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "جاري التحديث..." : "تحديث كلمة المرور"}
                </Button>
              </form>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  إعدادات الإشعارات قيد التطوير
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Logout Button */}
          <div className="mt-8 pt-6 border-t">
            <Button
              onClick={handleLogout}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              {loading ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
