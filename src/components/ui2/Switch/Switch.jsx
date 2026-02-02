import React, { useState, useEffect, forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Switch.css'; // Optional CSS file

const Switch = forwardRef(({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  disabled = false,
  loading = false,
  size = 'medium',
  variant = 'primary',
  label,
  labelPosition = 'right',
  required = false,
  name,
  id,
  value,
  className = '',
  error = '',
  success = '',
  warning = '',
  helperText = '',
  icons = false,
  checkedIcon,
  uncheckedIcon,
  color,
  style = {},
  ...props
}, ref) => {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const handleChange = (e) => {
    if (disabled || loading) return;

    const newChecked = !checked;
    
    if (!isControlled) {
      setInternalChecked(newChecked);
    }

    if (onChange) {
      // Create a proper synthetic event
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name,
          id,
          value,
          checked: newChecked,
          type: 'checkbox',
        },
        currentTarget: {
          ...e.currentTarget,
          name,
          id,
          value,
          checked: newChecked,
          type: 'checkbox',
        },
      };
      onChange(syntheticEvent, newChecked);
    }
  };

  const handleKeyDown = (e) => {
    if (disabled || loading) return;
    
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleChange(e);
    }
  };

  // Generate unique IDs if not provided
  const switchId = id || name || `switch-${Math.random().toString(36).substr(2, 9)}`;
  const labelId = `label-${switchId}`;

  const baseClasses = 'switch';
  const sizeClass = `switch--${size}`;
  const variantClass = variant !== 'primary' ? `switch--${variant}` : '';
  const disabledClass = disabled ? 'switch--disabled' : '';
  const loadingClass = loading ? 'switch--loading' : '';
  const errorClass = error ? 'switch--error' : '';
  const successClass = success ? 'switch--success' : '';
  const warningClass = warning ? 'switch--warning' : '';
  const iconsClass = icons ? 'switch--with-icons' : '';
  
  const switchClasses = [
    baseClasses,
    sizeClass,
    variantClass,
    disabledClass,
    loadingClass,
    errorClass,
    successClass,
    warningClass,
    iconsClass,
    className
  ].filter(Boolean).join(' ');

  // Custom color style
  const customStyle = color && checked ? {
    '--switch-active-color': color,
  } : {};

  return (
    <div 
      className="switch-wrapper"
      style={{ ...customStyle, ...style }}
    >
      <div className={`switch-container switch-container--${labelPosition}`}>
        {/* Hidden checkbox for form submission */}
        <input
          ref={ref}
          type="checkbox"
          id={switchId}
          name={name}
          checked={checked}
          onChange={handleChange}
          disabled={disabled || loading}
          required={required}
          value={value}
          aria-labelledby={label ? labelId : undefined}
          aria-invalid={!!error}
          aria-describedby={error || success || warning || helperText ? `desc-${switchId}` : undefined}
          className="switch__input"
          {...props}
        />
        
        {/* Switch track and thumb */}
        <button
          type="button"
          className={switchClasses}
          onClick={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          role="switch"
          aria-checked={checked}
          aria-label={!label ? props['aria-label'] || 'Toggle switch' : undefined}
          aria-labelledby={label ? labelId : undefined}
          tabIndex={disabled ? -1 : 0}
          style={customStyle}
        >
          {/* Track */}
          <span className="switch__track">
            {/* Icons */}
            {icons && (
              <>
                <span className="switch__icon switch__icon--checked">
                  {checkedIcon || '✓'}
                </span>
                <span className="switch__icon switch__icon--unchecked">
                  {uncheckedIcon || '✕'}
                </span>
              </>
            )}
          </span>
          
          {/* Thumb */}
          <span className="switch__thumb">
            {loading && (
              <span className="switch__spinner" />
            )}
          </span>
        </button>

        {/* Label */}
        {label && (
          <label
            id={labelId}
            htmlFor={switchId}
            className={`switch__label switch__label--${labelPosition} ${disabled ? 'switch__label--disabled' : ''}`}
            onClick={(e) => {
              if (disabled || loading) {
                e.preventDefault();
              }
            }}
          >
            {label}
            {required && <span className="switch__required">*</span>}
          </label>
        )}
      </div>

      {/* Messages */}
      {(error || success || warning || helperText) && (
        <div 
          id={`desc-${switchId}`}
          className={`switch__message switch__message--${error ? 'error' : success ? 'success' : warning ? 'warning' : 'info'}`}
        >
          {error || success || warning || helperText}
        </div>
      )}
    </div>
  );
});

Switch.propTypes = {
  /** Controlled checked state */
  checked: PropTypes.bool,
  /** Default checked state */
  defaultChecked: PropTypes.bool,
  /** Change handler */
  onChange: PropTypes.func,
  /** Disabled state */
  disabled: PropTypes.bool,
  /** Loading state */
  loading: PropTypes.bool,
  /** Size of the switch */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Visual variant */
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'success',
    'danger',
    'warning',
    'info',
    'light',
    'dark',
  ]),
  /** Label text */
  label: PropTypes.string,
  /** Label position */
  labelPosition: PropTypes.oneOf(['left', 'right', 'top', 'bottom']),
  /** Required field */
  required: PropTypes.bool,
  /** Input name */
  name: PropTypes.string,
  /** Input id */
  id: PropTypes.string,
  /** Input value */
  value: PropTypes.string,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Error message */
  error: PropTypes.string,
  /** Success message */
  success: PropTypes.string,
  /** Warning message */
  warning: PropTypes.string,
  /** Helper text */
  helperText: PropTypes.string,
  /** Show icons on switch */
  icons: PropTypes.bool,
  /** Icon for checked state */
  checkedIcon: PropTypes.node,
  /** Icon for unchecked state */
  uncheckedIcon: PropTypes.node,
  /** Custom active color */
  color: PropTypes.string,
  /** Inline styles */
  style: PropTypes.object,
};

Switch.displayName = 'Switch';

export default Switch;