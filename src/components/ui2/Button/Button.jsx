import React from 'react';
import PropTypes from 'prop-types';
import './Button.css'; // Optional CSS file

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  onClick,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const baseClasses = 'button';
  const variantClass = `button--${variant}`;
  const sizeClass = `button--${size}`;
  const widthClass = fullWidth ? 'button--full-width' : '';
  const stateClass = disabled ? 'button--disabled' : '';
  
  const buttonClasses = [
    baseClasses,
    variantClass,
    sizeClass,
    widthClass,
    stateClass,
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  const renderIcon = () => {
    if (!icon) return null;
    
    const iconElement = typeof icon === 'string' 
      ? <span className="button__icon-text">{icon}</span>
      : icon;

    return (
      <span className={`button__icon button__icon--${iconPosition}`}>
        {loading ? <span className="button__spinner" /> : iconElement}
      </span>
    );
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-busy={loading}
      aria-disabled={disabled}
      {...props}
    >
      {iconPosition === 'left' && renderIcon()}
      <span className="button__content">
        {children}
      </span>
      {iconPosition === 'right' && renderIcon()}
    </button>
  );
};

Button.propTypes = {
  /** Button text/content */
  children: PropTypes.node.isRequired,
  /** Visual style variant */
  variant: PropTypes.oneOf([
    'primary',
    'secondary', 
    'success',
    'danger',
    'warning',
    'info',
    'outline',
    'ghost',
    'link'
  ]),
  /** Size of the button */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Disabled state */
  disabled: PropTypes.bool,
  /** Loading state */
  loading: PropTypes.bool,
  /** Full width button */
  fullWidth: PropTypes.bool,
  /** HTML button type */
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  /** Click handler */
  onClick: PropTypes.func,
  /** Icon element or string */
  icon: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
  /** Icon position */
  iconPosition: PropTypes.oneOf(['left', 'right']),
  /** Additional CSS classes */
  className: PropTypes.string,
  /** HTML id attribute */
  id: PropTypes.string,
};

export default Button;