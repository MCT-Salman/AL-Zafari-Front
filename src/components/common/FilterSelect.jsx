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

import { useId } from "react";
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
                <SelectItem value="Warehouse_Keeper">أمين مستودع</SelectItem>
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
//         <SelectTrigger className="w-full h-10 border border-gray-300 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-f focus:ring-offset-0 focus:border-primary-f disabled:opacity-50 disabled:cursor-not-allowed text-gray-900">
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



// const FilterSelect = ({
//   label = "",
//   value = "",
//   onChange = () => {},
//   options = [],
//   className = '',
//   disabled = false
// }) => {
//   return (
//     <div className={className}>
//       {label && (
//         <label className="block text-sm font-semibold mb-2 text-gray-700">
//           {label}
//         </label>
//       )}
//       <select
//         value={value}
//         onChange={onChange}
//         disabled={disabled}
//         className="w-full px-4  cursor-pointer h-10 border border-gray-300 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary  disabled:opacity-50 disabled:cursor-not-allowed "
//       >
//         {options.map((option, index) => (
//           <option key={index} value={option.value} className="">
//             {option.label}
//           </option>
//         ))}
//       </select>
//     </div>
//   );
// };

// export default FilterSelect;




// const FilterSelect = ({
//   label = "",
//   value = "",
//   onChange = () => {},
//   options = [],
//   className = '',
//   disabled = false
// }) => {
//   return (
//     <div className={`group relative ${className}`}>
//       {label && (
//         <label className="block text-xs font-semibold uppercase tracking-widest mb-3 text-secondary-t transition-colors duration-300 group-focus-within:text-primary-f">
//           {label}
//         </label>
//       )}

//       <div className="relative">
//         <select
//           value={value}
//           onChange={onChange}
//           disabled={disabled}
//           className="w-full px-5 py-3 pr-12 h-12 cursor-pointer text-lg
//                      bg-primary-s border-2 border-primary-f text-secondary-f
//                      rounded-lg text-sm font-medium
//                      shadow-md
//                      hover:bg-primary-f hover:border-secondary-f hover:shadow-lg hover:-translate-y-0.5
//                      focus:outline-none focus:border-secondary-f focus:shadow-lg focus:ring-4 focus:ring-primary-f/10
//                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-primary-s disabled:hover:border-primary-f disabled:hover:shadow-md
//                      transition-all duration-250 ease-out
//                      appearance-none"
//         >
//           {options.map((option, index) => (
//             <option 
//               key={index} 
//               value={option.value}
//               className="bg-primary-s text-secondary-s py-2 px-3 text-lg"
//             >
//               {option.label}
//             </option>
//           ))}
//         </select>

//         {/* أيقونة السهم */}
//         <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none
//                         text-primary-f transition-all duration-300 ease-out
//                         group-hover:text-secondary-f group-hover:-translate-y-[45%]
//                         group-focus-within:rotate-180">
//           <svg 
//             width="18" 
//             height="18" 
//             viewBox="0 0 24 24" 
//             fill="none" 
//             stroke="currentColor" 
//             strokeWidth="2.5" 
//             strokeLinecap="round" 
//             strokeLinejoin="round"
//           >
//             <polyline points="6 9 12 15 18 9" />
//           </svg>
//         </div>
//       </div>

//       {/* الخط التزييني السفلي */}
//       <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 
//                       bg-primary-f rounded-full
//                       group-hover:w-[95%] group-focus-within:w-[95%]
//                       transition-all duration-400 ease-out" />
//     </div>
//   );
// };

// export default FilterSelect;



const FilterSelect = ({
  label = "",
  value = "",
  onChange = () => { },
  options = [],
  className = "",
  disabled = false,
}) => {
  const selectId = useId();

  return (
    <div className={`group w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="mb-2 block text-xs font-semibold tracking-wide text-secondary-t transition-colors group-focus-within:text-primary-f">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="
            peer w-full h-12 px-4 pr-11
            text-sm font-medium
            bg-primary-s text-secondary-s
            border border-primary-f/30
            rounded-xl
            shadow-sm
            text-lg
            appearance-none cursor-pointer

            transition-all duration-300 ease-out

            hover:border-primary-f hover:shadow-md
            focus:outline-none focus:border-primary-f
            focus:ring-4 focus:ring-primary-f/15

            disabled:opacity-50 disabled:cursor-not-allowed
            
          "
        >
          {options.map((option, index) => (
            <option
              key={index}
              value={option.value}
              className="bg-primary-s text-secondary-s text-lg font-medium"
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* أيقونة السهم */}
        <div
          className="
            pointer-events-none absolute right-3 top-1/2 -translate-y-1/2
            text-secondary-t
            transition-all duration-300
            peer-focus:text-primary-f
            peer-focus:rotate-180
          "
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default FilterSelect;
