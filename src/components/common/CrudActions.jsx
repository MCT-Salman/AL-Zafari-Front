// src\components\common\CrudActions.jsx
import React from 'react';
import { Eye, Trash2, Plus, Edit } from 'lucide-react';

const CrudActions = ({
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

  const buttonSizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5'
  };

  const iconSize = iconSizes[size] || iconSizes.md;
  const btnSize = buttonSizes[size] || buttonSizes.md;

  const btnBase = `${btnSize} rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {onView && (
        <button
          type="button"
          onClick={onView}
          disabled={disabled}
          title="عرض تفاصيل"
          aria-label="View"
          className={`${btnBase} `}
        >
          <Eye className={iconSize} />
        </button>
      )}

      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          title="تعديل"
          aria-label="Edit"
          className={`${btnBase}`}
        >
          <Edit className={iconSize} />
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          title="حذف"
          aria-label="Delete"
          className={`${btnBase} text-secondary-s hover:bg-red-100 hover:text-secondary-s`}
        >
          <Trash2 className={iconSize} />
        </button>
      )}

      {showAdd && onAdd && (
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          title="إضافة"
          aria-label="Add"
          className={`${btnBase} text-green-600 hover:bg-green-100`}
        >
          <Plus className={iconSize} />
        </button>
      )}
    </div>
  );
};

export default CrudActions;
