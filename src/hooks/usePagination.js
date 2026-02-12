// src\hooks\usePagination.js
import { useState, useCallback, useMemo } from 'react';

/**
 * usePagination Hook
 * Manages pagination state and logic for tables and lists
 * 
 * Usage:
 * const { 
 *   currentPage, 
 *   totalPages, 
 *   paginatedData, 
 *   handlePageChange, 
 *   setTotalItems 
 * } = usePagination(data, itemsPerPage);
 */
export const usePagination = (data = [], itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  // حساب إجمالي الصفحات
  const totalPages = useMemo(() => {
    return Math.ceil(data.length / itemsPerPage) || 1;
  }, [data.length, itemsPerPage]);

  // الحصول على البيانات المقسمة للصفحة الحالية
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  // التعامل مع تغيير الصفحة
  const handlePageChange = useCallback((pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  // إعادة تعيين إلى الصفحة الأولى
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // التحقق من وجود صفحات أخرى
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  return {
    currentPage,
    totalPages,
    paginatedData,
    handlePageChange,
    resetPagination,
    hasNextPage,
    hasPreviousPage,
    totalItems: data.length,
  };
};

export default usePagination;
