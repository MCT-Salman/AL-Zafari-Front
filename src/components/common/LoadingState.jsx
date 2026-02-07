// src\components\common\LoadingState.jsx
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
    <div className={fullHeight ? "min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50" : "py-12"}>
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center justify-center mb-6">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-400 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute inset-1 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin"></div>
          </div>
        </div>
        <p className="text-gray-700 font-medium text-lg">{message}</p>
        <div className="mt-4 flex items-center justify-center gap-1">
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
