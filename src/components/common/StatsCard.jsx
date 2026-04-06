// src\components\common\StatsCard.jsx
// import { Card } from '../ui/card';
// import { cn } from '@/lib/utils';

// /**
//  * StatsCard Component
//  * Reusable statistics display card with gradient backgrounds
//  * 
//  * Usage:
//  * <StatsCard
//  *   label="إجمالي المستخدمين"
//  *   value={25}
//  *   variant="blue"
//  * />
//  */

// const StatsCard = ({ 
//   label, 
//   value, 
//   variant = 'blue',
//   icon = null,
//   className = ''
// }) => {
//   // Define Tailwind gradient classes for each variant
//   const variantClasses = {
//     blue: 'bg-gradient-to-br from-blue-500 to-blue-700',
//     green: 'bg-gradient-to-br from-green-500 to-green-700',
//     red: 'bg-gradient-to-br from-red-500 to-red-700',
//     purple: 'bg-gradient-to-br from-purple-500 to-purple-700',
//     orange: 'bg-gradient-to-br from-orange-500 to-orange-700',
//     pink: 'bg-gradient-to-br from-pink-500 to-pink-700',
//   };

//   return (
//     <Card className={cn(
//       "p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-0 text-white",
//       variantClasses[variant] || variantClasses.blue,
//       className
//     )}>
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//         <div className="flex-1">
//           <p className="text-white/90 text-sm font-medium mb-1">{label}</p>
//           <p className="text-4xl font-bold">{value.toLocaleString()}</p>
//         </div>
//         {icon && (
//           <div className="text-5xl text-white/20">
//             {icon}
//           </div>
//         )}
//       </div>
//     </Card>
//   );
// };

// export default StatsCard;



import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "../ui/card";

const StatsCard = ({ 
  title, 
  value, 
  unit, 
  change, 
  trend, 
  icon: Icon, 
  iconColor = "text-blue-600", 
  bgColor = "bg-white", 
  borderColor = "border-gray-200",
  titleColor = "text-gray-600",
  valueColor = "text-gray-900",
  unitColor = "text-gray-600",
  showChange = false,
  showIcon = true
}) => (
  <Card className={cn(
    "relative overflow-hidden mb-8 border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
    bgColor,
    borderColor
  )}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className={cn("text-sm font-extrabold", titleColor)}>{title}</p>
          <div className="flex items-baseline gap-2 min-w-0">
            <span className={cn("text-xl font-black tracking-tight truncate max-w-full", valueColor)} title={value}>
              {value}
            </span>
            <span className={cn("text-xs font-semibold", unitColor)}>
              {unit}
            </span>
          </div>
          
          {showChange && change && (
            <div className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
              trend === "up" 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
            )}>
              {trend === "up" ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {change}
            </div>
          )}
        </div>
        
         {showIcon && Icon && (
          <div className={cn(
            "p-2 rounded-xl shadow-sm border bg-white",
            iconColor.replace("text-", "border-")
          )}>
            <Icon className={cn("w-5 h-5", iconColor)} />
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

export default StatsCard;
