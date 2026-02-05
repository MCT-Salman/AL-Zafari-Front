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
    <div className={`mb-8 flex justify-between items-start ${className}`}>
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && (
          <p className="text-gray-600 mt-2">{subtitle}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 ml-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default PageHeader;
