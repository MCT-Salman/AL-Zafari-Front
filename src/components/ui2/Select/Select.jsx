import React, { useState, useEffect, useRef, forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Select.css'; // Optional CSS file
import { FiChevronDown, FiX, FiCheck, FiSearch } from 'react-icons/fi';

const Select = forwardRef(({
  options = [],
  value,
  defaultValue,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  loading = false,
  error = '',
  success = '',
  warning = '',
  helperText = '',
  label = '',
  required = false,
  clearable = true,
  searchable = false,
  multiple = false,
  size = 'medium',
  fullWidth = false,
  className = '',
  name,
  id,
  showCount = false,
  maxHeight = '250px',
  dropdownPosition = 'bottom',
  isLoadingOptions = false,
  onSearch,
  onCreateOption,
  noOptionsMessage = 'No options available',
  loadingMessage = 'Loading...',
  onCreateMessage = 'Create'
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValue, setSelectedValue] = useState(
    multiple ? (value || defaultValue || []) : (value || defaultValue || '')
  );
  const [internalOptions, setInternalOptions] = useState(options);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const isControlled = value !== undefined;

  // Filter options based on search term
  const filteredOptions = searchable && searchTerm
    ? internalOptions.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : internalOptions;

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update internal state when controlled value changes
  useEffect(() => {
    if (isControlled) {
      setSelectedValue(value);
    }
  }, [value, isControlled]);

  // Update options when props change
  useEffect(() => {
    setInternalOptions(options);
  }, [options]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [isOpen, searchable]);

  const handleSelectClick = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
      setSearchTerm('');
    }
  };

  const handleOptionSelect = (option) => {
    if (option.disabled) return;

    let newValue;
    
    if (multiple) {
      const currentValues = Array.isArray(selectedValue) ? selectedValue : [];
      const optionValue = option.value;
      
      if (currentValues.includes(optionValue)) {
        newValue = currentValues.filter(v => v !== optionValue);
      } else {
        newValue = [...currentValues, optionValue];
      }
    } else {
      newValue = option.value;
      setIsOpen(false);
    }

    if (!isControlled) {
      setSelectedValue(newValue);
    }

    if (onChange) {
      onChange(newValue, option);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    
    const newValue = multiple ? [] : '';
    
    if (!isControlled) {
      setSelectedValue(newValue);
    }

    if (onChange) {
      onChange(newValue, null);
    }
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (onSearch) {
      onSearch(term);
    }
  };

  const isSelected = (optionValue) => {
    if (multiple) {
      return Array.isArray(selectedValue) && selectedValue.includes(optionValue);
    }
    return selectedValue === optionValue;
  };

  const getDisplayText = () => {
    if (multiple) {
      const values = Array.isArray(selectedValue) ? selectedValue : [];
      if (values.length === 0) return placeholder;
      
      if (showCount) {
        return `${values.length} selected`;
      }
      
      const firstOption = internalOptions.find(opt => opt.value === values[0]);
      const firstLabel = firstOption ? firstOption.label : values[0];
      
      if (values.length === 1) return firstLabel;
      return `${firstLabel} +${values.length - 1} more`;
    }
    
    const option = internalOptions.find(opt => opt.value === selectedValue);
    return option ? option.label : selectedValue || placeholder;
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
    }
  };

  const renderOptions = () => {
    if (isLoadingOptions) {
      return (
        <div className="select__loading">
          <div className="select__spinner" />
          {loadingMessage}
        </div>
      );
    }

    if (filteredOptions.length === 0) {
      if (searchTerm && onCreateOption) {
        return (
          <div 
            className="select__option select__option--create"
            onClick={() => {
              onCreateOption(searchTerm);
              setSearchTerm('');
              setIsOpen(false);
            }}
          >
            {onCreateMessage}: "{searchTerm}"
          </div>
        );
      }
      return (
        <div className="select__no-options">
          {noOptionsMessage}
        </div>
      );
    }

    return filteredOptions.map((option, index) => {
      const selected = isSelected(option.value);
      const highlighted = index === highlightedIndex;
      
      return (
        <div
          key={`${option.value}-${index}`}
          className={`
            select__option
            ${selected ? 'select__option--selected' : ''}
            ${option.disabled ? 'select__option--disabled' : ''}
            ${highlighted ? 'select__option--highlighted' : ''}
          `}
          onClick={() => handleOptionSelect(option)}
          onMouseEnter={() => setHighlightedIndex(index)}
        >
          {multiple && (
            <span className="select__checkbox">
              {selected && <FiCheck />}
            </span>
          )}
          <span className="select__option-label">
            {option.label}
            {option.description && (
              <span className="select__option-description">
                {option.description}
              </span>
            )}
          </span>
          {!multiple && selected && (
            <FiCheck className="select__checkmark" />
          )}
        </div>
      );
    });
  };

  const hasValue = multiple 
    ? Array.isArray(selectedValue) && selectedValue.length > 0
    : !!selectedValue;

  const baseClasses = 'select';
  const sizeClass = `select--${size}`;
  const widthClass = fullWidth ? 'select--full-width' : '';
  const errorClass = error ? 'select--error' : '';
  const successClass = success ? 'select--success' : '';
  const warningClass = warning ? 'select--warning' : '';
  const openClass = isOpen ? 'select--open' : '';
  const disabledClass = disabled ? 'select--disabled' : '';
  
  const wrapperClasses = [
    baseClasses,
    sizeClass,
    widthClass,
    errorClass,
    successClass,
    warningClass,
    openClass,
    disabledClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="select-wrapper" ref={containerRef}>
      {label && (
        <label className="select__label">
          {label}
          {required && <span className="select__required">*</span>}
        </label>
      )}
      
      <div
        className={wrapperClasses}
        onClick={handleSelectClick}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        ref={ref}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled}
      >
        <div className="select__trigger">
          <div className="select__value">
            {getDisplayText()}
          </div>
          
          <div className="select__indicators">
            {hasValue && clearable && !disabled && (
              <div 
                className="select__clear"
                onClick={handleClear}
                role="button"
                aria-label="Clear selection"
              >
                <FiX />
              </div>
            )}
            
            {loading ? (
              <div className="select__spinner" />
            ) : (
              <FiChevronDown className="select__arrow" />
            )}
          </div>
        </div>
        
        {isOpen && !disabled && (
          <div 
            className={`select__dropdown select__dropdown--${dropdownPosition}`}
            ref={dropdownRef}
            style={{ maxHeight }}
          >
            {searchable && (
              <div className="select__search">
                <FiSearch className="select__search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="select__search-input"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search..."
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            
            <div className="select__options">
              {renderOptions()}
            </div>
            
            {multiple && hasValue && showCount && (
              <div className="select__footer">
                <span className="select__count">
                  {Array.isArray(selectedValue) ? selectedValue.length : 0} selected
                </span>
                <button
                  type="button"
                  className="select__clear-all"
                  onClick={handleClear}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {(error || success || warning || helperText) && (
        <div className={`select__message select__message--${error ? 'error' : success ? 'success' : warning ? 'warning' : 'info'}`}>
          {error || success || warning || helperText}
        </div>
      )}
      
      {/* Hidden input for forms */}
      <input
        type="hidden"
        name={name}
        value={multiple ? JSON.stringify(selectedValue) : selectedValue}
        id={id}
        disabled={disabled}
      />
    </div>
  );
});

Select.propTypes = {
  /** Array of options */
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
      description: PropTypes.string,
    })
  ),
  /** Controlled value */
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
  ]),
  /** Default value */
  defaultValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
  ]),
  /** Change handler */
  onChange: PropTypes.func,
  /** Placeholder text */
  placeholder: PropTypes.string,
  /** Disabled state */
  disabled: PropTypes.bool,
  /** Loading state */
  loading: PropTypes.bool,
  /** Error message */
  error: PropTypes.string,
  /** Success message */
  success: PropTypes.string,
  /** Warning message */
  warning: PropTypes.string,
  /** Helper text */
  helperText: PropTypes.string,
  /** Label text */
  label: PropTypes.string,
  /** Required field */
  required: PropTypes.bool,
  /** Allow clearing selection */
  clearable: PropTypes.bool,
  /** Enable search functionality */
  searchable: PropTypes.bool,
  /** Multiple selection */
  multiple: PropTypes.bool,
  /** Size of the select */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Full width select */
  fullWidth: PropTypes.bool,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Input name */
  name: PropTypes.string,
  /** Input id */
  id: PropTypes.string,
  /** Allow clearing */
  allowClear: PropTypes.bool,
  /** Show count for multiple selection */
  showCount: PropTypes.bool,
  /** Enable virtual scroll for large lists */
  virtualScroll: PropTypes.bool,
  /** Maximum height of dropdown */
  maxHeight: PropTypes.string,
  /** Dropdown position */
  dropdownPosition: PropTypes.oneOf(['bottom', 'top']),
  /** Options are loading */
  isLoadingOptions: PropTypes.bool,
  /** Search handler */
  onSearch: PropTypes.func,
  /** Create new option handler */
  onCreateOption: PropTypes.func,
  /** Message when no options */
  noOptionsMessage: PropTypes.string,
  /** Loading message */
  loadingMessage: PropTypes.string,
  /** Create option message */
  onCreateMessage: PropTypes.string,
};

Select.displayName = 'Select';

export default Select;
