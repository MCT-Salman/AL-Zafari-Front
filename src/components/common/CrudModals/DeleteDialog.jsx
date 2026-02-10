// src/components/common/CrudModals/DeleteModal.jsx
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const DeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'تأكيد الحذف',
  message = 'هل أنت متأكد من رغبتك في حذف هذا العنصر؟',
  itemName,
  loading = false,
  warningMessage = 'لا يمكن التراجع عن هذا الإجراء بعد التأكيد',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-secondary-f/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={!loading ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-primary-s rounded-2xl shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200 border border-red-200">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-red-100 bg-red-50/50 rounded-t-2xl">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-700">{title}</h2>
            {itemName && (
              <p className="text-sm text-red-600/80 mt-0.5 truncate max-w-[200px]">
                "{itemName}"
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-secondary-f leading-relaxed">
            {message}
          </p>
          
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {warningMessage}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-red-100 bg-red-50/30 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-11 border-gray-300 text-secondary-f hover:bg-gray-100"
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
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
};