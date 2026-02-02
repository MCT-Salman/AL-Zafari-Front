import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Box.css'; // Optional CSS file

// Helper functions moved outside component
const getSpacingValue = (size) => {
  const spacing = {
    none: '0',
    xsmall: '4px',
    small: '8px',
    medium: '16px',
    large: '24px',
    xlarge: '32px',
    xxlarge: '48px',
  };
  return spacing[size] || size;
};

const getElevation = (level) => {
  const elevations = {
    1: 'var(--shadow-sm)',
    2: 'var(--shadow-md)',
    3: 'var(--shadow-lg)',
    4: 'var(--shadow-xl)',
    5: 'var(--shadow-xxl)',
  };
  return elevations[level] || elevations[1];
};

const Box = forwardRef(({
  children,
  as = 'div',
  variant = 'default',
  padding = 'medium',
  margin = 'none',
  shadow = 'none',
  border = 'none',
  radius = 'medium',
  background = 'default',
  width = 'auto',
  height = 'auto',
  className = '',
  hoverable = false,
  clickable = false,
  onClick,
  align = 'stretch',
  justify = 'start',
  direction = 'column',
  gap = 'medium',
  overflow = 'visible',
  position = 'static',
  fullWidth = false,
  fullHeight = false,
  title,
  subtitle,
  header,
  footer,
  actions,
  divider = false,
  loading = false,
  elevation = 0,
  style = {},
  ...props
}, ref) => {
  const Component = as;
  
  const baseClasses = 'box';
  const variantClass = variant !== 'default' ? `box--${variant}` : '';
  const paddingClass = `box--padding-${padding}`;
  const marginClass = `box--margin-${margin}`;
  const shadowClass = shadow !== 'none' ? `box--shadow-${shadow}` : '';
  const borderClass = border !== 'none' ? `box--border-${border}` : '';
  const radiusClass = `box--radius-${radius}`;
  const backgroundClass = background !== 'default' ? `box--background-${background}` : '';
  const hoverClass = hoverable ? 'box--hoverable' : '';
  const clickClass = clickable ? 'box--clickable' : '';
  const widthClass = fullWidth ? 'box--full-width' : '';
  const heightClass = fullHeight ? 'box--full-height' : '';
  const overflowClass = overflow !== 'visible' ? `box--overflow-${overflow}` : '';
  const loadingClass = loading ? 'box--loading' : '';
  const dividerClass = divider ? 'box--divider' : '';
  
  const boxClasses = [
    baseClasses,
    variantClass,
    paddingClass,
    marginClass,
    shadowClass,
    borderClass,
    radiusClass,
    backgroundClass,
    hoverClass,
    clickClass,
    widthClass,
    heightClass,
    overflowClass,
    loadingClass,
    dividerClass,
    className
  ].filter(Boolean).join(' ');

  const containerStyle = {
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    gap: getSpacingValue(gap),
    width: width !== 'auto' ? width : undefined,
    height: height !== 'auto' ? height : undefined,
    position,
    boxShadow: elevation > 0 ? getElevation(elevation) : undefined,
    ...style,
  };

  const handleClick = (e) => {
    if (clickable && onClick) {
      onClick(e);
    }
  };

  return (
    <Component
      ref={ref}
      className={boxClasses}
      onClick={handleClick}
      style={containerStyle}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-disabled={clickable && loading}
      {...props}
    >
      {/* Loading overlay */}
      {loading && (
        <div className="box__loading-overlay">
          <div className="box__spinner" />
        </div>
      )}

      {/* Header section */}
      {(title || subtitle || header || actions) && (
        <div className="box__header">
          <div className="box__header-content">
            {header || (
              <>
                {title && <h3 className="box__title">{title}</h3>}
                {subtitle && <p className="box__subtitle">{subtitle}</p>}
              </>
            )}
          </div>
          {actions && <div className="box__actions">{actions}</div>}
        </div>
      )}

      {/* Body/content */}
      <div className="box__content">
        {children}
      </div>

      {/* Footer section */}
      {footer && (
        <div className="box__footer">
          {footer}
        </div>
      )}
    </Component>
  );
});

Box.propTypes = {
  /** Content of the box */
  children: PropTypes.node,
  /** HTML element to render */
  as: PropTypes.oneOf(['div', 'section', 'article', 'aside', 'main', 'header', 'footer', 'form', 'nav']),
  /** Visual variant */
  variant: PropTypes.oneOf([
    'default',
    'primary',
    'secondary',
    'success',
    'danger',
    'warning',
    'info',
    'light',
    'dark',
    'outline',
    'ghost',
    'glass',
  ]),
  /** Padding size */
  padding: PropTypes.oneOf(['none', 'xsmall', 'small', 'medium', 'large', 'xlarge']),
  /** Margin size */
  margin: PropTypes.oneOf(['none', 'xsmall', 'small', 'medium', 'large', 'xlarge', 'auto']),
  /** Shadow style */
  shadow: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl', 'inner']),
  /** Border style */
  border: PropTypes.oneOf(['none', 'thin', 'medium', 'thick', 'dashed', 'dotted']),
  /** Border radius */
  radius: PropTypes.oneOf(['none', 'small', 'medium', 'large', 'full', 'pill']),
  /** Background style */
  background: PropTypes.oneOf([
    'default',
    'light',
    'lighter',
    'dark',
    'darker',
    'primary',
    'secondary',
    'transparent',
    'gradient',
  ]),
  /** Width of the box */
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Height of the box */
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Hover effect */
  hoverable: PropTypes.bool,
  /** Clickable box (like a card) */
  clickable: PropTypes.bool,
  /** Click handler */
  onClick: PropTypes.func,
  /** Flexbox align items */
  align: PropTypes.oneOf(['stretch', 'start', 'center', 'end', 'baseline']),
  /** Flexbox justify content */
  justify: PropTypes.oneOf(['start', 'center', 'end', 'between', 'around', 'evenly']),
  /** Flex direction */
  direction: PropTypes.oneOf(['row', 'column', 'row-reverse', 'column-reverse']),
  /** Gap between children */
  gap: PropTypes.oneOf(['none', 'xsmall', 'small', 'medium', 'large', 'xlarge', 'xxlarge']),
  /** Overflow behavior */
  overflow: PropTypes.oneOf(['visible', 'hidden', 'scroll', 'auto']),
  /** CSS position */
  position: PropTypes.oneOf(['static', 'relative', 'absolute', 'fixed', 'sticky']),
  /** Full width box */
  fullWidth: PropTypes.bool,
  /** Full height box */
  fullHeight: PropTypes.bool,
  /** Title text */
  title: PropTypes.string,
  /** Subtitle text */
  subtitle: PropTypes.string,
  /** Custom header content */
  header: PropTypes.node,
  /** Footer content */
  footer: PropTypes.node,
  /** Action buttons/items */
  actions: PropTypes.node,
  /** Show divider between header and content */
  divider: PropTypes.bool,
  /** Loading state */
  loading: PropTypes.bool,
  /** Shadow elevation level (1-5) */
  elevation: PropTypes.oneOf([0, 1, 2, 3, 4, 5]),
  /** Inline styles */
  style: PropTypes.object,
};

Box.displayName = 'Box';

export default Box;