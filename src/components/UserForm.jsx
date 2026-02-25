// src\components\UserForm.jsx
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

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
            <SelectItem value="Warehouse_Keeper">أمين مستودع</SelectItem>
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
