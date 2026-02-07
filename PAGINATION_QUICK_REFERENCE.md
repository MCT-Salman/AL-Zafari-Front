# Pagination Quick Reference Card

## 📌 One-Minute Setup

```jsx
// 1. Import
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/table';

// 2. Hook
const { currentPage, totalPages, paginatedData, handlePageChange, totalItems } 
  = usePagination(data, 10);

// 3. Render
{paginatedData.map(item => <TableRow key={item.id}>{...}</TableRow>)}

// 4. Component
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalItems}
  itemsPerPage={10}
  onPageChange={handlePageChange}
/>
```

---

## 🎯 Key Props

### Pagination Component
- `currentPage` (required): Current active page
- `totalPages` (required): Total pages
- `totalItems` (optional): Total item count
- `itemsPerPage` (optional): Default 10
- `onPageChange` (required): Page change handler
- `loading` (optional): Disable during loading
- `className` (optional): Extra classes

### usePagination Hook
- Input: `data` array, `itemsPerPage` count
- Returns: Object with pagination state and handlers

---

## ✨ Features At A Glance

| Feature | Status |
|---------|--------|
| RTL Support | ✅ Arabic/Hebrew ready |
| Responsive | ✅ Mobile & Desktop |
| Professional Styling | ✅ Brand colors |
| Search Compatible | ✅ Works with filters |
| Loading States | ✅ Disable buttons |
| Smart Numbers | ✅ Ellipsis for large sets |
| Accessibility | ✅ ARIA labels |
| Dark Mode | ✅ Via Tailwind |
| No Dependencies | ✅ React + Tailwind only |

---

## 🚀 Common Patterns

### Show Pagination Only When Needed
```jsx
{totalPages > 1 && <Pagination {...props} />}
```

### With Search
```jsx
const filtered = data.filter(item => 
  item.name.toLowerCase().includes(search.toLowerCase())
);
const { paginatedData } = usePagination(filtered, 10);
```

### Reset on Search Change
```jsx
useEffect(() => {
  resetPagination(); // Reset to page 1
}, [searchTerm]);
```

### Server-Side Pagination
```jsx
const [page, setPage] = useState(1);
useEffect(() => {
  fetchData(page); // API call with page param
}, [page]);
// Use setPage as onPageChange handler
```

---

## 📱 Mobile-First Responsive

- **Mobile**: Stacked layout (flex-col)
- **Tablet+**: Side-by-side layout (sm:flex-row)
- **Padding**: 16px (4 units)
- **Gaps**: Responsive (4 units)

---

## 🎨 Styling Classes

### Pagination Container
```
flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 py-4 
bg-white rounded-lg border border-gray-200
```

### Active Page Button
```
h-10 w-10 bg-[#004563] text-white border-[#004563] shadow-md
```

### Inactive Page Button
```
h-10 w-10 border-gray-300 text-gray-700 hover:bg-gray-50
```

---

## 🔄 Implementation Checklist

- [ ] Import `usePagination` hook
- [ ] Import `Pagination` component
- [ ] Initialize hook with data and items per page
- [ ] Render table/list with `paginatedData`
- [ ] Conditionally render `Pagination` component
- [ ] Pass required props to `Pagination`
- [ ] Test pagination with different data sizes
- [ ] Test on mobile viewport
- [ ] Verify RTL display (if Arabic)
- [ ] Test search + pagination interaction

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Pagination not showing | Check if `totalPages > 1` |
| Page numbers wrong | Verify `itemsPerPage` matches |
| Icons reversed | This is correct for RTL! |
| Buttons don't respond | Check `loading` prop |
| Data not updating | Ensure pagination reset on data change |
| Mobile layout broken | Check responsive classes applied |

---

## 📂 File Locations

```
src/
├── hooks/
│   └── usePagination.js           ← Pagination logic hook
├── components/
│   ├── ui/
│   │   └── table.jsx              ← Pagination component
│   └── examples/
│       └── PaginationTableExample.jsx    ← Working example
└── pages/
    └── Constants.jsx              ← Implementation example
```

---

## 📖 Documentation Files

- `PAGINATION_GUIDE.md` - Complete guide with all examples
- `PAGINATION_IMPLEMENTATION.md` - Full documentation with use cases
- `PaginationTableExample.jsx` - Ready-to-copy component

---

## 🎓 Learning Path

1. **Read**: `PAGINATION_GUIDE.md` (5 mins)
2. **Copy**: Code from `PaginationTableExample.jsx`
3. **Adapt**: Change to your data structure
4. **Test**: Verify with different data sizes
5. **Deploy**: Use in your pages

---

## 💡 Pro Tips

1. Always conditionally render pagination (`totalPages > 1`)
2. Reset pagination when filters change
3. Use `loading` state during API calls
4. For 10K+ items, use server-side pagination
5. Remember to scroll to top on page change (hook does this)
6. Test with Arabic text for RTL layout verification

---

**Version**: 1.0
**Status**: ✅ Production Ready
**Dependencies**: React, Tailwind CSS, lucide-react (icons)
