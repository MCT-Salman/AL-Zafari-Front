// src\pages\Users.jsx
import { useState, useEffect } from "react";
import { userApi } from "../api/userApi";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Pagination
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Download, ToggleLeft, ToggleRight, User } from "lucide-react";
import UserModal from "../components/UserModal/UserModal";
import UserDetailModal from "../components/UserDetailModal/UserDetailModal";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog/DeleteConfirmDialog";
import CrudActions from "../components/common/CrudActions";
import StatsCard from "../components/common/StatsCard";
import SearchInput from "../components/common/SearchInput";
import FilterSelect from "../components/common/FilterSelect";
import MessageAlert from "../components/common/MessageAlert";
import PageHeader from "../components/common/PageHeader";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import ResultsCounter from "../components/common/ResultsCounter";
import RowsPerPageSelector from "../components/common/RowsPerPageSelector";
import PaginationControls from "../components/common/PaginationControls";
import SwitchActive from "../components/common/SwitchActive";
import { UserRole, UserRoleLabels } from "../enums";
import * as XLSX from "xlsx";
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, userId: null, loading: false });
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [exportLoading, setExportLoading] = useState(false);

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await userApi.getUsers();
      setUsers(response.data || []);
    } catch (err) {
       toast.error(err.message || "فشل في تحميل المستخدمين");
    } finally {
      setLoading(false);
    }
  };

  // EXPORT TO EXCEL FUNCTION
  const exportToExcel = () => {
    setExportLoading(true);
    try {
      // Prepare data for export (use filteredUsers to respect current filters)
      const exportData = filteredUsers.map((user, index) => ({
        "#": index + 1,
        "الاسم الكامل": user.full_name,
        "اسم المستخدم": user.username,
        "رقم الهاتف": user.phone,
        "الدور": UserRoleLabels[user.role] || user.role,
        "الحالة": user.is_active ? "نشط" : "معطل",
        "تاريخ الإنشاء": new Date(user.created_at).toLocaleDateString('ar-SA'),
        "آخر تحديث": user.updated_at ? new Date(user.updated_at).toLocaleDateString('ar-SA') : "",
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths for better readability
      const columnWidths = [
        { wch: 5 },   // م
        { wch: 25 },  // الاسم
        { wch: 20 },  // اسم المستخدم
        { wch: 15 },  // الهاتف
        { wch: 15 },  // الدور
        { wch: 10 },  // الحالة
        { wch: 15 },  // تاريخ الإنشاء
        { wch: 15 },  // آخر تحديث
      ];
      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "المستخدمين");

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `المستخدمين_${date}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      toast.success(`تم تصدير ${filteredUsers.length} مستخدم بنجاح`);
    } catch (err) {
      toast.error("فشل في تصدير البيانات: " + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  // Alternative: Export with custom styling (using a more advanced approach)
  const exportToExcelAdvanced = () => {
    setExportLoading(true);
    try {
      // Create worksheet from filtered data
      const worksheetData = [
        // Header row
        ["#", "الاسم الكامل", "اسم المستخدم", "رقم الهاتف", "الدور", "الحالة", "تاريخ الإنشاء"],
        // Data rows
        ...filteredUsers.map((user, index) => [
          index + 1,
          user.full_name,
          user.username,
          user.phone,
          UserRoleLabels[user.role] || user.role,
          user.is_active ? "نشط" : "معطل",
          new Date(user.created_at).toLocaleDateString('en-US'),
        ])
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Styling (note: xlsx library has limited styling support)
      // For full styling, consider using 'xlsx-style' or 'exceljs'

      // Set column widths
      worksheet['!cols'] = [
        { wch: 5 },
        { wch: 25 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 15 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "المستخدمين");

      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `المستخدمين_${date}.xlsx`);

      setMessage(`تم تصدير ${filteredUsers.length} مستخدم بنجاح`);
    } catch (err) {
      setError("فشل في التصدير: " + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleSaveUser = async (userData) => {
    try {
      if (editingUser) {
        // Update user
        await userApi.updateUser(editingUser.id, userData);
        toast.success("تم تحديث المستخدم بنجاح");
      } else {
        // Create user
        await userApi.createUser(userData);
        toast.success("تم إنشاء المستخدم بنجاح");
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      toast.error(err.message || "فشل في حفظ المستخدم");
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await userApi.toggleUserStatus(userId);
      toast.success("تم تغيير حالة المستخدم بنجاح");
      loadUsers();
    } catch (err) {
      toast.error(err.message || "فشل في تغيير حالة المستخدم");
    }
  };

  const handleDeleteUser = (userId) => {
    setDeleteConfirm({ isOpen: true, userId, loading: false });
  };

  const confirmDelete = async () => {
    setDeleteConfirm((prev) => ({ ...prev, loading: true }));
    try {
      await userApi.deleteUser(deleteConfirm.userId);
      toast.success("تم حذف المستخدم بنجاح");
      setDeleteConfirm({ isOpen: false, userId: null, loading: false });
      loadUsers();
    } catch (err) {
      toast.error(err.message || "فشل في حذف المستخدم");
      setDeleteConfirm({ isOpen: false, userId: null, loading: false });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, userId: null, loading: false });
  };

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    inactive: users.filter((u) => !u.is_active).length,
  };

  // Get unique roles
  const uniqueRoles = [...new Set(users.map((u) => u.role))];

  const filteredUsers = users.filter(
    (user) => {
      const matchesSearch =
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm);

      const matchesRole = roleFilter === "" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "" ||
        (statusFilter === "active" && user.is_active) ||
        (statusFilter === "inactive" && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    }
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handleSort = (newSortConfig) => {
    setSortConfig(newSortConfig);

    if (!newSortConfig.key || !newSortConfig.direction) {
      // إذا تم إلغاء الترتيب، عد للترتيب الافتراضي (حسب ID مثلاً)
      setUsers([...users].sort((a, b) => a.id - b.id));
      return;
    }

    const sorted = [...users].sort((a, b) => {
      let aValue = a[newSortConfig.key];
      let bValue = b[newSortConfig.key];

      // معالجة التواريخ
      if (newSortConfig.key === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
        return newSortConfig.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }

      // معالجة النصوص العربية
      if (typeof aValue === 'string') {
        return newSortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue, 'ar')
          : bValue.localeCompare(aValue, 'ar');
      }

      // معالجة الأرقام والقيم الأخرى
      return newSortConfig.direction === 'asc'
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1;
    });

    setUsers(sorted);
  };

  const mainStats = [
    {
      id: 1,
      title: "إجمالي المستخدمين",
      value: stats.total,
      unit: "مستخدم",
      icon: User,
      iconColor: "text-secondary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-f"
    },
    {
      id: 2,
      title: "إجمالي المستخدمين النشطين",
      value: stats.active,
      unit: "مستخدم",
      icon: User,
      iconColor: "text-primary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-primary-f"
    },
    {
      id: 3,
      title: "إجمالي المستخدمين المعطلين",
      value: stats.inactive,
      unit: "مستخدم",
      unit: "مستخدم",
      icon: User,
      iconColor: "text-secondary-s",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-s"
    },
    {
      id: 4,
      title: "عدد الأدوار الفريدة",
      value: uniqueRoles.length,
      unit: "دور",
      icon: User,
      iconColor: "text-secondary-t",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-t"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 space-y-8 p-2">
      <div className=" mx-auto">
        <PageHeader
          title="إدارة المستخدمين"
          subtitle={`إجمالي المستخدمين: ${users.length}`}
          actionLabel="إضافة مستخدم جديد"
          onAction={handleCreateUser}
        />

        {/* Stats Cards */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {mainStats.map((stat) => (
            <StatsCard key={stat.id} {...stat} />
          ))}
        </div>

        {/* Users Table Card */}
        <Card className="p-6">
          <div className="">
            <h2 className="text-xl font-bold">قائمة المستخدمين</h2>
          </div>

          {/* Messages */}
          <MessageAlert
            type="error"
            message={error}
            onDismiss={() => setError("")}
            dismissable={true}
          />
          <MessageAlert
            type="success"
            message={message}
            onDismiss={() => setMessage("")}
            dismissable={true}
          />

          {/* Search */}
          <div className="-my-4">
            <SearchInput
              placeholder="ابحث عن مستخدم (الاسم أو اسم المستخدم أو الهاتف)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FilterSelect
              label="الدور"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { value: "", label: "جميع الأدوار" },
                ...uniqueRoles.map((role) => ({
                  value: role,
                  label: UserRoleLabels[role] || role
                }))
              ]}
            />

            <FilterSelect
              label="الحالة"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "", label: "جميع المستخدمين" },
                { value: "active", label: "نشط فقط" },
                { value: "inactive", label: "معطل فقط" }
              ]}
            />

            <ResultsCounter
              current={filteredUsers.length}
              total={users.length}
            />
          </div>

          <div className="flex justify-between">
          {/* Rows Per Page Selector */}
          <div className=" flex justify-start">
            <RowsPerPageSelector
              value={rowsPerPage}
              onChange={setRowsPerPage}
              options={[5, 10, 20, 50]}
            />
          </div>

          {/* Export Button */}
          <Button
            onClick={exportToExcel}
            disabled={exportLoading || filteredUsers.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl"
          >
            {exportLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>جاري التصدير...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>تصدير Excel ({filteredUsers.length})</span>
              </>
            )}
          </Button>
          </div>


          {/* Users Table */}
          {loading ? (
            <LoadingState message="جاري تحميل المستخدمين..." />
          ) : filteredUsers.length === 0 ? (
            <EmptyState message="لا توجد مستخدمين" />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg ">
                <Table onSort={handleSort}>
                  <TableHeader>
                    <TableRow>
                      <TableHead sortable sortKey="full_name">الاسم</TableHead>
                      <TableHead sortable sortKey="username">اسم المستخدم</TableHead>
                      <TableHead sortable sortKey="phone">رقم الهاتف</TableHead>
                      <TableHead sortable sortKey="role">الدور</TableHead>
                      <TableHead sortable sortKey="created_at">تاريخ الإنشاء</TableHead>
                      <TableHead sortable sortKey="is_active">الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.full_name}
                        </TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell><span dir="ltr">{user.phone}</span></TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {UserRoleLabels[user.role] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="ghost">
                            {new Date(user.created_at).toLocaleDateString('en-US')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.is_active ? 'default' : 'destructive'}
                          >
                            {user.is_active ? 'نشط' : 'معطل'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">

                            <SwitchActive
                              isActive={user.is_active}
                              onToggle={() => handleToggleStatus(user.id)}
                              mode="playPause"
                              confirmBeforeToggle={true}
                            />
                            <CrudActions
                              onView={() => {
                                setSelectedUserId(user.id);
                                setShowDetailModal(true);
                              }}
                              onEdit={() => handleEditUser(user)}
                              onDelete={() => handleDeleteUser(user.id)}
                              size="md"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPrevious={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                onNext={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </Card>
      </div>

      {/* User Modal */}
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => setShowModal(false)}
          onSave={handleSaveUser}
        />
      )}

      {/* User Detail Modal */}
      {showDetailModal && selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedUserId(null);
          }}
        />
      )}

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="حذف المستخدم"
        message="هل أنت متأكد من رغبتك في حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={deleteConfirm.loading}
      />
    </div>
  );
}


