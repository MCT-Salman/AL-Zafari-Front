import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

/**
 * PaginationControls Component
 * Navigation controls for pagination
 * 
 * Usage:
 * <PaginationControls
 *   currentPage={currentPage}
 *   totalPages={totalPages}
 *   onPrevious={() => setCurrentPage(prev => prev - 1)}
 *   onNext={() => setCurrentPage(prev => prev + 1)}
 *   onPageChange={setCurrentPage}
 * />
 */

const PaginationControls = ({
  currentPage = 1,
  totalPages = 1,
  onPrevious,
  onNext,
  onPageChange = () => {},
  disabled = false
}) => {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Derive handlers from onPageChange if not provided
  const handlePrevious = onPrevious || (() => onPageChange(currentPage - 1));
  const handleNext = onNext || (() => onPageChange(currentPage + 1));

  return (
    <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t-2 border-secondary-f">
      <div className="text-sm text-gray-600">
        الصفحة <span className="font-bold">{currentPage}</span> من <span className="font-bold">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={!canGoPrevious || disabled}
          className="flex items-center gap-1"
        >
          <ChevronRight className="w-4 h-4" />
          السابق
        </Button>

        <div className="flex gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                disabled={disabled}
                className="w-8 h-8 p-0"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!canGoNext || disabled}
          className="flex items-center gap-1"
        >
          التالي
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default PaginationControls;
