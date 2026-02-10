// src/hooks/useExport.js
import { useState } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export const useExport = (config) => {
  const [loading, setLoading] = useState(false);

  const exportToExcel = async (data, filename) => {
    setLoading(true);
    try {
      const exportData = data.map((item, index) => {
        const row = { '#': index + 1 };
        config.columns.forEach(col => {
          row[col.header] = col.format 
            ? col.format(item[col.key])
            : item[col.key];
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = config.columnWidths || config.columns.map(() => ({ wch: 20 }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName || 'Data');

      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `${filename}_${date}.xlsx`);

      toast.success(`تم تصدير ${data.length} عنصر بنجاح`);
    } catch (err) {
      toast.error('فشل في التصدير: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return { exportToExcel, loading };
};