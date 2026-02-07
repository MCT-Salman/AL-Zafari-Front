// src\components\common\FormModal.jsx
/**
 * FormModal Component
 * Reusable modal dialog for forms (create/edit)
 * 
 * Usage:
 * <FormModal
 *   isOpen={showModal}
 *   title="إضافة مستخدم جديد"
 *   onClose={() => setShowModal(false)}
 *   onSubmit={handleSubmit}
 *   loading={formLoading}
 * >
 *   {/* form fields here */
//  * </FormModal>
//  */

import { Button } from '../ui/button';

const FormModal = ({
  isOpen = false,
  title = "نموذج",
  subtitle = "",
  onClose = () => {},
  onSubmit = () => {},
  loading = false,
  children,
  submitLabel = "حفظ",
  cancelLabel = "إلغاء",
  maxWidth = "max-w-2xl"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-lg shadow-2xl w-full ${maxWidth} animate-fade-in border border-gray-200`}>
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors duration-200 hover:bg-gray-100 rounded-full p-1"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={onSubmit} className="p-6">
          {children}
        </form>

        {/* Footer - Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
            onClick={onSubmit}
          >
            {loading ? "جاري الحفظ..." : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FormModal;
