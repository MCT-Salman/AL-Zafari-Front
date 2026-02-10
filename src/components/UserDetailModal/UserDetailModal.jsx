import { useState, useEffect } from "react";
import { userApi } from "../../api/userApi";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function UserDetailModal({ userId, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  const loadUserDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await userApi.getUserById(userId);
      setUser(response.data);
    } catch (err) {
      setError(err.message || "فشل في تحميل بيانات المستخدم");
    } finally {
      setLoading(false);
    }
  };

  if (!user && !loading) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">تفاصيل الحساب</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-6 text-center">جاري التحميل...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : user ? (
          <div className="p-6 space-y-6">
            {/* Profile Section */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    معلومات الملف الشخصي
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">الاسم الكامل</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {user.full_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">اسم المستخدم</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {user.username}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">رقم الهاتف</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {user.phone}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {user.email || "غير محدد"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Account Status Section */}
            <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  حالة الحساب
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">الدور</p>
                    <Badge
                      className="mt-1"
                      variant={user.role === "admin" ? "default" : "secondary"}
                    >
                      {user.role === "admin"
                        ? "مسؤول"
                        : user.role === "sales"
                        ? "مبيعات"
                        : user.role}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">حالة الحساب</p>
                    <Badge
                      className="mt-1"
                      variant={user.is_active ? "default" : "destructive"}
                    >
                      {user.is_active ? "نشط" : "معطل"}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Location Section */}
            {(user.country || user.countryCode) && (
              <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    معلومات الموقع
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">الدولة</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {user.country || "غير محدد"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">رمز الدولة</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {user.countryCode || "غير محدد"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Additional Info */}
            {(user.notes || user.fcmToken) && (
              <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    معلومات إضافية
                  </h3>

                  {user.fcmToken && (
                    <div>
                      <p className="text-sm text-gray-600">رمز الإشعارات</p>
                      <p className="text-sm font-mono text-gray-900 break-all">
                        {user.fcmToken}
                      </p>
                    </div>
                  )}

                  {user.notes && (
                    <div>
                      <p className="text-sm text-gray-600">ملاحظات</p>
                      <p className="text-gray-900">{user.notes}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Dates Section */}
            <Card className="p-6 bg-gray-50">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  سجل الأنشطة
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">تاريخ الإنشاء</p>
                    <p className="text-gray-900">
                      {user.created_at
                        ? format(new Date(user.created_at), "PPP p", {
                            locale: ar,
                          })
                        : "غير محدد"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">آخر تحديث</p>
                    <p className="text-gray-900">
                      {user.updated_at
                        ? format(new Date(user.updated_at), "PPP p", {
                            locale: ar,
                          })
                        : "غير محدد"}
                    </p>
                  </div>

                  {user.currentSessionId && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">معرف الجلسة الحالية</p>
                      <p className="text-sm font-mono text-gray-900 break-all">
                        {user.currentSessionId}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* User ID */}
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">معرف المستخدم</p>
              <p className="text-lg font-semibold text-gray-900">{user.id}</p>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50 sticky bottom-0">
          <Button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            إغلاق
          </Button>
        </div>
      </div>
    </div>
  );
}
