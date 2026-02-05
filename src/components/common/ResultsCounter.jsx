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
    <div>
      <label className="block text-sm font-medium mb-2">النتائج</label>
      <div className="px-3 py-2 bg-gray-100 rounded-md text-sm font-medium text-gray-700">
        {label} {current} من {total}
      </div>
    </div>
  );
};

export default ResultsCounter;
