/**
 * PAGINATION IMPLEMENTATION GUIDE
 * 
 * This guide shows how to implement pagination in your table components.
 * 
 * ============================================================================
 * 1. BASIC USAGE WITH usePagination HOOK
 * ============================================================================
 * 
 * import { usePagination } from '@/hooks/usePagination';
 * import { Pagination } from '@/components/ui/table';
 * 
 * function MyTableComponent({ data = [] }) {
 *   const {
 *     currentPage,
 *     totalPages,
 *     paginatedData,
 *     handlePageChange,
 *     totalItems
 *   } = usePagination(data, 10); // 10 items per page
 * 
 *   return (
 *     <>
 *       <Table>
 *         <TableHeader>
 *           <TableRow>
 *             <TableHead>اسم</TableHead>
 *             <TableHead>بريد إلكتروني</TableHead>
 *           </TableRow>
 *         </TableHeader>
 *         <TableBody>
 *           {paginatedData.map((item) => (
 *             <TableRow key={item.id}>
 *               <TableCell>{item.name}</TableCell>
 *               <TableCell>{item.email}</TableCell>
 *             </TableRow>
 *           ))}
 *         </TableBody>
 *       </Table>
 * 
 *       <Pagination
 *         currentPage={currentPage}
 *         totalPages={totalPages}
 *         totalItems={totalItems}
 *         itemsPerPage={10}
 *         onPageChange={handlePageChange}
 *       />
 *     </>
 *   );
 * }
 * 
 * ============================================================================
 * 2. USAGE WITH API (Server-Side Pagination)
 * ============================================================================
 * 
 * import { useState, useEffect } from 'react';
 * import { Pagination } from '@/components/ui/table';
 * 
 * function MyTableWithAPI() {
 *   const [data, setData] = useState([]);
 *   const [currentPage, setCurrentPage] = useState(1);
 *   const [totalPages, setTotalPages] = useState(1);
 *   const [loading, setLoading] = useState(false);
 *   const itemsPerPage = 10;
 * 
 *   useEffect(() => {
 *     fetchData(currentPage);
 *   }, [currentPage]);
 * 
 *   const fetchData = async (page) => {
 *     setLoading(true);
 *     try {
 *       const response = await api.get(`/users?page=${page}&limit=${itemsPerPage}`);
 *       setData(response.data.items);
 *       setTotalPages(response.data.totalPages);
 *     } catch (error) {
 *       console.error('Error fetching data:', error);
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 * 
 *   return (
 *     <>
 *       <Table>
 *         {/* table content */}
 *       </Table>
 * 
 *       <Pagination
 *         currentPage={currentPage}
 *         totalPages={totalPages}
 *         totalItems={totalPages * itemsPerPage}
 *         itemsPerPage={itemsPerPage}
 *         onPageChange={setCurrentPage}
 *         loading={loading}
 *       />
 *     </>
 *   );
 * }
 * 
 * ============================================================================
 * 3. PAGINATION COMPONENT PROPS
 * ============================================================================
 * 
 * <Pagination
 *   currentPage={1}              // Current active page (required)
 *   totalPages={10}              // Total number of pages (required)
 *   totalItems={100}             // Total items count (optional)
 *   itemsPerPage={10}            // Items per page (optional, default 10)
 *   onPageChange={() => {}}      // Callback when page changes (required)
 *   loading={false}              // Loading state (optional)
 *   className=""                 // Additional CSS classes (optional)
 * />
 * 
 * ============================================================================
 * 4. usePagination HOOK RETURN VALUES
 * ============================================================================
 * 
 * {
 *   currentPage: number,              // Current page number
 *   totalPages: number,               // Total pages
 *   paginatedData: array,             // Sliced data for current page
 *   handlePageChange: (page) => {},   // Function to change page
 *   resetPagination: () => {},        // Reset to page 1
 *   hasNextPage: boolean,             // Has next page
 *   hasPreviousPage: boolean,         // Has previous page
 *   totalItems: number                // Total items in data array
 * }
 * 
 * ============================================================================
 * 5. EXAMPLE: USERS PAGE WITH PAGINATION
 * ============================================================================
 * 
 * import { useState, useEffect } from 'react';
 * import { usePagination } from '@/hooks/usePagination';
 * import { Pagination, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
 * import { userApi } from '@/api/userApi';
 * 
 * export default function Users() {
 *   const [users, setUsers] = useState([]);
 *   const [loading, setLoading] = useState(true);
 * 
 *   const {
 *     currentPage,
 *     totalPages,
 *     paginatedData,
 *     handlePageChange,
 *     totalItems
 *   } = usePagination(users, 10);
 * 
 *   useEffect(() => {
 *     loadUsers();
 *   }, []);
 * 
 *   const loadUsers = async () => {
 *     setLoading(true);
 *     try {
 *       const response = await userApi.getAllUsers();
 *       setUsers(response.data || []);
 *     } catch (error) {
 *       console.error('Error loading users:', error);
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <Table>
 *         <TableHeader>
 *           <TableRow>
 *             <TableHead>اسم المستخدم</TableHead>
 *             <TableHead>البريد الإلكتروني</TableHead>
 *             <TableHead>الدور</TableHead>
 *           </TableRow>
 *         </TableHeader>
 *         <TableBody>
 *           {paginatedData.map((user) => (
 *             <TableRow key={user.id}>
 *               <TableCell>{user.name}</TableCell>
 *               <TableCell>{user.email}</TableCell>
 *               <TableCell>{user.role}</TableCell>
 *             </TableRow>
 *           ))}
 *         </TableBody>
 *       </Table>
 * 
 *       <Pagination
 *         currentPage={currentPage}
 *         totalPages={totalPages}
 *         totalItems={totalItems}
 *         itemsPerPage={10}
 *         onPageChange={handlePageChange}
 *         loading={loading}
 *       />
 *     </div>
 *   );
 * }
 * 
 * ============================================================================
 * 6. FEATURES
 * ============================================================================
 * 
 * ✅ Responsive design - works on mobile and desktop
 * ✅ RTL-ready - proper icon directions and layout
 * ✅ Smart page numbers - shows ellipsis for large page counts
 * ✅ Disabled states - buttons disabled when loading or at boundaries
 * ✅ Item count display - shows current range and total items
 * ✅ Professional styling - matches brand colors and design system
 * ✅ Smooth transitions - nice hover and interaction effects
 * ✅ Accessible - proper ARIA labels and keyboard support
 * 
 * ============================================================================
 */
