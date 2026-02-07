// src\components\common\ResultsCounter.jsx
/**
 * ResultsCounter Component
 * Reusable results count display
 * 
 * Usage:
 * <ResultsCounter
 *   current={10}
 *   total={25}
 * />
 * Output: "تم العثور على 10 من 25"
 */

const ResultsCounter = ({
  current = 0,
  total = 0,
  label = "تم العثور على"
  // Example: "تم العثور على 10 من 25"
}) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700">النتائج</label>
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg text-sm font-semibold text-blue-900 border border-blue-200 shadow-sm transition-all duration-200">
        <span className="text-lg font-bold text-primary">{current}</span> <span className="text-gray-600">من</span> <span className="text-lg font-bold text-gray-700">{total}</span>
      </div>
    </div>
  );
};

export default ResultsCounter;
