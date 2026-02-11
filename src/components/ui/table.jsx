// // src\components\ui\table.jsx
// import * as React from "react"
// import { ChevronLeft, ChevronRight } from "lucide-react"

// import { cn } from "@/lib/utils"

// function Table({
//   className,
//   ...props
// }) {
//   return (
//     <div data-slot="table-container" className="relative w-full overflow-x-auto">
//       <table
//         data-slot="table"
//         className={cn("w-full caption-bottom text-sm", className)}
//         {...props} />
//     </div>
//   );
// }

// function TableHeader({
//   className,
//   ...props
// }) {
//   return (
//     <thead
//       data-slot="table-header"
//       className={cn("[&_tr]:border-b !text-right", className)}
//       {...props} />
//   );
// }

// function TableBody({
//   className,
//   ...props
// }) {
//   return (
//     <tbody
//       data-slot="table-body"
//       className={cn("[&_tr:last-child]:border-0", className)}
//       {...props} />
//   );
// }

// function TableFooter({
//   className,
//   ...props
// }) {
//   return (
//     <tfoot
//       data-slot="table-footer"
//       className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)}
//       {...props} />
//   );
// }

// function TableRow({
//   className,
//   ...props
// }) {
//   return (
//     <tr
//       data-slot="table-row"
//       className={cn(
//         "border-b border-gray-200 transition-all duration-200 hover:bg-blue-50 data-[state=selected]:bg-blue-100",
//         className
//       )}
//       {...props} />
//   );
// }

// function TableHead({
//   className,
//   ...props
// }) {
//   return (
//     <th
//       data-slot="table-head"
//       className={cn(
//         "h-12 px-4 text-right align-middle font-semibold text-gray-800 bg-gray-50 border-b border-gray-200 whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
//         className
//       )}
//       {...props} />
//   );
// }

// function TableCell({
//   className,
//   ...props
// }) {
//   return (
//     <td
//       data-slot="table-cell"
//       className={cn(
//         "p-4 align-middle text-gray-700 whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
//         className
//       )}
//       {...props} />
//   );
// }

// function TableCaption({
//   className,
//   ...props
// }) {
//   return (
//     <caption
//       data-slot="table-caption"
//       className={cn("text-muted-foreground mt-4 text-sm", className)}
//       {...props} />
//   );
// }

// function Pagination({
//   currentPage = 1,
//   totalPages = 1,
//   onPageChange = () => {},
//   totalItems = 0,
//   itemsPerPage = 10,
//   loading = false,
//   className = "",
// }) {
//   const startItem = (currentPage - 1) * itemsPerPage + 1;
//   const endItem = Math.min(currentPage * itemsPerPage, totalItems);

//   const handlePrevious = () => {
//     if (currentPage > 1 && !loading) {
//       onPageChange(currentPage - 1);
//     }
//   };

//   const handleNext = () => {
//     if (currentPage < totalPages && !loading) {
//       onPageChange(currentPage + 1);
//     }
//   };

//   const getPageNumbers = () => {
//     const pages = [];
//     const maxVisible = 5;
    
//     if (totalPages <= maxVisible) {
//       for (let i = 1; i <= totalPages; i++) {
//         pages.push(i);
//       }
//     } else {
//       pages.push(1);
      
//       if (currentPage > 3) {
//         pages.push("...");
//       }
      
//       const startPage = Math.max(2, currentPage - 1);
//       const endPage = Math.min(totalPages - 1, currentPage + 1);
      
//       for (let i = startPage; i <= endPage; i++) {
//         if (!pages.includes(i)) {
//           pages.push(i);
//         }
//       }
      
//       if (currentPage < totalPages - 2) {
//         pages.push("...");
//       }
      
//       pages.push(totalPages);
//     }
    
//     return pages;
//   };

//   return (
//     <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 py-4 bg-white rounded-lg border border-gray-200", className)}>
//       {/* معلومات العناصر */}
//       <div className="text-sm text-gray-600 font-medium">
//         عرض <span className="font-semibold text-gray-900">{startItem}</span> إلى{" "}
//         <span className="font-semibold text-gray-900">{endItem}</span> من{" "}
//         <span className="font-semibold text-gray-900">{totalItems}</span> عنصر
//       </div>

//       {/* أزرار الملاحة والصفحات */}
//       <div className="flex items-center gap-1">
//         {/* زر السابق */}
//         <button
//           onClick={handlePrevious}
//           disabled={currentPage === 1 || loading}
//           className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
//           aria-label="الصفحة السابقة"
//         >
//           <ChevronRight className="w-4 h-4" />
//         </button>

//         {/* أرقام الصفحات */}
//         <div className="flex items-center gap-1">
//           {getPageNumbers().map((page, index) => (
//             page === "..." ? (
//               <span key={`dots-${index}`} className="px-2 text-gray-500">
//                 ...
//               </span>
//             ) : (
//               <button
//                 key={page}
//                 onClick={() => onPageChange(page)}
//                 disabled={loading}
//                 className={cn(
//                   "h-10 w-10 rounded-lg font-medium transition-all duration-200 border",
//                   currentPage === page
//                     ? "bg-primary-f text-white border-primary-f shadow-md"
//                     : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
//                 )}
//               >
//                 {page}
//               </button>
//             )
//           ))}
//         </div>

//         {/* زر التالي */}
//         <button
//           onClick={handleNext}
//           disabled={currentPage === totalPages || loading}
//           className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
//           aria-label="الصفحة التالية"
//         >
//           <ChevronLeft className="w-4 h-4" />
//         </button>
//       </div>
//     </div>
//   );
// }

// export {
//   Table,
//   TableHeader,
//   TableBody,
//   TableFooter,
//   TableHead,
//   TableRow,
//   TableCell,
//   TableCaption,
//   Pagination,
// }




// src\components\ui\table.jsx
import * as React from "react"
import { useState } from "react"
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

import { cn } from "@/lib/utils"

// سياق الترتيب
const SortContext = React.createContext(null);

function useSort() {
  const context = React.useContext(SortContext);
  if (!context) {
    throw new Error("useSort must be used within SortProvider");
  }
  return context;
}

// مزود الترتيب
function SortProvider({ children, onSort }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleSort = (key) => {
    let direction = "asc";
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null;
        key = null;
      }
    }
    
    const newConfig = { key, direction };
    setSortConfig(newConfig);
    onSort?.(newConfig);
  };

  return (
    <SortContext.Provider value={{ sortConfig, handleSort }}>
      {children}
    </SortContext.Provider>
  );
}

function Table({
  className,
  children,
  onSort,
  ...props
}) {
  return (
    <SortProvider onSort={onSort}>
      <div data-slot="table-container" className="relative w-full overflow-x-auto rounded-lg text-right border border-gray-200">
        <table
          data-slot="table"
          dir="rtl"
          className={cn("w-full caption-bottom text-sm", className)}
          {...props}>
          {children}
        </table>
      </div>
    </SortProvider>
  );
}

function TableHeader({
  className,
  ...props
}) {
  return (
    <thead
      data-slot="table-header"
      className={cn("h-12 px-4 text-right align-middle font-semibold text-gray-800 bg-gray-50 border-b border-gray-200 whitespace-nowrap", className)}
      {...props} />
  );
}

function TableBody({
  className,
  ...props
}) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props} />
  );
}

function TableFooter({
  className,
  ...props
}) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)}
      {...props} />
  );
}

function TableRow({
  className,
  ...props
}) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-gray-200 transition-all duration-200 hover:bg-blue-50 data-[state=selected]:bg-blue-100",
        className
      )}
      {...props} />
  );
}

function TableHead({
  className,
  sortable = false,
  sortKey = null,
  children,
  ...props
}) {
  const { sortConfig, handleSort } = useSort();

  const isSorted = sortConfig.key === sortKey;
  const sortDirection = isSorted ? sortConfig.direction : null;

  const getSortIcon = () => {
    if (!sortable || !sortKey) return null;
    
    if (!isSorted || !sortDirection) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    
    if (sortDirection === "asc") {
      return <ArrowUp className="w-3.5 h-3.5 text-ptimary-f" />;
    }
    
    return <ArrowDown className="w-3.5 h-3.5 text-ptimary-f" />;
  };

  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-12 px-4 !text-right align-middle font-semibold text-gray-800 bg-gray-50 border-b border-gray-200 whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        sortable && sortKey && "cursor-pointer select-none group hover:bg-gray-100 transition-colors",
        isSorted && "bg-gray-100 text-ptimary-f",
        className
      )}
      onClick={() => sortable && sortKey && handleSort(sortKey)}
      {...props}>
      <div className="flex items-center justify-start gap-2">
        {children}
        {getSortIcon()}
      </div>
    </th>
  );
}

function TableCell({
  className,
  ...props
}) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-4 align-middle text-gray-700 whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props} />
  );
}

function TableCaption({
  className,
  ...props
}) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props} />
  );
}

function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
  totalItems = 0,
  itemsPerPage = 10,
  loading = false,
  className = "",
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1 && !loading) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !loading) {
      onPageChange(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push("...");
      }
      
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 py-4 bg-white rounded-lg border border-gray-200", className)}>
      <div className="text-sm text-gray-600 font-medium">
        عرض <span className="font-semibold text-gray-900">{startItem}</span> إلى{" "}
        <span className="font-semibold text-gray-900">{endItem}</span> من{" "}
        <span className="font-semibold text-gray-900">{totalItems}</span> عنصر
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1 || loading}
          className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="الصفحة السابقة"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            page === "..." ? (
              <span key={`dots-${index}`} className="px-2 text-gray-500">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                disabled={loading}
                className={cn(
                  "h-10 w-10 rounded-lg font-medium transition-all duration-200 border",
                  currentPage === page
                    ? "bg-primary-f text-white border-primary-f shadow-md"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                )}
              >
                {page}
              </button>
            )
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages || loading}
          className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="الصفحة التالية"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  Pagination,
}