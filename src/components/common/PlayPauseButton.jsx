// src/components/common/PlayPauseButton.jsx
import { useState } from "react";
import { Button } from "../ui/button";
import { Play, Pause, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ConfirmDialog from "./ConfirmDialog";

const PlayPauseButton = ({
  isPlaying,
  onToggle,
  size = "sm",
  variant = "default",
  showLabel = false,
  playLabel = "تشغيل",
  pauseLabel = "إيقاف مؤقت",
  disabled = false,
  loading = false,
  confirmBeforeToggle = false,
  confirmDialogProps = {},
  className,
  ...props
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleClick = (e) => {
    if (confirmBeforeToggle) {
      setShowConfirmDialog(true);
      return;
    }
    onToggle(e);
  };

  const handleConfirm = (e) => {
    setShowConfirmDialog(false);
    onToggle(e);
  };

  // Icon based on state
  const getIcon = () => {
    if (loading) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    return isPlaying ? (
      <Pause className="w-4 h-4" />
    ) : (
      <Play className="w-4 h-4" />
    );
  };

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case "badge":
        return cn(
          "h-8 px-3 rounded-full font-medium text-xs",
          isPlaying 
            ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200" 
            : "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200"
        );
      case "icon-only":
        return "p-2 rounded-lg";
      case "text-only":
        return cn(
          "px-4",
          isPlaying 
            ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200" 
            : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
        );
      default:
        return cn(
          isPlaying 
            ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300" 
            : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-300"
        );
    }
  };

  const buttonContent = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
          {showLabel && <span>جاري التحديث...</span>}
        </div>
      );
    }

    return (
      <>
        {getIcon()}
        {(showLabel || variant === "text-only") && (
          <span>{isPlaying ? pauseLabel : playLabel}</span>
        )}
      </>
    );
  };

  // نصوص Dialog الافتراضية
  const defaultDialogProps = {
    title: isPlaying ? "إيقاف التشغيل" : "بدء التشغيل",
    description: isPlaying 
      ? "هل أنت متأكد من إيقاف التشغيل؟"
      : "هل أنت متأكد من بدء التشغيل؟",
    confirmText: isPlaying ? "إيقاف" : "تشغيل",
    cancelText: "إلغاء",
    variant: isPlaying ? "destructive" : "default",
  };

  return (
    <>
      <Button
        size={variant === "badge" ? "default" : size}
        variant={variant === "default" ? (isPlaying ? "outline" : "ghost") : "ghost"}
        onClick={handleClick}
        disabled={disabled || loading}
        className={cn(
          "flex items-center gap-2 p-4 transition-all duration-300 hover:scale-105",
          getVariantStyles(),
          className
        )}
        title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
        aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
        {...props}
      >
        {buttonContent()}
      </Button>

      {confirmBeforeToggle && (
        <ConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          onConfirm={handleConfirm}
          {...defaultDialogProps}
          {...confirmDialogProps}
        />
      )}
    </>
  );
};

export default PlayPauseButton;