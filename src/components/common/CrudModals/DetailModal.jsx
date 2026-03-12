// src/components/common/CrudModals/DetailsModal.jsx
import { X, Edit, Trash2, Calendar, User, Phone, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const DetailsModal = ({
  isOpen,
  onClose,
  data,
  title = 'التفاصيل',
  fields = [],
  onEdit,
  onDelete,
  size = 'md',
  formatValue: customFormatValue,
}) => {
  if (!isOpen || !data) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  const formatValue = customFormatValue || ((key, value) => {
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
  });

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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary-f/10 border border-secondary-f/20 flex items-center justify-center">
              <User className="w-6 h-6 text-secondary-f" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary-f">{title}</h2>
              {data?.id && <p className="text-sm text-secondary-t">ID: #{data.id}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-secondary-t hover:text-secondary-f hover:bg-secondary-s/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map((field) => {
            const value = data[field.key];
            
            return (
              <div 
                key={field.key}
                className="p-4 rounded-xl bg-white/90 border border-primary-f/10 hover:border-secondary-f/30 hover:bg-white transition-colors"
              >
                <div>
                  <p className="text-xs font-medium text-secondary-t uppercase tracking-wider mb-1">
                    {field.label}
                  </p>
                  <div className="text-base font-semibold text-secondary-f">
                    {formatValue ? formatValue(field.key, value) : formatValue(field.key, value)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-primary-f/10 bg-secondary-s/20 rounded-b-2xl">
          {onEdit && (
            <Button
              onClick={() => onEdit(data)}
              className="flex-1 h-11 bg-secondary-f hover:bg-secondary-f/90 text-white gap-2"
            >
              <Edit className="w-4 h-4" />
              تعديل
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={() => onDelete(data.id)}
              variant="destructive"
              className="flex-1 h-11 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              حذف
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
