import { Button } from "../ui/button";
import { X, AlertTriangle } from "lucide-react";

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0  backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-primary-s rounded-xl shadow-2xl  transform scale-100 animate-in zoom-in-95 duration-200 border border-primary-f/20">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-primary-f/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-f/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-primary-f" />
                        </div>
                        <h2 className="text-lg font-bold text-primary-f">{title}</h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-secondary-t hover:text-secondary-f hover:bg-secondary-s transition-all duration-200"
                        disabled={loading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-primary-f font-bold leading-relaxed">{message}</p>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-5 border-t border-primary-f/10 bg-secondary-s/30 rounded-b-xl">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 h-11 border-primary-f text-secondary-f hover:bg-secondary-s hover:text-primary-f transition-all duration-200"
                    >
                        إلغاء
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 h-11 bg-primary-f hover:bg-secondary-f text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                جاري التنفيذ...
                            </span>
                        ) : (
                            "تأكيد"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
export default ConfirmDialog;