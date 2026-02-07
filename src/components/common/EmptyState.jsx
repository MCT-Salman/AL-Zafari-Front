// src\components\common\EmptyState.jsx
/**
 * EmptyState Component
 * Reusable empty/no data state display
 * 
 * Usage:
 * <EmptyState message="لا توجد بيانات" />
 * or
 * <EmptyState 
 *   message="لا توجد مستخدمين"
 *   icon="👥"
 * />
 */

import { FcEmptyFilter } from "react-icons/fc";
import { PiEmpty } from "react-icons/pi";

const EmptyState = ({
  message = "لا توجد بيانات",
  icon = <FcEmptyFilter/>,
  action = null // Optional button or action component
}) => {
  return (
    <div className="py-16 px-4 text-center animate-fade-in">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-6">
        <span className="text-4xl">{icon}</span>
      </div>
      <p className="text-gray-600 text-lg font-medium mb-2">{message}</p>
      <p className="text-gray-400 text-sm mb-6">جاري البحث عن بيانات...</p>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
