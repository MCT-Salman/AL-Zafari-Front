// src\components\UserForm.jsx
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "../components/ui/input";
import FilterSelect from "../components/common/FilterSelect";

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

export default function UserForm({ user, formData, setFormData, loading, error }) {
  // State synchronization is now handled exclusively by the parent components (Users.jsx, Profile.jsx, etc.)
  // to prevent overwriting custom pre-fills like stripped phone numbers.
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').replace(/^0+/, '');
      setFormData((prev) => ({ ...prev, phone: digitsOnly }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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
        <div className="flex items-center gap-1">
          <Input
            type="tel"
            inputMode="numeric"
            name="phone"
            value={formData.phone || ""}
            onChange={handleInputChange}
            placeholder="912345678"
            disabled={loading}
            className="rounded-r-none"
          />
          <span className="text-sm font-medium bg-gray-100 px-2 py-2 rounded-l-md border border-r-0" dir="ltr">+963</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">كلمة المرور</label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password || ""}
            onChange={handleInputChange}
            placeholder={user ? "اتركه فارغاً لعدم التغيير" : "••••••••"}
            disabled={loading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
            aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            disabled={loading}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
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
          showDropdownAbove={true}
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
    </>
  );
}
