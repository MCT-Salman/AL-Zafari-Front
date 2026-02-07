// src\components\common\StatsCard.jsx
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';

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
  // Define Tailwind gradient classes for each variant
  const variantClasses = {
    blue: 'bg-gradient-to-br from-blue-500 to-blue-700',
    green: 'bg-gradient-to-br from-green-500 to-green-700',
    red: 'bg-gradient-to-br from-red-500 to-red-700',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-700',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-700',
    pink: 'bg-gradient-to-br from-pink-500 to-pink-700',
  };

  return (
    <Card className={cn(
      "p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-0 text-white",
      variantClasses[variant] || variantClasses.blue,
      className
    )}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-white/90 text-sm font-medium mb-1">{label}</p>
          <p className="text-4xl font-bold">{value.toLocaleString()}</p>
        </div>
        {icon && (
          <div className="text-5xl text-white/20">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatsCard;