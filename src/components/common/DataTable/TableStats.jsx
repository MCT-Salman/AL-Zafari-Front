// src/components/common/DataTable/TableStats.jsx
import  StatsCard from '../StatsCard';

export const TableStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatsCard key={stat.id} {...stat} />
      ))}
    </div>
  );
};