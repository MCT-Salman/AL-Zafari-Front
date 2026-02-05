import { Card } from '../components/ui/card';

/**
 * StatsCard Component
 * Reusable statistics display card with gradient backgrounds
 * 
 * Usage:
 * <StatsCard
 *   label="إجمالي المستخدمين"
 *   value={25}
 *   variant="blue"
 * />
 */

const StatsCard = ({ 
  label, 
  value, 
  variant = 'blue',
  icon = null,
  className = ''
}) => {
  const variants = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
    green: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
    red: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
    orange: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200',
    pink: 'bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200',
  };

  const textColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    pink: 'text-pink-600',
  };

  const variantClasses = variants[variant] || variants.blue;
  const textColor = textColors[variant] || textColors.blue;

  return (
    <Card className={`p-6 ${variantClasses} ${className}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
        </div>
        {icon && (
          <div className={`${textColor} opacity-20`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatsCard;
