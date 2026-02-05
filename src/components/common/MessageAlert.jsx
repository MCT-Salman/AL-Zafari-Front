/**
 * MessageAlert Component
 * Reusable alert/message display with auto-dismiss
 * 
 * Usage:
 * <MessageAlert
 *   type="success"
 *   message="تم الحفظ بنجاح"
 *   onDismiss={() => setMessage("")}
 * />
 */

const MessageAlert = ({
  type = 'success', // 'success', 'error', 'warning', 'info'
  message = "",
  onDismiss = () => {},
  dismissable = true,
  className = ''
}) => {
  if (!message) return null;

  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: '✓'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: '✕'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: '!'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'ⓘ'
    }
  };

  const style = styles[type] || styles.success;

  return (
    <div className={`${style.bg} ${style.border} ${style.text} border rounded p-4 flex items-start gap-3 mb-4 ${className}`}>
      <span className="font-bold text-lg flex-shrink-0">
        {style.icon}
      </span>
      <div className="flex-1">
        {message}
      </div>
      {dismissable && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-lg leading-none opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default MessageAlert;
