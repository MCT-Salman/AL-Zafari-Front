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
import { ToggleLeft, ToggleRight } from "lucide-react";
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
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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
      setError(err.message || "فشل في تحميل المستخدمين");
    } finally {
      setLoading(false);
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
        setMessage("تم تحديث المستخدم بنجاح");
      } else {
        // Create user
        await userApi.createUser(userData);
        setMessage("تم إنشاء المستخدم بنجاح");
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      setError(err.message || "فشل في حفظ المستخدم");
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await userApi.toggleUserStatus(userId);
      setMessage("تم تغيير حالة المستخدم بنجاح");
      loadUsers();
    } catch (err) {
      setError(err.message || "فشل في تغيير حالة المستخدم");
    }
  };

  const handleDeleteUser = (userId) => {
    setDeleteConfirm({ isOpen: true, userId, loading: false });
  };

  const confirmDelete = async () => {
    setDeleteConfirm((prev) => ({ ...prev, loading: true }));
    try {
      await userApi.deleteUser(deleteConfirm.userId);
      setMessage("تم حذف المستخدم بنجاح");
      setDeleteConfirm({ isOpen: false, userId: null, loading: false });
      loadUsers();
    } catch (err) {
      setError(err.message || "فشل في حذف المستخدم");
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="إدارة المستخدمين"
          subtitle={`إجمالي المستخدمين: ${users.length}`}
          actionLabel="إضافة مستخدم جديد"
          onAction={handleCreateUser}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            label="إجمالي المستخدمين"
            value={stats.total}
            variant="blue"
          />
          <StatsCard
            label="نشط"
            value={stats.active}
            variant="green"
          />
          <StatsCard
            label="معطل"
            value={stats.inactive}
            variant="red"
          />
          <StatsCard
            label="عدد الأدوار"
            value={uniqueRoles.length}
            variant="purple"
          />
        </div>

        {/* Users Table Card */}
        <Card className="p-6">
          <div className="mb-6">
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
          <div className="mb-6">
            <SearchInput
              placeholder="ابحث عن مستخدم (الاسم أو اسم المستخدم أو الهاتف)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

          {/* Rows Per Page Selector */}
          <div className="mb-6 flex justify-end">
            <RowsPerPageSelector
              value={rowsPerPage}
              onChange={setRowsPerPage}
              options={[5, 10, 20, 50]}
            />
          </div>

          {/* Users Table */}
          {loading ? (
            <LoadingState message="جاري تحميل المستخدمين..." />
          ) : filteredUsers.length === 0 ? (
            <EmptyState message="لا توجد مستخدمين" icon="👥" />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>اسم المستخدم</TableHead>
                      <TableHead>رقم الهاتف</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead>الحالة</TableHead>
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
