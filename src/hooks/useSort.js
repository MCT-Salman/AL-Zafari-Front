// src/hooks/useSort.js
import { useState, useCallback } from 'react';

export const useSort = (data, setData) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleSort = useCallback((key) => {
    let direction = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = null;
    }

    setSortConfig({ key, direction });

    if (!direction) {
      // Reset to original order (by id)
      setData([...data].sort((a, b) => a.id - b.id));
      return;
    }

    const sorted = [...data].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      // Date sorting
      if (key.includes('date') || key.includes('_at')) {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // String sorting (Arabic support)
      if (typeof aVal === 'string') {
        return direction === 'asc'
          ? aVal.localeCompare(bVal, 'ar')
          : bVal.localeCompare(aVal, 'ar');
      }

      // Number/default sorting
      return direction === 'asc'
        ? aVal > bVal ? 1 : -1
        : aVal < bVal ? 1 : -1;
    });

    setData(sorted);
  }, [data, setData, sortConfig]);

  return { sortConfig, handleSort };
};