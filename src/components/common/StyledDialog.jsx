// src\components\common\StyledDialog.jsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

/**
 * StyledDialog Component
 * Unified dialog component with consistent styling and behavior
 * 
 * Usage Example:
 * <StyledDialog
 *   isOpen={showModal}
 *   onOpenChange={setShowModal}
 *   title="Dialog Title"
 *   description="Optional Description"
 *   onCancel={() => setShowModal(false)}
 *   onConfirm={handleSave}
 *   confirmLabel="Save"
 *   cancelLabel="Cancel"
 *   isLoading={false}
 * >
 *   Form content here
 * </StyledDialog>
 */

const StyledDialog = ({
  isOpen = false,
  onOpenChange = () => {},
  title = "",
  description = "",
  children,
  onCancel = () => {},
  onConfirm = () => {},
  confirmLabel = "حفظ",
  cancelLabel = "إلغاء",
  isLoading = false,
  confirmVariant = "default",
  showFooter = true,
  showCancel = true,
  contentClassName = "",
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[90vh] overflow-y-auto bg-white ${contentClassName}`}>
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-right text-sm">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Content */}
        <div className="py-4">
          {children}
        </div>

        {/* Footer */}
        {showFooter && (
          <DialogFooter className="flex gap-2 justify-start pt-4 border-t">
            {showCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                {cancelLabel}
              </Button>
            )}
            <Button
              variant={confirmVariant}
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "جاري..." : confirmLabel}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StyledDialog;
