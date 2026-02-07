// src\components\common\SearchInput.jsx
import { Input } from '../ui/input';
import { Search } from 'lucide-react';

/**
 * SearchInput Component
 * Reusable search input with icon and placeholder
 * 
 * Usage:
 * <SearchInput
 *   placeholder="ابحث عن مستخدم..."
 *   value={searchTerm}
 *   onChange={(e) => setSearchTerm(e.target.value)}
 * />
 */

const SearchInput = ({
  placeholder = "ابحث...",
  value = "",
  onChange = () => {},
  className = '',
  disabled = false
}) => {
  return (
    <div className={`relative mb-6 ${className}`}>
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none transition-colors duration-200">
        <Search size={20} />
      </div>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="pr-10 pl-4 shadow-sm hover:shadow-md transition-all duration-200"
      />
    </div>
  );
};

export default SearchInput;
