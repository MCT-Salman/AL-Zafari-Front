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

const EmptyState = ({
  message = "لا توجد بيانات",
  icon = "📭",
  action = null // Optional button or action component
}) => {
  return (
    <div className="py-12 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="text-gray-500 text-lg">{message}</p>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
