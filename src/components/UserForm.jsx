// src\components\UserForm.jsx
import { useEffect } from "react";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { UserRoleLabels } from "../enums";

const roleLabels = {
  admin: "مسؤول",
  accountant: "محاسب",
  cashier: "أمين الصندوق",
  sales: "مبيعات",
  production_manager: "مدير الإنتاج",
  Warehouse_Keeper: "حارس المستودع",
  Warehouse_Products: "منتجات المستودع",
  Dissection_Technician: "فني التشريح",
  Cutting_Technician: "فني القطع",
  Gluing_Technician: "فني اللصق",
};

export default function UserForm({ user, formData, setFormData, loading, error }) {
  useEffect(() => {
    if (user && user.id) {
      // Set form data from user prop
      setFormData({
        username: user.username || "",
        full_name: user.full_name || "",
        phone: user.phone || "",
        role: user.role || "sales",
        password: "",
      });
    } else {
      // Reset form for new user
      setFormData({
        username: "",
        full_name: "",
        phone: "",
        password: "",
        role: "sales",
      });
    }
  }, [user, setFormData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      role: value,
    }));
  };

  return (
    <>
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
          value={formData.username || ""}
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
          value={formData.full_name || ""}
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
          value={formData.phone || ""}
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
          value={formData.password || ""}
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
        <Select 
          value={formData.role || ""} 
          onValueChange={handleRoleChange}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر الدور">
              {formData.role && roleLabels[formData.role] 
                ? roleLabels[formData.role] 
                : "اختر الدور"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="admin">مسؤول</SelectItem>
            <SelectItem value="accountant">محاسب</SelectItem>
            <SelectItem value="cashier">أمين الصندوق</SelectItem>
            <SelectItem value="sales">مبيعات</SelectItem>
            <SelectItem value="production_manager">مدير الإنتاج</SelectItem>
            <SelectItem value="Warehouse_Keeper">حارس المستودع</SelectItem>
            <SelectItem value="Warehouse_Products">منتجات المستودع</SelectItem>
            <SelectItem value="Dissection_Technician">فني التشريح</SelectItem>
            <SelectItem value="Cutting_Technician">فني القطع</SelectItem>
            <SelectItem value="Gluing_Technician">فني اللصق</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
