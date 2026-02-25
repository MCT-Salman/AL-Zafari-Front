// src\components\IconCommon\IconCommon.jsx
const IconCommon = ({ icon, size = 20, className = "" }) => {
  const IconComponent = icon;
  if (!IconComponent) return null;
  return (
    <IconComponent 
      className={`text-primary-f ${className}`} 
      size={size} 
    />
  );
};

export default IconCommon;
