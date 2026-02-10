// src/hooks/useFilter.js
import { useState, useMemo, useEffect } from 'react';

export const useFilter = (data, config) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Apply search
  const searchedData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item => {
      return config.searchFields.some(field => {
        const value = item[field]?.toString().toLowerCase() || '';
        return value.includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, config.searchFields]);

  // Apply filters
  const filteredData = useMemo(() => {
    return searchedData.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === '') return true;
        return item[key] === value;
      });
    });
  }, [searchedData, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const setFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    filteredData,
    paginatedData,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    totalPages,
    totalCount: filteredData.length,
  };
};