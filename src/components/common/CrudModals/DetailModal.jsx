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

  const getIcon = (key) => {
    const icons = {
      name: User,
      email: Mail,
      phone: Phone,
      role: Shield,
      created_at: Calendar,
    };
    return icons[key] || User;
  };

  const formatValue = customFormatValue || ((key, value) => {
    if (key.includes('date') || key.includes('_at')) {
      return new Date(value).toLocaleDateString('ar-SA', {
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
        className="absolute inset-0 bg-secondary-f/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className={cn(
        'relative w-full bg-primary-s rounded-2xl shadow-2xl',
        sizeClasses[size]
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-f/10 bg-secondary-s/30 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-f/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary-f" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary-f">{title}</h2>
              <p className="text-sm text-secondary-t">ID: #{data.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-secondary-t hover:text-secondary-f hover:bg-secondary-s transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {fields.map((field) => {
            const Icon = getIcon(field.key);
            const value = data[field.key];
            
            return (
              <div 
                key={field.key}
                className="flex items-start gap-4 p-4 rounded-xl bg-white border border-primary-f/10 hover:border-primary-f/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary-s flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary-f" />
                </div>
                <div className="flex-1">
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
        <div className="flex gap-3 p-6 border-t border-primary-f/10 bg-secondary-s/30 rounded-b-2xl">
          {onEdit && (
            <Button
              onClick={() => onEdit(data)}
              className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-white gap-2"
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
