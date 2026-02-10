// src/hooks/useTable.js
import { useCrud } from './useCrud';
import { useFilter } from './useFilter';
import { useSort } from './useSort';
import { useExport } from './useExport';

export const useTable = (api, config) => {
  // CRUD
  const crud = useCrud(api, config.crud);
  
  // Filter
  const filter = useFilter(crud.data, config.filter);
  
  // Sort
  const sort = useSort(crud.data, crud.setData);
  
  // Export
  const exporter = useExport(config.export);

  return {
    // Data
    data: crud.data,
    loading: crud.loading,
    
    // CRUD
    ...crud,
    
    // Filter & Pagination
    ...filter,
    
    // Sort
    ...sort,
    
    // Export
    exportToExcel: (filename) => exporter.exportToExcel(filter.filteredData, filename),
    exportLoading: exporter.loading,
  };
};