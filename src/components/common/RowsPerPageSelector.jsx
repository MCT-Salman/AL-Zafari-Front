/**
 * RowsPerPageSelector Component
 * Allows users to select how many rows to display per page
 * 
 * Usage:
 * <RowsPerPageSelector
 *   value={rowsPerPage}
 *   onChange={setRowsPerPage}
 *   options={[5, 10, 20, 50]}
 * />
 */

const RowsPerPageSelector = ({
  value = 10,
  onChange = () => {},
  options = [5, 10, 20, 50],
  label = "عدد الصفوف:"
}) => {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default RowsPerPageSelector;
