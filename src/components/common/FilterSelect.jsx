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
        <label className="block text-sm font-medium mb-2">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
