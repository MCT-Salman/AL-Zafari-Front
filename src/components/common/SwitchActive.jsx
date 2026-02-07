// src/components/common/SwitchActive.jsx
import { Button } from "../ui/button";
import { ToggleLeft, ToggleRight, Power, PowerOff, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SwitchActive = ({
  isActive,
  onToggle,
  size = "sm",
  variant = "default", // "default", "icon-only", "text-only", "badge"
  showLabel = false,
  activeLabel = "نشط",
  inactiveLabel = "معطل",
  disabled = false,
  loading = false,
  confirmBeforeToggle = false,
  className,
  ...props
}) => {
  const handleClick = (e) => {
    if (confirmBeforeToggle) {
      const confirmMessage = isActive 
        ? "هل أنت متأكد من تعطيل هذا العنصر؟"
        : "هل أنت متأكد من تفعيل هذا العنصر؟";
      
      if (window.confirm(confirmMessage)) {
        onToggle(e);
      }
      return;
    }
    onToggle(e);
  };

  // Icon based on variant
  const getIcon = () => {
    if (variant === "badge") {
      return isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />;
    }
    if (variant === "icon-only") {
      return isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />;
    }
    return isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />;
  };

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case "badge":
        return cn(
          "h-8 px-3 rounded-full font-medium text-xs",
          isActive 
            ? "bg-green-100 text-green-800 hover:bg-green-200 border border-green-200" 
            : "bg-red-100 text-red-800 hover:bg-red-200 border border-red-200"
        );
      case "icon-only":
        return "p-2 rounded-lg";
      case "text-only":
        return cn(
          "px-4",
          isActive 
            ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200" 
            : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
        );
      default:
        return cn(
          isActive 
            ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-300" 
            : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-300"
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
          <span>{isActive ? activeLabel : inactiveLabel}</span>
        )}
      </>
    );
  };

  return (
    <Button
      size={variant === "badge" ? "default" : size}
      variant={variant === "default" ? (isActive ? "outline" : "destructive") : "ghost"}
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        "flex items-center gap-2 transition-all duration-300 hover:scale-105",
        getVariantStyles(),
        className
      )}
      {...props}
    >
      {buttonContent()}
    </Button>
  );
};

export default SwitchActive;