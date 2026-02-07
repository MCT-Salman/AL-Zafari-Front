// src\components\IconCommon\IconCommon.jsx

const IconCommon = ({ icon: IconComponent, size = 20, className = "" }) => {
  return (
    <IconComponent 
      className={`text-primary-f ${className}`} 
      size={size} 
    />
  );
};

export default IconCommon;
