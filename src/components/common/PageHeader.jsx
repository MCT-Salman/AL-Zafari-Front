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
  onAction = null
}) => {
  return (


    <div className="rounded-3xl p-8 mb-8 text-white shadow-xl bg-primary-f">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-secondary-f mt-2">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-sm font-bold border border-white/30">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span> */}
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              variant="default"
              size="lg"
              className="gap-2 w-full sm:w-auto p-7 text-md rounded-xl bg-secondary-f text-primary-f hover:bg-secondary-f-alpha hover:text-primary-s font-bold border-2 hover:bg-secondary-f-alpha"
            >
              <Plus className="w-5 h-5" />
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>

  );
};

export default PageHeader;

// <div className={`mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-lg shadow-md border border-gray-200 ${className}`}>
//   <div className="mb-4 sm:mb-0">
//     <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{title}</h1>
//     {subtitle && (
//       <p className="text-gray-600 mt-2">{subtitle}</p>
//     )}
//   </div>
//   {actionLabel && onAction && (
//     <Button
//       onClick={onAction}
//       variant="default"
//       size="lg"
//       className="gap-2 w-full sm:w-auto"
//     >
//       <Plus className="w-5 h-5" />
//       {actionLabel}
//     </Button>
//   )}
// </div>
