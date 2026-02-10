// src/components/ui/TableHead.jsx
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TableHead = ({
  children,
  sortable = false,
  sortKey,
  sortConfig,
  onSort,
  className,
  ...props
}) => {
  const isSorted = sortConfig?.key === sortKey;
  const direction = isSorted ? sortConfig.direction : null;

  const handleClick = () => {
    if (sortable && onSort) {
      onSort(sortKey);
    }
  };

  const getSortIcon = () => {
    if (!sortable) return null;
    
    if (!isSorted || !direction) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    
    return direction === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 text-primary-f" />
      : <ArrowDown className="w-3.5 h-3.5 text-primary-f" />;
  };

  return (
    <th
      onClick={handleClick}
      className={cn(
        'h-12 px-4 text-right align-middle font-semibold text-gray-700 bg-gray-50 border-b border-gray-200 whitespace-nowrap',
        sortable && 'cursor-pointer select-none group hover:bg-gray-100 transition-colors',
        isSorted && 'bg-gray-100 text-primary-f',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-end gap-2">
        {children}
        {getSortIcon()}
      </div>
    </th>
  );
};