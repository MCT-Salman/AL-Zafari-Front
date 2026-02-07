// src\components\common\StatsCard.jsx
import { Card } from '../ui/card';

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
  const gradientVars = {
    blue: ['--start', '--end', '--text', 'blue'],
    green: ['--start', '--end', '--text', 'green'],
    red: ['--start', '--end', '--text', 'red'],
    purple: ['--start', '--end', '--text', 'purple'],
    orange: ['--start', '--end', '--text', 'orange'],
    pink: ['--start', '--end', '--text', 'pink'],
  };

  const v = variant in gradientVars ? variant : 'blue';
  const start = `var(--card-${v}-start)`;
  const end = `var(--card-${v}-end)`;
  const text = `var(--card-${v}-text)`;

  const style = {
    background: `linear-gradient(135deg, ${start} 0%, ${end} 100%)`,
    borderColor: 'rgba(0,0,0,0.04)',
  };

  return (
    <Card className={`p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`} style={style}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
          <p className="text-4xl font-bold" style={{ color: text }}>{value}</p>
        </div>
        {icon && (
          <div style={{ color: text, opacity: 0.18 }} className="text-5xl">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatsCard;
