// src\pages\constants\ConstantType.jsx
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { constantApi } from "../../api/constantApi";
import { useCrud } from "../../hooks/useCrud";
import { useExport } from "../../hooks/useExport";
import { CrudModal } from "../../components/common/CrudModal";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Download, Settings } from "lucide-react";
import CrudActions from "../../components/common/CrudActions";
import StatsCard from "../../components/common/StatsCard";
import SearchInput from "../../components/common/SearchInput";
import FilterSelect from "../../components/common/FilterSelect";
import MessageAlert from "../../components/common/MessageAlert";
import PageHeader from "../../components/common/PageHeader";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import ResultsCounter from "../../components/common/ResultsCounter";
import RowsPerPageSelector from "../../components/common/RowsPerPageSelector";
import PaginationControls from "../../components/common/PaginationControls";

export default function ConstantType() {
  // Create adapter to map generic CRUD method names to constantApi method names
  const constantTypeApiAdapter = useMemo(() => ({
    getItems: (...args) => constantApi.getConstantTypes(...args),
    getItemById: (...args) => constantApi.getConstantTypeById(...args),
    createItem: (...args) => constantApi.createConstantType(...args),
    updateItem: (...args) => constantApi.updateConstantType(...args),
    deleteItem: (...args) => constantApi.deleteConstantType(...args),
  }), []);

  // Use CRUD hook
  const {
    items: constantTypes,
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
  } = useCrud(constantTypeApiAdapter, {
    idField: 'constant_type_id',
    successMessages: {
      create: "تم إنشاء نوع الثابت بنجاح",
      update: "تم تحديث نوع الثابت بنجاح",
      delete: "تم حذف نوع الثابت بنجاح",
    },
    errorMessages: {
      create: "فشل في حفظ نوع الثابت",
      update: "فشل في حفظ نوع الثابت",
      delete: "فشل في حذف نوع الثابت",
      fetch: "فشل في تحميل أنواع الثوابت",
    },
  });

  // Form state for ConstantTypeForm
  const [formData, setFormData] = useState({
    constants_Type_name: "",
    type: "",
    notes: "",
  });
  const [formError, setFormError] = useState("");

  // Load constant types on mount
  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Use export hook
  const { exportToExcel, loading: exportLoading } = useExport({
    columns: [
      { key: 'constants_Type_name', header: 'اسم النوع' },
      { key: 'type', header: 'المعرف الفني' },
      { key: 'notes', header: 'الملاحظات' },
      {
        key: 'values',
        header: 'عدد القيم',
        format: (value) => value?.length || 0
      },
    ],
    columnWidths: [
      { wch: 5 },   // #
      { wch: 25 },  // اسم النوع
      { wch: 20 },  // المعرف الفني
      { wch: 30 },  // الملاحظات
      { wch: 12 },  // عدد القيم
    ],
    sheetName: 'أنواع الثوابت',
  });

  // Handle export
  const handleExport = () => {
    exportToExcel(filteredTypes, 'أنواع_الثوابت');
  };

  // Handle save with validation
  const handleSaveType = async (idOrTypeData, typeData) => {
    setFormError("");

    // Determine if first argument is ID (edit mode) or typeData (create mode)
    const isEditMode = typeof idOrTypeData === 'number' || typeof idOrTypeData === 'string';
    const actualTypeData = isEditMode ? typeData : idOrTypeData;

    // Validation - check for required fields (trim to handle whitespace)
    const typeName = actualTypeData?.constants_Type_name?.trim();
    const typeKey = actualTypeData?.type?.trim();

    if (!typeName || !typeKey) {
      setFormError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // Prepare data to send
    const dataToSend = {
      constants_Type_name: typeName,
      type: typeKey,
      notes: actualTypeData.notes || "",
    };

    await handleSave(dataToSend);
  };

  // Calculate stats
  const stats = {
    total: constantTypes.length,
    withValues: constantTypes.filter((t) => t.values && t.values.length > 0).length,
    withoutValues: constantTypes.filter((t) => !t.values || t.values.length === 0).length,
  };

  let filteredTypes = constantTypes.filter(
    (type) => {
      const matchesSearch =
        type.constants_Type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    }
  );

  // Apply sorting if sortConfig is set
  if (sortConfig.key && sortConfig.direction) {
    filteredTypes = [...filteredTypes].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

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
  }, [searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTypes.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedTypes = filteredTypes.slice(startIndex, endIndex);

  const handleSort = (newSortConfig) => {
    setSortConfig(newSortConfig);
  };

  const mainStats = [
    {
      id: 1,
      title: "إجمالي أنواع الثوابت",
      value: stats.total,
      unit: "نوع",
      icon: Settings,
      iconColor: "text-secondary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-f"
    },
    {
      id: 2,
      title: "أنواع بها قيم",
      value: stats.withValues,
      unit: "نوع",
      icon: Settings,
      iconColor: "text-primary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-primary-f"
    },
    {
      id: 3,
      title: "أنواع بدون قيم",
      value: stats.withoutValues,
      unit: "نوع",
      icon: Settings,
      iconColor: "text-secondary-s",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-s"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 space-y-8 p-2">
      <div className=" mx-auto">
        <PageHeader
          title="إدارة أنواع الثوابت"
          subtitle={`إجمالي الأنواع: ${constantTypes.length}`}
          actionLabel="إضافة نوع ثابت جديد"
          onAction={openCreateModal}
        />

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {mainStats.map((stat) => (
            <StatsCard key={stat.id} {...stat} />
          ))}
        </div> */}

        {/* Constant Types Table Card */}
        <Card className="p-6">
          <div className="">
            <h2 className="text-xl font-bold">قائمة أنواع الثوابت</h2>
          </div>

          {/* Messages */}
          {error && (
            <MessageAlert
              type="error"
              message={error}
              onDismiss={() => { }}
              dismissable={true}
            />
          )}

          {/* Search */}
          <div className="-my-4">
            <SearchInput
              placeholder="ابحث عن نوع ثابت (الاسم أو المعرف الفني أو الملاحظات)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters and Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResultsCounter
              current={filteredTypes.length}
              total={constantTypes.length}
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
              disabled={exportLoading || filteredTypes.length === 0}
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
                  <span>تصدير Excel ({filteredTypes.length})</span>
                </>
              )}
            </Button>
          </div>

          {/* Constant Types Table */}
          {loading ? (
            <LoadingState message="جاري تحميل أنواع الثوابت..." />
          ) : filteredTypes.length === 0 ? (
            <EmptyState message="لا توجد أنواع ثوابت" />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg ">
                <Table onSort={handleSort}>
                  <TableHeader>
                    <TableRow>
                      <TableHead sortable sortKey="constants_Type_name">اسم النوع</TableHead>
                      <TableHead sortable sortKey="type">المعرف الفني</TableHead>
                      <TableHead sortable sortKey="notes">الملاحظات</TableHead>
                      <TableHead>عدد القيم</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTypes.map((type) => (
                      <TableRow key={type.constant_type_id}>
                        <TableCell className="font-medium">
                          {type.constants_Type_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {type.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {type.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {type.values?.length || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CrudActions
                              onView={() => openViewModal(type.constant_type_id)}
                              onEdit={() => openEditModal(type)}
                              onDelete={() => openDeleteModal(type)}
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
            constants_Type_name: "",
            type: "",
            notes: "",
          });
        }}
        onSubmit={handleSaveType}
        onDelete={handleDelete}
        data={selectedItem}
        title={
          modalState.mode === 'create'
            ? 'إضافة نوع ثابت جديد'
            : modalState.mode === 'edit'
              ? 'تعديل نوع الثابت'
              : modalState.mode === 'view'
                ? 'تفاصيل نوع الثابت'
                : ''
        }
        loading={modalState.loading}
        size="lg"
        formData={formData}
        setFormData={setFormData}
        fields={
          modalState.mode === 'view'
            ? [
              { key: 'constants_Type_name', label: 'اسم النوع' },
              { key: 'type', label: 'المعرف الفني' },
              { key: 'notes', label: 'الملاحظات' },
              {
                key: 'values',
                label: 'القيم المرتبطة',
                formatValue: (key, value) => {
                  if (!value || value.length === 0) return 'لا توجد قيم';
                  return value.map(v => v.value).join('، ');
                }
              },
            ]
            : []
        }
        deleteTitle="حذف نوع الثابت"
        deleteMessage="هل أنت متأكد من رغبتك في حذف هذا النوع الثابت؟ سيتم حذف جميع القيم المرتبطة به أيضاً. لا يمكن التراجع عن هذا الإجراء."
        itemName={selectedItem?.constants_Type_name}
      >
        {(modalState.mode === 'create' || modalState.mode === 'edit') && (
          <div className="space-y-4">
            {formError && (
              <MessageAlert
                type="error"
                message={formError}
                dismissable={false}
              />
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">المعرف الفني <span className="text-red-500">*</span></label>
              <FilterSelect
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={[
                  { value: "height", label: "الطول" },
                  { value: "width", label: "العرض" },
                  { value: "thickness", label: "السماكة" },
                ]}
                placeholder="اختر نوع الثابت"
              />
              {/* <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="مثال: width"
              />
              <p className="text-xs text-gray-500">يجب أن يكون فريداً وباللغة الإنجليزية بدون مسافات</p> */}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">اسم النوع <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={formData.constants_Type_name}
                onChange={(e) => setFormData({ ...formData, constants_Type_name: e.target.value })}
                placeholder="مثال: عرض"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">الملاحظات</label>
              <textarea
                className="w-full p-2 border rounded-md"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="ملاحظات إضافية..."
              />
            </div>
          </div>
        )}
      </CrudModal>
    </div>
  );
}
