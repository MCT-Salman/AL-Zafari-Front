// src\pages\Users.jsx
import { useState, useEffect, useMemo } from "react";
import { userApi } from "../api/userApi";
import { useCrud } from "../hooks/useCrud";
import { useExport } from "../hooks/useExport";
import { CrudModal } from "../components/common/CrudModal";
import UserForm from "../components/UserForm";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Download, User } from "lucide-react";
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
import { UserRoleLabels } from "../enums";

export default function Users() {
  // Create adapter to map generic CRUD method names to userApi method names
  // Use useMemo to prevent recreating the adapter on every render
  const userApiAdapter = useMemo(() => ({
    getItems: (...args) => userApi.getUsers(...args),
    getItemById: (...args) => userApi.getUserById(...args),
    createItem: (...args) => userApi.createUser(...args),
    updateItem: (...args) => userApi.updateUser(...args),
    deleteItem: (...args) => userApi.deleteUser(...args),
    toggleStatus: (...args) => userApi.toggleUserStatus(...args),
  }), []);

  // Use CRUD hook
  const {
    items: users,
    loading,
    error,
    modalState,
    selectedItem,
    fetchItems,
    openCreateModal,
    openEditModal,
    openViewModal,
    openDeleteModal,
    closeModal,
    handleSave,
    handleDelete,
    toggleStatus,
  } = useCrud(userApiAdapter, {
    successMessages: {
      create: "تم إنشاء المستخدم بنجاح",
      update: "تم تحديث المستخدم بنجاح",
      delete: "تم حذف المستخدم بنجاح",
      toggle: "تم تغيير حالة المستخدم بنجاح",
    },
    errorMessages: {
      create: "فشل في حفظ المستخدم",
      update: "فشل في حفظ المستخدم",
      delete: "فشل في حذف المستخدم",
      toggle: "فشل في تغيير حالة المستخدم",
      fetch: "فشل في تحميل المستخدمين",
    },
  });

  // Form state for UserForm
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    phone: "",
    password: "",
    role: "sales",
  });
  const [formError, setFormError] = useState("");

  // Load users on mount
  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Use export hook
  const { exportToExcel, loading: exportLoading } = useExport({
    columns: [
      { key: 'full_name', header: 'الاسم الكامل' },
      { key: 'username', header: 'اسم المستخدم' },
      { key: 'phone', header: 'رقم الهاتف' },
      { 
        key: 'role', 
        header: 'الدور',
        format: (value) => UserRoleLabels[value] || value
      },
      { 
        key: 'is_active', 
        header: 'الحالة',
        format: (value) => value ? 'نشط' : 'معطل'
      },
      { 
        key: 'created_at', 
        header: 'تاريخ الإنشاء',
        format: (value) => new Date(value).toLocaleDateString('ar-SA')
      },
      { 
        key: 'updated_at', 
        header: 'آخر تحديث',
        format: (value) => value ? new Date(value).toLocaleDateString('ar-SA') : ''
      },
    ],
    columnWidths: [
      { wch: 5 },   // #
      { wch: 25 },  // الاسم الكامل
      { wch: 20 },  // اسم المستخدم
      { wch: 15 },  // رقم الهاتف
      { wch: 15 },  // الدور
      { wch: 10 },  // الحالة
      { wch: 15 },  // تاريخ الإنشاء
      { wch: 15 },  // آخر تحديث
    ],
    sheetName: 'المستخدمين',
  });

  // Handle export
  const handleExport = () => {
    exportToExcel(filteredUsers, 'المستخدمين');
  };

  // Handle save with validation
  // Can be called as: handleSaveUser(userData) for create, or handleSaveUser(id, userData) for edit
  const handleSaveUser = async (idOrUserData, userData) => {
    setFormError("");
    
    // Determine if first argument is ID (edit mode) or userData (create mode)
    const isEditMode = typeof idOrUserData === 'number' || typeof idOrUserData === 'string';
    const actualUserData = isEditMode ? userData : idOrUserData;
    
    // Validation - check for required fields (trim to handle whitespace)
    const username = actualUserData?.username?.trim();
    const fullName = actualUserData?.full_name?.trim();
    const phone = actualUserData?.phone?.trim();
    
    if (!username || !fullName || !phone) {
      setFormError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // Password is only required for new users (when not in edit mode)
    if (!isEditMode && (!actualUserData.password || !actualUserData.password.trim())) {
      setFormError("كلمة المرور مطلوبة للمستخدمين الجدد");
      return;
    }

    // If password is provided (even in edit mode), validate its length
    if (actualUserData.password && actualUserData.password.trim() && actualUserData.password.trim().length < 8) {
      setFormError("يجب أن تكون كلمة المرور 8 أحرف على الأقل");
      return;
    }

    // Prepare data to send
    const dataToSend = {
      username: username,
      full_name: fullName,
      phone: phone,
      role: actualUserData.role || "sales",
    };

    // Only include password if it's provided and not empty (for edit mode, empty password means don't change it)
    if (actualUserData.password && actualUserData.password.trim()) {
      dataToSend.password = actualUserData.password.trim();
    }

    await handleSave(dataToSend);
  };

  // Handle toggle status
  const handleToggleStatus = async (userId) => {
    await toggleStatus(userId);
  };

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    inactive: users.filter((u) => !u.is_active).length,
  };

  // Get unique roles
  const uniqueRoles = [...new Set(users.map((u) => u.role))];

  let filteredUsers = users.filter(
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

  // Apply sorting if sortConfig is set
  if (sortConfig.key && sortConfig.direction) {
    filteredUsers = [...filteredUsers].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // معالجة التواريخ
      if (sortConfig.key === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
        return sortConfig.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }

      // معالجة النصوص العربية
      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue, 'ar')
          : bValue.localeCompare(aValue, 'ar');
      }

      // معالجة الأرقام والقيم الأخرى
      return sortConfig.direction === 'asc'
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1;
    });
  }

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
          onAction={openCreateModal}
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
          {error && (
            <MessageAlert
              type="error"
              message={error}
              onDismiss={() => {}}
              dismissable={true}
            />
          )}

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
            onClick={handleExport}
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
                              onView={() => openViewModal(user.id)}
                              onEdit={() => openEditModal(user)}
                              onDelete={() => openDeleteModal(user)}
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

      {/* Unified CRUD Modal */}
      <CrudModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        onClose={() => {
          closeModal();
          setFormError("");
          setFormData({
            username: "",
            full_name: "",
            phone: "",
            password: "",
            role: "sales",
          });
        }}
        onSubmit={handleSaveUser}
        onDelete={handleDelete}
        data={selectedItem}
        title={
          modalState.mode === 'create' 
            ? 'إضافة مستخدم جديد' 
            : modalState.mode === 'edit' 
            ? 'تعديل المستخدم' 
            : modalState.mode === 'view'
            ? 'تفاصيل المستخدم'
            : ''
        }
        loading={modalState.loading}
        size="lg"
        formData={formData}
        setFormData={setFormData}
        fields={
          modalState.mode === 'view'
            ? [
                { key: 'full_name', label: 'الاسم الكامل' },
                { key: 'username', label: 'اسم المستخدم' },
                { key: 'phone', label: 'رقم الهاتف' },
                { key: 'role', label: 'الدور', formatValue: (key, value) => UserRoleLabels[value] || value },
                { key: 'is_active', label: 'الحالة' },
                { key: 'created_at', label: 'تاريخ الإنشاء' },
                { key: 'updated_at', label: 'آخر تحديث' },
              ]
            : []
        }
        deleteTitle="حذف المستخدم"
        deleteMessage="هل أنت متأكد من رغبتك في حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء."
        itemName={selectedItem?.full_name || selectedItem?.username}
      >
        {(modalState.mode === 'create' || modalState.mode === 'edit') && (
          <UserForm
            user={selectedItem}
            formData={formData}
            setFormData={setFormData}
            loading={modalState.loading}
            error={formError}
          />
        )}
      </CrudModal>
    </div>
  );
}

