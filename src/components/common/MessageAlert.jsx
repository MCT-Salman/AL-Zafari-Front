// src\components\common\MessageAlert.jsx
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
      bg: 'var(--color-success-bg)',
      border: 'var(--color-success-border)',
      text: 'var(--color-success-text)',
      icon: '✓'
    },
    error: {
      bg: 'var(--color-error-bg)',
      border: 'var(--color-error-border)',
      text: 'var(--color-error-text)',
      icon: '✕'
    },
    warning: {
      bg: 'var(--color-warning-bg)',
      border: 'var(--color-warning-border)',
      text: 'var(--color-warning-text)',
      icon: '!'
    },
    info: {
      bg: 'var(--color-info-bg)',
      border: 'var(--color-info-border)',
      text: 'var(--color-info-text)',
      icon: 'ⓘ'
    }
  };

  const s = styles[type] || styles.success;

  return (
    <div style={{ background: s.bg, borderColor: s.border, color: s.text }} className={`border rounded p-4 flex items-start gap-3 mb-4 ${className}`}>
      <span className="font-bold text-lg flex-shrink-0">
        {s.icon}
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
