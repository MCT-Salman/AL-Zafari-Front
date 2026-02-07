// src\components\common\PageHeader.jsx
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';

/**
 * PageHeader Component
 * Reusable page header with title, subtitle, and action button
 * 
 * Usage:
 * <PageHeader
 *   title="إدارة المستخدمين"
 *   subtitle="إجمالي المستخدمين: 25"
 *   actionLabel="إضافة مستخدم"
 *   onAction={() => handleCreate()}
 * />
 */

const PageHeader = ({
  title = "العنوان",
  subtitle = "",
  actionLabel = null,
  onAction = null,
  className = ''
}) => {
  return (
    <div className={`mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-lg shadow-md border border-gray-200 ${className}`}>
      <div className="mb-4 sm:mb-0">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="text-gray-600 mt-2">{subtitle}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant="default"
          size="lg"
          className="gap-2 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default PageHeader;
