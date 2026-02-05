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
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="pl-10"
      />
    </div>
  );
};

export default SearchInput;
