import { Eye, Edit2, Trash2, Plus } from 'lucide-react';

/**
 * CrudIconsCall Component
 * Reusable CRUD action icons for tables and lists
 * 
 * Usage:
 * <CrudIconsCall
 *   onView={() => handleView(item)}
 *   onEdit={() => handleEdit(item)}
 *   onDelete={() => handleDelete(item)}
 *   onAdd={() => handleAdd()}
 *   size="md"
 *   showAdd={false}
 * />
 */

const CrudIconsCall = ({
  onView = null,
  onEdit = null,
  onDelete = null,
  onAdd = null,
  size = 'md',
  showAdd = false,
  disabled = false,
  className = ''
}) => {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5'
  };

  const iconSize = iconSizes[size] || iconSizes.md;
  const buttonSize = buttonClasses[size] || buttonClasses.md;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* View/Details Button */}
      {onView && (
        <button
          onClick={onView}
          disabled={disabled}
          className={`${buttonSize} text-blue-600 hover:bg-blue-100 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
          title="عرض التفاصيل"
          aria-label="View details"
        >
          <Eye className={iconSize} />
        </button>
      )}

      {/* Edit Button */}
      {onEdit && (
        <button
          onClick={onEdit}
          disabled={disabled}
          className={`${buttonSize} text-orange-600 hover:bg-orange-100 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
          title="تعديل"
          aria-label="Edit"
        >
          <Edit2 className={iconSize} />
        </button>
      )}

      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={onDelete}
          disabled={disabled}
          className={`${buttonSize} text-red-600 hover:bg-red-100 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
          title="حذف"
          aria-label="Delete"
        >
          <Trash2 className={iconSize} />
        </button>
      )}

      {/* Add Button */}
      {showAdd && onAdd && (
        <button
          onClick={onAdd}
          disabled={disabled}
          className={`${buttonSize} text-green-600 hover:bg-green-100 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
          title="إضافة"
          aria-label="Add new"
        >
          <Plus className={iconSize} />
        </button>
      )}
    </div>
  );
};

export default CrudIconsCall;
