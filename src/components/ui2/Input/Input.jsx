import React, { useState, forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Input.css'; // Optional CSS file

const Input = forwardRef(({
  type = 'text',
  label,
  placeholder,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  readOnly = false,
  required = false,
  error,
  success,
  warning,
  helperText,
  icon,
  iconPosition = 'left',
  clearable = false,
  size = 'medium',
  fullWidth = false,
  className = '',
  name,
  id,
  autoComplete = 'off',
  min,
  max,
  step,
  rows = 3, // For textarea
  multiline = false,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue || '');

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleChange = (e) => {
    if (!isControlled) {
      setInternalValue(e.target.value);
    }
    if (onChange) {
      onChange(e);
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('');
    }
    // Create a synthetic event for controlled components
    if (onChange) {
      const syntheticEvent = {
        target: { value: '', name },
        currentTarget: { value: '', name },
      };
      onChange(syntheticEvent);
    }
  };

  const getStatusClass = () => {
    if (error) return 'input--error';
    if (success) return 'input--success';
    if (warning) return 'input--warning';
    return '';
  };

  const baseClasses = 'input-wrapper';
  const sizeClass = `input-wrapper--${size}`;
  const widthClass = fullWidth ? 'input-wrapper--full-width' : '';
  const statusClass = getStatusClass();
  const focusClass = isFocused ? 'input-wrapper--focused' : '';
  
  const wrapperClasses = [
    baseClasses,
    sizeClass,
    widthClass,
    statusClass,
    focusClass,
    className
  ].filter(Boolean).join(' ');

  const inputClasses = [
    'input',
    disabled ? 'input--disabled' : '',
    readOnly ? 'input--readonly' : '',
    icon ? (iconPosition === 'left' ? 'input--with-icon-left' : 'input--with-icon-right') : ''
  ].filter(Boolean).join(' ');

  const renderIcon = () => {
    if (!icon) return null;
    
    return (
      <span className={`input__icon input__icon--${iconPosition}`}>
        {typeof icon === 'string' ? <span>{icon}</span> : icon}
      </span>
    );
  };

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className={wrapperClasses}>
      {label && (
        <label 
          htmlFor={id || name} 
          className="input__label"
        >
          {label}
          {required && <span className="input__required">*</span>}
        </label>
      )}
      
      <div className="input__container">
        {icon && iconPosition === 'left' && renderIcon()}
        
        <InputComponent
          ref={ref}
          type={multiline ? undefined : type}
          id={id || name}
          name={name}
          value={currentValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoComplete={autoComplete}
          className={inputClasses}
          rows={multiline ? rows : undefined}
          min={min}
          max={max}
          step={step}
          {...props}
        />
        
        {icon && iconPosition === 'right' && renderIcon()}
        
        {clearable && currentValue && !disabled && !readOnly && (
          <button 
            type="button"
            className="input__clear"
            onClick={handleClear}
            aria-label="Clear input"
          >
            ×
          </button>
        )}
      </div>

      {(error || success || warning || helperText) && (
        <div className={`input__message input__message--${error ? 'error' : success ? 'success' : warning ? 'warning' : 'info'}`}>
          {error || success || warning || helperText}
        </div>
      )}
    </div>
  );
});

Input.propTypes = {
  /** Input type */
  type: PropTypes.oneOf([
    'text',
    'email',
    'password',
    'number',
    'tel',
    'url',
    'date',
    'time',
    'search',
    'color',
    'file',
  ]),
  /** Input label */
  label: PropTypes.string,
  /** Placeholder text */
  placeholder: PropTypes.string,
  /** Controlled value */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Default value */
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Change handler */
  onChange: PropTypes.func,
  /** Focus handler */
  onFocus: PropTypes.func,
  /** Blur handler */
  onBlur: PropTypes.func,
  /** Disabled state */
  disabled: PropTypes.bool,
  /** Readonly state */
  readOnly: PropTypes.bool,
  /** Required field */
  required: PropTypes.bool,
  /** Error message */
  error: PropTypes.string,
  /** Success message */
  success: PropTypes.string,
  /** Warning message */
  warning: PropTypes.string,
  /** Helper text */
  helperText: PropTypes.string,
  /** Icon element or string */
  icon: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
  /** Icon position */
  iconPosition: PropTypes.oneOf(['left', 'right']),
  /** Show clear button */
  clearable: PropTypes.bool,
  /** Size of the input */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Full width input */
  fullWidth: PropTypes.bool,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Input name */
  name: PropTypes.string,
  /** Input id */
  id: PropTypes.string,
  /** Autocomplete attribute */
  autoComplete: PropTypes.string,
  /** Minimum value (for number/date inputs) */
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Maximum value (for number/date inputs) */
  max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Step value (for number inputs) */
  step: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Number of rows for textarea */
  rows: PropTypes.number,
  /** Use textarea instead of input */
  multiline: PropTypes.bool,
};

Input.displayName = 'Input';

export default Input;