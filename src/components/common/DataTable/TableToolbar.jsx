// src/components/common/DataTable/TableToolbar.jsx
import { Button } from '@/components/ui/button';
import { Download, Plus } from 'lucide-react';
import  SearchInput  from '../SearchInput';
// import { RowsPerPageSelector } from '../RowsPerPageSelector';
import FilterSelect from '../FilterSelect';

export const TableToolbar = ({
  title,
  searchConfig,
  filters,
  onExport,
  exportLoading,
  exportCount,
  actions,
}) => {
  return (
    <div className="space-y-4">
      {/* العنوان والأزرار الرئيسية */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        
        <div className="flex items-center gap-3">
          {onExport && (
            <Button
              onClick={onExport}
              disabled={exportLoading || exportCount === 0}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              {exportLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>جاري التصدير...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>تصدير Excel ({exportCount})</span>
                </>
              )}
            </Button>
          )}
          {actions}
        </div>
      </div>

      {/* البحث والفلاتر */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {searchConfig && (
          <SearchInput
            placeholder={searchConfig.placeholder}
            value={searchConfig.value}
            onChange={(e) => searchConfig.onChange(e.target.value)}
          />
        )}
        
        {filters?.map((filter, index) => (
          <FilterSelect
            key={index}
            label={filter.label}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            options={filter.options}
          />
        ))}
      </div>
    </div>
  );
};