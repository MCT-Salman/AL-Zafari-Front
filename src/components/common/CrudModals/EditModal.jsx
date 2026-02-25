// src/components/common/CrudModals/EditModal.jsx
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const EditModal = ({
  isOpen,
  onClose,
  onSubmit,
  data,
  title = 'تعديل',
  children,
  loading = false,
  size = 'md',
}) => {
  if (!isOpen || !data) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(data.id, data);
  };

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-secondary-f/60 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />
      
      <div className={cn(
        'relative w-full bg-primary-s rounded-2xl shadow-2xl transform transition-all',
        sizeClasses[size]
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-f/10">
          <div>
            <h2 className="text-xl font-bold text-secondary-f">{title}</h2>
            <p className="text-sm text-secondary-t mt-1">#{data.id}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full flex items-center justify-center text-secondary-t hover:text-secondary-f hover:bg-secondary-s transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {children}
          
          <div className="flex gap-3 pt-4 border-t border-primary-f/10">
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
                  جاري التحديث...
                </span>
              ) : (
                'تحديث'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
