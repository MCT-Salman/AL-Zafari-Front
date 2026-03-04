// src\components\examples\PaginationTableExample.jsx
/**
 * PAGINATION COMPONENT EXAMPLE
 * 
 * This example demonstrates a simple table with pagination using the new
 * Pagination component and usePagination hook.
 * 
 * You can use this as a reference for implementing pagination in other tables.
 */

import { useState, useEffect } from 'react';
import { usePagination } from '@/hooks/usePagination';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import CrudActions from '@/components/common/CrudActions';
import LoadingState from '@/components/common/LoadingState';
import EmptyState from '@/components/common/EmptyState';

export function PaginationTableExample() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize pagination hook
  const {
    currentPage,
    totalPages,
    paginatedData,
    handlePageChange,
    totalItems,
  } = usePagination(data, 10); // 10 items per page

  useEffect(() => {
    // Simulate loading data
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Replace with your actual API call
      // const response = await api.get('/your-endpoint');
      // setData(response.data);

      // Mock data for demonstration
      const mockData = Array.from({ length: 45 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        email: `item${i + 1}@example.com`,
        status: i % 3 === 0 ? 'active' : 'inactive',
      }));
      setData(mockData);
    } catch (error) {
      // console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (totalItems === 0) {
    return (
      <EmptyState
        title="لا توجد بيانات"
        description="لم تتم إضافة أي عنصر حتى الآن"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>البريد الإلكتروني</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-semibold">{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item.status === 'active' ? 'نشط' : 'معطل'}
                  </span>
                </TableCell>
                <TableCell>
                  <CrudActions
                    onEdit={() => console.log('Edit:', item.id)}
                    onDelete={() => console.log('Delete:', item.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={10}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

export default PaginationTableExample;
