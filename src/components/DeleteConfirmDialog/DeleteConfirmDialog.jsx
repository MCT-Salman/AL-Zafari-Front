// // src\components\DeleteConfirmDialog\DeleteConfirmDialog.jsx
// import { Button } from "../ui/button";
// import { X } from "lucide-react";

// export default function DeleteConfirmDialog({ isOpen, title, message, onConfirm, onCancel, loading }) {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//       <div className="bg-white rounded-lg shadow-xl">
//         {/* Header */}
//         <div className="flex justify-between items-center p-6 border-b">
//           <h2 className="text-xl font-bold text-red-600">{title}</h2>
//           <button
//             onClick={onCancel}
//             className="text-gray-500 hover:text-gray-700"
//             disabled={loading}
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         {/* Content */}
//         <div className="p-6">
//           <p className="text-gray-700">{message}</p>
//         </div>

//         {/* Footer */}
//         <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-lg">
//           <Button
//             type="button"
//             variant="outline"
//             onClick={onCancel}
//             disabled={loading}
//             className="flex-1"
//           >
//             إلغاء
//           </Button>
//           <Button
//             type="button"
//             onClick={onConfirm}
//             disabled={loading}
//             className="flex-1 bg-red-600 hover:bg-red-700 text-white"
//           >
//             {loading ? "جاري الحذف..." : "حذف"}
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }


// src/components/DeleteConfirmDialog/DeleteConfirmDialog.jsx
import { Button } from "../ui/button";
import { X, AlertTriangle } from "lucide-react";

export default function DeleteConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/50 backdrop-blur-sm
      "
    >
      <div
        className="
          w-full max-w-1/2
          rounded-2xl bg-primary-s
          shadow-2xl
          animate-in fade-in zoom-in-95 duration-200
        "
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-primary-f/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="flex-1">
            <h2 className="text-lg font-bold text-red-600">
              {title}
            </h2>
            <p className="mt-1 text-sm text-secondary-t">
              هذا الإجراء لا يمكن التراجع عنه
            </p>
          </div>

          <button
            onClick={onCancel}
            disabled={loading}
            className="
              text-secondary-t transition
              hover:text-secondary-f
              disabled:opacity-50
            "
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm leading-relaxed text-primary-f font-medium">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-primary-f/20 bg-primary-s/70 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            إلغاء
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="
              flex-1
              bg-red-600 text-white
              hover:bg-red-700
              focus:ring-4 focus:ring-red-500/30
            "
          >
            {loading ? "جاري الحذف..." : "تأكيد الحذف"}
          </Button>
        </div>
      </div>
    </div>
  );
}
