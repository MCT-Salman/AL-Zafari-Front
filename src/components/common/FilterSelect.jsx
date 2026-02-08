// src\components\common\FilterSelect.jsx
/**
 * FilterSelect Component
 * Reusable select dropdown for filtering
 * 
 * Usage:
 * <FilterSelect
 *   label="الدور"
 *   value={roleFilter}
 *   onChange={(e) => setRoleFilter(e.target.value)}
 *   options={[
 *     { value: "", label: "جميع الأدوار" },
 *     { value: "admin", label: "مسؤول" }
 *   ]}
 * />
 */

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";

{/* <label className="block text-sm font-medium mb-1">الدور</label>
            <Select value={formData.role || ""} onValueChange={handleRoleChange}>
              <SelectTrigger disabled={loading} >
                <span>
                  {formData.role && roleLabels[formData.role] 
                    ? roleLabels[formData.role] 
                    : "اختر الدور"}
                </span>
              </SelectTrigger>
              <SelectContent className={`bg-white ${loading ? "pointer-events-none opacity-50" : ""}`}>
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
            </Select> */}
// const FilterSelect = ({
//   label = "",
//   value = "",
//   onChange = () => {},
//   options = [],
//   className = '',
//   disabled = false,
//   placeholder = "اختر..."
// }) => {
//   return (
//     <div className={className}>
//       {label && (
//         <label className="block text-sm font-semibold mb-2 text-gray-700">
//           {label}
//         </label>
//       )}
//       <Select 
//         value={value} 
//         onValueChange={onChange}
//         disabled={disabled}
//       >
//         <SelectTrigger className="w-full h-10 border border-gray-300 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#004563] focus:ring-offset-0 focus:border-[#004563] disabled:opacity-50 disabled:cursor-not-allowed text-gray-900">
//           <SelectValue placeholder={placeholder} />
//         </SelectTrigger>
//         <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
//           {options.map((option, index) => {
//             // التحقق من أن القيمة ليست فارغة
//             const optionValue = option.value?.toString() || "";
//             if (optionValue === "") {
//               console.warn(`Option at index ${index} has empty value. Skipping.`);
//               return null;
//             }
            
//             return (
//               <SelectItem 
//                 key={index} 
//                 value={optionValue}
//                 className="focus:bg-gray-100 focus:text-gray-900 cursor-pointer"
//               >
//                 {option.label || option.value}
//               </SelectItem>
//             );
//           })}
//         </SelectContent>
//       </Select>
//     </div>
//   );
// };



const FilterSelect = ({
  label = "",
  value = "",
  onChange = () => {},
  options = [],
  className = '',
  disabled = false
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold mb-2 text-gray-700">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full px-4 cursor-pointer h-10 border border-gray-300 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary  disabled:opacity-50 disabled:cursor-not-allowed "
      >
        {options.map((option, index) => (
          <option key={index} value={option.value} className="">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterSelect;
