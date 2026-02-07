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
        className="w-full px-4 py-2.5 h-10 border border-gray-300 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#004563] focus:ring-offset-0 focus:border-[#004563] disabled:opacity-50 disabled:cursor-not-allowed text-gray-900"
      >
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterSelect;
