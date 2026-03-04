import { useState, useEffect } from "react";
import { userApi } from "../../api/userApi";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import FilterSelect from "../common/FilterSelect";
import { X } from "lucide-react";
import { getApiData } from "../../utils/api";

const roleLabels = {
  admin: "مسؤول",
  accountant: "محاسب",
  cashier: "أمين الصندوق",
  sales: "مبيعات",
  production_manager: "مدير الإنتاج",
  Warehouse_Keeper: "أمين مستودع",
  Warehouse_Products: "منتجات المستودع",
  Dissection_Technician: "فني التشريح",
  Cutting_Technician: "فني القطع",
  Gluing_Technician: "فني اللصق",
};

export default function UserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    phone: "",
    password: "",
    role: "sales",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.id) {
      // Fetch full user details when editing
      const loadUserDetails = async () => {
        try {
          const response = await userApi.getUserById(user.id);
          const userData = getApiData(response, null);
          // console.log("Loaded user details:", userData); // Debug log
          setFormData({
            username: userData.username || "",
            full_name: userData.full_name || "",
            phone: userData.phone || "",
            role: userData.role || "sales",
            password: "",
          });
        } catch (err) {
          // console.error("Error loading user details:", err);
          // Fallback to the user object passed as prop
          setFormData({
            username: user.username || "",
            full_name: user.full_name || "",
            phone: user.phone || "",
            role: user.role || "sales",
            password: "",
          });
        }
      };
      loadUserDetails();
    } else {
      // Reset form when modal opens for new user
      setFormData({
        username: "",
        full_name: "",
        phone: "",
        password: "",
        role: "sales",
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (value) => {
    // console.log("Role changed to:", value); // Debug log
    setFormData((prev) => ({
      ...prev,
      role: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!formData.username || !formData.full_name || !formData.phone) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      setLoading(false);
      return;
    }

    if (!user && !formData.password) {
      setError("كلمة المرور مطلوبة للمستخدمين الجدد");
      setLoading(false);
      return;
    }

    if (formData.password && formData.password.length < 8) {
      setError("يجب أن تكون كلمة المرور 8 أحرف على الأقل");
      setLoading(false);
      return;
    }

    try {
      const dataToSend = {
        username: formData.username,
        full_name: formData.full_name,
        phone: formData.phone,
        role: formData.role,
      };

      // Only include password if it's provided
      if (formData.password) {
        dataToSend.password = formData.password;
      }

      await onSave(dataToSend);
    } catch (err) {
      setError(err.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">
            {user ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              اسم المستخدم
            </label>
            <Input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="user123"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              الاسم الكامل
            </label>
            <Input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder="أحمد محمد"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              رقم الهاتف
            </label>
            <Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+966501234567"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">كلمة المرور</label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={user ? "اتركه فارغاً لعدم التغيير" : "••••••••"}
              disabled={loading}
            />
            {user && (
              <p className="text-xs text-gray-500 mt-1">
                اتركه فارغاً لعدم تغيير كلمة المرور
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">الدور</label>
            <FilterSelect
              value={formData.role || ""}
              onChange={(e) => handleRoleChange(e.target.value)}
              disabled={loading}
              options={[
                "admin",
                "accountant",
                "cashier",
                "sales",
                "production_manager",
                "Warehouse_Keeper",
                "Warehouse_Products",
                "Dissection_Technician",
                "Cutting_Technician",
                "Gluing_Technician",
              ].map((role) => ({
                value: role,
                label: roleLabels[role] || role,
              }))}
              placeholder="Select role"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
