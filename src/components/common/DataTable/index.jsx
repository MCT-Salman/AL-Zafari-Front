// src/components/common/DataTable/index.jsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableToolbar } from './TableToolbar';
import { TablePagination } from './TablePagination';
import { TableStats } from './TableStats';
import  LoadingState  from '../LoadingState';
import  EmptyState  from '../EmptyState';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const DataTable = ({
  title,
  data,
  columns,
  loading,
  stats,
  filters,
  searchConfig,
  pagination,
  sortConfig,
  onSort,
  onExport,
  exportLoading,
  toolbarActions,
  renderRow,
  emptyMessage = 'لا توجد بيانات',
  className,
}) => {
  return (
    <Card className={cn('p-6 space-y-6', className)}>
      {/* الإحصائيات */}
      {stats && <TableStats stats={stats} />}

      {/* شريط الأدوات */}
      <TableToolbar
        title={title}
        searchConfig={searchConfig}
        filters={filters}
        onExport={onExport}
        exportLoading={exportLoading}
        exportCount={pagination?.totalCount || data.length}
        actions={toolbarActions}
      />

      {/* الجدول */}
      {loading ? (
        <LoadingState />
      ) : data.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  {columns.map((col) => (
                    <TableHead
                      key={col.key}
                      sortable={col.sortable}
                      sortKey={col.key}
                      onClick={() => col.sortable && onSort?.(col.key)}
                      className={cn(
                        'font-semibold text-gray-700',
                        col.sortable && 'cursor-pointer hover:bg-gray-100'
                      )}
                    >
                      {col.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => renderRow(item, index))}
              </TableBody>
            </Table>
          </div>

          {pagination && <TablePagination {...pagination} />}
        </>
      )}
    </Card>
  );
};

// Re-exports
export { TableToolbar } from './TableToolbar';
export { TablePagination } from './TablePagination';
export { TableStats } from './TableStats';