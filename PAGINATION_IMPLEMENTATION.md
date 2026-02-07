# Pagination Implementation - Complete Guide

## ✅ What Was Done

### 1. **Enhanced Table Component** (`src/components/ui/table.jsx`)
   - Added new `Pagination` component with professional styling
   - Smart page number display with ellipsis for large page counts
   - RTL-ready with proper icon positioning (right-aligned chevrons for RTL)
   - Responsive design - adapts to mobile and desktop
   - Professional styling with brand colors (#004563 primary)
   - Disabled states during loading
   - Item count display (e.g., "عرض 1 إلى 10 من 45 عنصر")

### 2. **Created Pagination Hook** (`src/hooks/usePagination.js`)
   - `usePagination(data, itemsPerPage)` - Simple API for managing pagination state
   - Automatically calculates total pages
   - Returns paginated data sliced for current page
   - Handles page changes with smooth scrolling
   - Provides helper flags: `hasNextPage`, `hasPreviousPage`
   - Reset function to go back to page 1

### 3. **Updated Constants Page** (`src/pages/Constants.jsx`)
   - Integrated pagination for constant values table
   - Shows 10 items per page
   - Pagination display only shows when more than 10 items exist
   - Maintains search and filter functionality with pagination

### 4. **Documentation Files**
   - `PAGINATION_GUIDE.md` - Complete implementation guide with examples
   - `src/components/examples/PaginationTableExample.jsx` - Ready-to-use example component

---

## 🚀 Quick Start

### Basic Implementation
```jsx
import { usePagination } from '@/hooks/usePagination';
import { Pagination, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

function MyTable({ data = [] }) {
  const { currentPage, totalPages, paginatedData, handlePageChange, totalItems } = usePagination(data, 10);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>اسم</TableHead>
            <TableHead>بريد</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={10}
          onPageChange={handlePageChange}
        />
      )}
    </>
  );
}
```

---

## 📋 Pagination Component Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `currentPage` | number | ✅ Yes | - | Current active page |
| `totalPages` | number | ✅ Yes | - | Total number of pages |
| `totalItems` | number | ❌ Optional | 0 | Total items count |
| `itemsPerPage` | number | ❌ Optional | 10 | Items displayed per page |
| `onPageChange` | function | ✅ Yes | - | Callback when page changes |
| `loading` | boolean | ❌ Optional | false | Disable buttons during loading |
| `className` | string | ❌ Optional | "" | Additional CSS classes |

---

## 🎣 usePagination Hook Return Values

```javascript
{
  currentPage: 1,                    // Current page number
  totalPages: 5,                     // Total pages calculated from data
  paginatedData: Array(10),          // Sliced data for current page
  handlePageChange: (page) => {},    // Function to change page
  resetPagination: () => {},         // Reset to page 1
  hasNextPage: true,                 // Boolean: has next page
  hasPreviousPage: false,            // Boolean: has previous page
  totalItems: 45                     // Total items in data array
}
```

---

## 🎨 Features

✅ **Responsive Design** - Mobile and desktop friendly
✅ **RTL Support** - Icons positioned correctly for right-to-left languages
✅ **Smart Pagination** - Shows ellipsis (...) for large page counts
✅ **Loading States** - Buttons disabled during data loading
✅ **Accessibility** - ARIA labels and keyboard support
✅ **Professional Styling** - Matches brand colors and design system
✅ **Smooth Transitions** - Hover effects and animations
✅ **Item Counter** - Shows "عرض X إلى Y من Z عنصر"
✅ **Flexible** - Works with client-side and server-side pagination
✅ **No External Dependencies** - Uses only React and Tailwind CSS

---

## 📱 Styling Details

### Pagination Container
- Background: White with subtle border
- Responsive: Flex column on mobile, row on desktop
- Border: Light gray (#e5e7eb)
- Padding: 16px
- Border radius: 8px (lg)

### Page Buttons
- **Inactive**: Gray border, white background, hover gray-50
- **Active**: Primary color (#004563), white text, shadow effect
- Size: 40x40px (h-10 w-10)
- Transitions: 200ms smooth
- Border radius: 8px (lg)

### Navigation Arrows
- Chevron icons (left/right) for RTL support
- Disabled at boundaries (page 1 for prev, last page for next)
- Hover effect with gray background
- 50% opacity when disabled

### Item Counter
- Semibold text for counts
- Gray-600 color for labels
- Responsive gap (4-6 units)

---

## 🔍 RTL Implementation Details

### Icon Positioning
- **Prev Button**: ChevronRight icon (points right in RTL)
- **Next Button**: ChevronLeft icon (points left in RTL)
- This works automatically because of page flow direction

### Layout
- Uses `flex-col sm:flex-row` for responsive direction
- Maintains proper spacing with `gap-4`
- Text alignment follows `dir="rtl"` from body

### Text
- Arabic text reads right-to-left automatically
- "عرض 1 إلى 10 من 45" displays correctly

---

## 🐛 Common Use Cases

### 1. **Client-Side Pagination (All Data at Once)**
Use the `usePagination` hook directly with local data array.

### 2. **Server-Side Pagination (Fetch Per Page)**
Pass `page` and `limit` to API, manage state manually:
```jsx
const [currentPage, setCurrentPage] = useState(1);
useEffect(() => fetchData(currentPage), [currentPage]);
```

### 3. **With Search/Filters**
Pagination works with filtered data automatically:
```jsx
const filtered = data.filter(item => item.name.includes(search));
const { paginatedData } = usePagination(filtered, 10);
```

### 4. **Show/Hide Pagination**
Only render when needed:
```jsx
{totalPages > 1 && <Pagination {...props} />}
```

---

## 📊 Example: Constants Page Integration

The Constants page now includes pagination for better UX with large datasets:

```jsx
// Load values for selected type
const valuesList = constantValues[type.constant_type_id] || type.values || [];
const filteredValues = valuesList.filter(/* ... */);

// Apply pagination
const valuesPagination = usePagination(filteredValues, 10);
const paginatedCurrentValues = valuesPagination.paginatedData;

// Render only when more than 10 items
{filteredValues.length > 10 && (
  <Pagination
    currentPage={valuesPagination.currentPage}
    totalPages={valuesPagination.totalPages}
    totalItems={filteredValues.length}
    itemsPerPage={10}
    onPageChange={valuesPagination.handlePageChange}
  />
)}
```

---

## 🔧 Files Modified/Created

### New Files
- ✅ `src/hooks/usePagination.js` - Pagination logic hook
- ✅ `src/components/examples/PaginationTableExample.jsx` - Example component
- ✅ `PAGINATION_GUIDE.md` - Complete documentation

### Updated Files
- ✅ `src/components/ui/table.jsx` - Added Pagination component + lucide-react import
- ✅ `src/pages/Constants.jsx` - Integrated pagination for values table

---

## 🚦 How to Use in Your Pages

### Step 1: Import Required Components
```jsx
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/table';
```

### Step 2: Initialize Hook
```jsx
const { currentPage, totalPages, paginatedData, handlePageChange, totalItems } = usePagination(data, 10);
```

### Step 3: Render Table with Paginated Data
```jsx
<Table>
  {/* headers */}
  <TableBody>
    {paginatedData.map(item => <TableRow key={item.id}>{/* ... */}</TableRow>)}
  </TableBody>
</Table>
```

### Step 4: Add Pagination Component
```jsx
{totalPages > 1 && (
  <Pagination
    currentPage={currentPage}
    totalPages={totalPages}
    totalItems={totalItems}
    itemsPerPage={10}
    onPageChange={handlePageChange}
  />
)}
```

---

## ⚡ Performance Tips

1. **Large Datasets**: Use server-side pagination for thousands of items
2. **Search + Pagination**: Filter locally for < 10,000 items, use server API for more
3. **Memoization**: Use `useMemo` for filtered data if filtering is expensive
4. **Reset on Search**: Call `resetPagination()` when search term changes

---

## 📞 Support

For questions or issues with pagination:
1. Check `PAGINATION_GUIDE.md` for detailed examples
2. Review `PaginationTableExample.jsx` for working implementation
3. Check `usePagination.js` for hook documentation
4. Review Constants.jsx for real-world implementation

---

**Status**: ✅ **Complete and Ready to Use**

All pagination components are production-ready with:
- Professional styling
- RTL support
- Responsive design
- Accessibility features
- No external dependencies beyond React and Tailwind CSS
