/**
 * LoadingState Component
 * Reusable loading skeleton or loading message
 * 
 * Usage:
 * <LoadingState />
 * or
 * <LoadingState message="جاري التحميل..." />
 */

const LoadingState = ({
  message = "جاري التحميل...",
  fullHeight = false
}) => {
  return (
    <div className={fullHeight ? "min-h-screen flex items-center justify-center" : "py-8"}>
      <div className="text-center">
        <div className="inline-block">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600 mt-4">{message}</p>
      </div>
    </div>
  );
};

export default LoadingState;
