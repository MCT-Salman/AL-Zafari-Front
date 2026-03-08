// src\components\common\CrudModal.jsx
import { useState, useEffect } from 'react';
import { X, Edit, Trash2, AlertTriangle, User, Phone, Mail, Shield, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Unified CRUD Modal Component
 * Merges CreateModal, EditModal, DetailModal, and DeleteDialog
 */
export const CrudModal = ({
  isOpen,
  mode, // 'create', 'edit', 'view', 'delete'
  onClose,
  onSubmit,
  onDelete,
  data = null,
  title = '',
  children,
  loading = false,
  size = 'md',
  fields = [], // For view mode
  formatValue,
  deleteTitle = 'تأكيد الحذف',
  deleteMessage = 'هل أنت متأكد من رغبتك في حذف هذا العنصر؟',
  deleteWarning = 'لا يمكن التراجع عن هذا الإجراء بعد التأكيد',
  itemName,
  formData: externalFormData,
  setFormData: setExternalFormData,
}) => {
  const [internalFormData, setInternalFormData] = useState({});

  // Use external formData if provided, otherwise use internal
  const formData = externalFormData !== undefined ? externalFormData : internalFormData;
  const setFormData = setExternalFormData || setInternalFormData;

  // Update form data when data changes
  useEffect(() => {
    if (!isOpen) return;

    // If form data is managed externally, the parent is responsible for sync
    if (externalFormData !== undefined) return;

    if (data && (mode === 'edit' || mode === 'view')) {
      // Only set if data is different from current form data to avoid overwrite while typing
      setFormData(data);
    } else if (mode === 'create') {
      setFormData({});
    }
    // We only want to sync when the modal opens or the target item (data) changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, data, mode]);

  if (!isOpen) return null;

  // Don't render edit/view/delete modals without data
  if ((mode === 'edit' || mode === 'view' || mode === 'delete') && !data) {
    return null;
  }

  const sizeClasses = {
    sm: 'max-w-md w-full',
    md: 'max-w-2xl w-full',
    lg: 'max-w-4xl w-full',
    xl: 'max-w-6xl w-full',
    full: 'max-w-[95vw] w-full',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleDelete = async () => {
    await onDelete();
  };

  const defaultFormatValue = (key, value) => {
    if (formatValue) {
      return formatValue(key, value);
    }

    if (key.includes('date') || key.includes('_at')) {
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (typeof value === 'boolean') {
      return value ? (
        <Badge className="bg-green-100 text-green-800">نشط</Badge>
      ) : (
        <Badge className="bg-red-100 text-red-800">معطل</Badge>
      );
    }
    return value;
  };

  // Delete Modal
  if (mode === 'delete') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-white/60 backdrop-blur-sm transition-opacity"
          onClick={!loading ? onClose : undefined}
        />

        <div className={cn(
          'relative w-full bg-primary-s rounded-2xl shadow-2xl transform transition-all',
          sizeClasses[size]
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-primary-f/10">
            <div>
              <h2 className="text-xl font-bold text-secondary-f">{deleteTitle}</h2>
              {itemName && (
                <p className="text-sm text-secondary-t mt-1">
                  "{itemName}"
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-8 h-8 rounded-full flex items-center justify-center text-secondary-t hover:text-secondary-f hover:bg-secondary-s transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            <p className="text-secondary-f leading-relaxed">
              {deleteMessage}
            </p>

            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {deleteWarning}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-primary-f/10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-11 border-primary-f text-secondary-f hover:bg-secondary-s"
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  جاري الحذف...
                </span>
              ) : (
                'تأكيد الحذف'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // View/Detail Modal
  if (mode === 'view') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-primary-f/30 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className={cn(
          'relative w-full bg-primary-s rounded-2xl shadow-2xl ring-1 ring-primary-f/10',
          sizeClasses[size]
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-primary-f/10 bg-gradient-to-l from-primary-f/10 via-secondary-s/40 to-primary-s rounded-t-2xl">
            <div>
              <h2 className="text-xl font-bold text-secondary-f">{title || 'التفاصيل'}</h2>
              {data?.id && <p className="text-sm text-secondary-t">ID: #{data.id}</p>}
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-secondary-t hover:text-primary-s cursor-pointer hover:bg-secondary-s/60 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
            {fields.length > 0 ? (
              fields.map((field) => {
                const value = data[field.key];

                return (
                  <div
                    key={field.key}
                    className="p-4 rounded-xl bg-white/90 border border-primary-f/10 hover:border-secondary-f/30 hover:bg-white transition-colors"
                  >
                    <p className="text-xs font-medium text-secondary-t uppercase tracking-wider mb-1">
                      {field.label}
                    </p>
                    <div className="text-base font-semibold text-secondary-f">
                      {field.formatValue ? field.formatValue(field.key, value) : defaultFormatValue(field.key, value)}
                    </div>
                  </div>
                );
              })
            ) : (
              children
            )}
          </div>

          {/* Footer Actions */}
          {/* {(onSubmit || onDelete) && (
            <div className="flex gap-3 p-6 border-t border-primary-f/10 bg-secondary-s/30 rounded-b-2xl">
              {onSubmit && (
                <Button
                  onClick={() => {
                    // Switch to edit mode
                    if (onSubmit) onSubmit(data);
                  }}
                  className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-white gap-2"
                >
                  <Edit className="w-4 h-4" />
                  تعديل
                </Button>
              )}
              {onDelete && (
                <Button
                  onClick={onDelete}
                  variant="destructive"
                  className="flex-1 h-11 gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </Button>
              )}
            </div>
          )} */}
        </div>
      </div>
    );
  }

  // Create/Edit Modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-white/60 backdrop-blur-sm transition-opacity"
        onClick={!loading ? onClose : undefined}
      />

      <div className={cn(
        'relative w-full bg-primary-s rounded-2xl shadow-2xl transform transition-all',
        sizeClasses[size]
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-f/10">
          <div>
            <h2 className="text-xl font-bold text-secondary-f">
              {title || (mode === 'edit' ? 'تعديل' : 'إضافة جديد')}
            </h2>
            {mode === 'edit' && data?.id && (
              <p className="text-sm text-secondary-t mt-1">#{data.id}</p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 cursor-pointer rounded-full flex items-center justify-center text-secondary-t hover:text-secondary-f hover:bg-secondary-s transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[80vh]">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {typeof children === 'function'
              ? children({ formData, setFormData })
              : children
            }

            {/* Footer */}
            <div className="flex gap-3 pt-4 border-t border-primary-f/10 sticky bottom-0 bg-primary-s pb-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1 h-11 border-primary-f text-secondary-f hover:bg-secondary-s"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-11 bg-primary-f hover:bg-secondary-f text-white"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {mode === 'edit' ? 'جاري التحديث...' : 'جاري الحفظ...'}
                  </span>
                ) : (
                  mode === 'edit' ? 'تحديث' : 'حفظ'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
