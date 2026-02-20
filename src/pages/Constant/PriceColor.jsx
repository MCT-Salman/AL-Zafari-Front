// src\pages\Constant\PriceColor.jsx
import { useState, useEffect, useMemo } from "react";
import { priceColorApi } from "../../api/priceColorApi";
import { colorApi } from "../../api/colorApi";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Download, DollarSign, Palette, Package } from "lucide-react";
import CrudActions from "../../components/common/CrudActions";
import StatsCard from "../../components/common/StatsCard";
import SearchInput from "../../components/common/SearchInput";
import MessageAlert from "../../components/common/MessageAlert";
import PageHeader from "../../components/common/PageHeader";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import ResultsCounter from "../../components/common/ResultsCounter";
import RowsPerPageSelector from "../../components/common/RowsPerPageSelector";
import PaginationControls from "../../components/common/PaginationControls";

export default function PriceColor() {
  // Create adapter to map generic CRUD method names to priceColorApi method names
  const priceColorApiAdapter = useMemo(() => ({
    getItems: (...args) => priceColorApi.getPriceColors(...args),
    getItemById: (...args) => priceColorApi.getPriceColorById(...args),
    createItem: (...args) => priceColorApi.createPriceColor(...args),
    updateItem: (...args) => priceColorApi.updatePriceColor(...args),
    deleteItem: (...args) => priceColorApi.deletePriceColor(...args),
  }), []);

  // Use CRUD hook
  const {
    items: priceColors,
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
  } = useCrud(priceColorApiAdapter, {
    idField: 'price_color_id',
    successMessages: {
      create: "تم إنشاء سعر اللون بنجاح",
      update: "تم تحديث سعر اللون بنجاح",
      delete: "تم حذف سعر اللون بنجاح",
    },
    errorMessages: {
      create: "فشل في حفظ سعر اللون",
      update: "فشل في حفظ سعر اللون",
      delete: "فشل في حذف سعر اللون",
      fetch: "فشل في تحميل أسعار الألوان",
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    color_id: "",
    constant_value_id: "",
    price_color_By: "",
    price_per_meter: "",
    notes: "",
  });
  const [formError, setFormError] = useState("");

  // Colors and constant values for dropdowns
  const [colors, setColors] = useState([]);
  const [constantValues, setConstantValues] = useState([]);

  // Load price colors, colors, and constant values on mount
  useEffect(() => {
    fetchItems();
    loadColors();
    loadConstantValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronize formData with selectedItem when modal opens in edit mode
  useEffect(() => {
    if (modalState.isOpen && modalState.mode === "edit" && selectedItem) {
      setFormData({
        color_id: selectedItem.color_id?.toString() || "",
        constant_value_id: selectedItem.constant_value_id?.toString() || "",
        price_color_By: selectedItem.price_color_By || "",
        price_per_meter: selectedItem.price_per_meter?.toString() || "",
        notes: selectedItem.notes || "",
      });
    } else if (modalState.isOpen && modalState.mode === "create") {
      setFormData({
        color_id: "",
        constant_value_id: "",
        price_color_By: "",
        price_per_meter: "",
        notes: "",
      });
    }
  }, [modalState.isOpen, modalState.mode, selectedItem]);

  // Load colors for dropdown
  const loadColors = async () => {
    try {
      const response = await colorApi.getColors();
      setColors(response.data || []);
    } catch (error) {
      console.error("Failed to load colors:", error);
    }
  };

  // Load all constant values for dropdown
  const loadConstantValues = async () => {
    try {
      // Same approach used in Material page: fetch values by type name
      // For PriceColor we typically need width values (22/44/66)
      const widthResponse = await constantApi.getConstantValuesByTypeName("width");
      setConstantValues(widthResponse.data || []);
    } catch (error) {
      console.error("Failed to load constant values:", error);
    }
  };

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Use export hook
  const { exportToExcel, loading: exportLoading } = useExport({
    columns: [
      { key: "color_name", header: "اللون", format: (item) => priceColorApi.getColorName(item) },
      { key: "color_code", header: "كود اللون", format: (item) => priceColorApi.getColorCode(item) },
      { key: "material_name", header: "المادة", format: (item) => priceColorApi.getMaterialName(item) },
      { key: "constant_value", header: "القيمة الثابتة", format: (item) => priceColorApi.getConstantValue(item) },
      { key: "price_per_meter", header: "السعر" },
      { key: "price_color_By", header: "طريقة التسعير" },
      { key: "notes", header: "الملاحظات" },
    ],
    columnWidths: [
      { wch: 5 },   // #
      { wch: 15 },  // اللون
      { wch: 12 },  // كود اللون
      { wch: 15 },  // المادة
      { wch: 15 },  // القيمة الثابتة
      { wch: 12 },  // السعر
      { wch: 15 },  // طريقة التسعير
      { wch: 25 },  // الملاحظات
    ],
    sheetName: "أسعار الألوان",
  });

  // Handle export
  const handleExport = () => {
    exportToExcel(filteredPriceColors, "أسعار_الألوان");
  };

  // Handle save with validation
  const handleSavePriceColor = async (data) => {
    setFormError("");

    // Validation
    const colorId = formData.color_id;
    const constantValueId = formData.constant_value_id;
    const priceColorBy = formData.price_color_By?.trim();
    const pricePerMeter = formData.price_per_meter;

    if (!colorId || !constantValueId || !priceColorBy || !pricePerMeter) {
      setFormError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // Validate price is a number
    if (isNaN(pricePerMeter) || parseFloat(pricePerMeter) <= 0) {
      setFormError("يرجى إدخال سعر صالح");
      return;
    }

    // Prepare data to send
    const dataToSend = {
      color_id: parseInt(colorId),
      constant_value_id: parseInt(constantValueId),
      price_color_By: priceColorBy,
      price_per_meter: parseFloat(pricePerMeter),
      notes: formData.notes || "",
    };

    await handleSave(dataToSend);
  };

  // Calculate stats
  const stats = {
    total: priceColors.length,
    avgPrice: priceColors.length > 0
      ? (priceColors.reduce((sum, pc) => sum + parseFloat(pc.price_per_meter || 0), 0) / priceColors.length).toFixed(2)
      : 0,
    uniqueColors: [...new Set(priceColors.map(pc => pc.color_id))].length,
  };

  // Filter price colors
  let filteredPriceColors = priceColors.filter(
    (priceColor) => {
      const matchesSearch =
        priceColorApi.getColorName(priceColor)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        priceColorApi.getColorCode(priceColor)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        priceColorApi.getMaterialName(priceColor)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        priceColorApi.getConstantValue(priceColor)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        priceColor.price_per_meter?.toString().includes(searchTerm.toLowerCase()) ||
        priceColor.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    }
  );

  // Apply sorting if sortConfig is set
  if (sortConfig.key && sortConfig.direction) {
    filteredPriceColors = [...filteredPriceColors].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (typeof aValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue, "ar")
          : bValue.localeCompare(aValue, "ar");
      }

      return sortConfig.direction === "asc"
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1;
    });
  }

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredPriceColors.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedPriceColors = filteredPriceColors.slice(startIndex, endIndex);

  const handleSort = (newSortConfig) => {
    setSortConfig(newSortConfig);
  };

  const mainStats = [
    {
      id: 1,
      title: "إجمالي أسعار الألوان",
      value: stats.total,
      unit: "سعر",
      icon: DollarSign,
      iconColor: "text-secondary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-f"
    },
    {
      id: 2,
      title: "متوسط السعر",
      value: stats.avgPrice,
      unit: "سوري",
      icon: DollarSign,
      iconColor: "text-primary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-primary-f"
    },
    {
      id: 3,
      title: "عدد الألوان المميزة",
      value: stats.uniqueColors,
      unit: "لون",
      icon: Palette,
      iconColor: "text-secondary-s",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-s"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 space-y-8 p-2">
      <div className=" mx-auto">
        <PageHeader
          title="إدارة أسعار الألوان"
          subtitle={`إجمالي أسعار الألوان: ${priceColors.length}`}
          actionLabel="إضافة سعر جديد"
          onAction={openCreateModal}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {mainStats.map((stat) => (
            <StatsCard key={stat.id} {...stat} />
          ))}
        </div>

        {/* Price Colors Table Card */}
        <Card className="p-6">
          <div className="">
            <h2 className="text-xl font-bold">قائمة أسعار الألوان</h2>
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
              placeholder="ابحث عن سعر (اللون أو الكود أو المادة)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters and Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResultsCounter
              current={filteredPriceColors.length}
              total={priceColors.length}
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
              disabled={exportLoading || filteredPriceColors.length === 0}
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
                  <span>تصدير Excel ({filteredPriceColors.length})</span>
                </>
              )}
            </Button>
          </div>

          {/* Price Colors Table */}
          {loading ? (
            <LoadingState message="جاري تحميل أسعار الألوان..." />
          ) : filteredPriceColors.length === 0 ? (
            <EmptyState message="لا توجد أسعار ألوان" />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg ">
                <Table onSort={handleSort}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اللون</TableHead>
                      <TableHead>المادة</TableHead>
                      <TableHead>القيمة الثابتة</TableHead>
                      <TableHead sortable sortKey="price_per_meter">السعر</TableHead>
                      <TableHead>طريقة التسعير</TableHead>
                      <TableHead>الملاحظات</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPriceColors.map((priceColor) => (
                      <TableRow key={priceColor.price_color_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: priceColorApi.getColorCode(priceColor) || "#ccc" }}
                            />
                            <div>
                              <div>{priceColorApi.getColorName(priceColor)}</div>
                              <div className="text-xs text-gray-500">{priceColorApi.getColorCode(priceColor)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {priceColorApi.getMaterialName(priceColor)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {priceColorApi.getConstantValue(priceColor)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-800">
                            {priceColorApi.formatPriceDisplay(priceColor)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50">
                            {priceColor.price_color_By}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {priceColor.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CrudActions
                              onView={() => openViewModal(priceColor.price_color_id)}
                              onEdit={() => openEditModal(priceColor)}
                              onDelete={() => openDeleteModal(priceColor)}
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
        }}
        onSubmit={handleSavePriceColor}
        onDelete={handleDelete}
        data={selectedItem}
        title={
          modalState.mode === "create"
            ? "إضافة سعر جديد"
            : modalState.mode === "edit"
              ? "تعديل سعر اللون"
              : modalState.mode === "view"
                ? "تفاصيل سعر اللون"
                : ""
        }
        loading={modalState.loading}
        size="lg"
        formData={formData}
        setFormData={setFormData}
        fields={
          modalState.mode === "view"
            ? [
              { key: "color_name", label: "اللون", formatValue: (key, value) => priceColorApi.getColorName(selectedItem) },
              { key: "color_code", label: "كود اللون", formatValue: (key, value) => priceColorApi.getColorCode(selectedItem) },
              { key: "material_name", label: "المادة", formatValue: (key, value) => priceColorApi.getMaterialName(selectedItem) },
              { key: "constant_value", label: "القيمة الثابتة", formatValue: (key, value) => priceColorApi.getConstantValue(selectedItem) },
              { key: "price_per_meter", label: "السعر" },
              { key: "price_color_By", label: "طريقة التسعير" },
              { key: "notes", label: "الملاحظات" },
            ]
            : []
        }
        deleteTitle="حذف سعر اللون"
        deleteMessage="هل أنت متأكد من رغبتك في حذف هذا السعر؟ لا يمكن التراجع عن هذا الإجراء."
        itemName={priceColorApi.formatPriceInfo(selectedItem)}
      >
        {(modalState.mode === "create" || modalState.mode === "edit") && (
          <div className="space-y-4">
            {formError && (
              <MessageAlert
                type="error"
                message={formError}
                dismissable={false}
              />
            )}
            <div className="space-y-2">
              <Label>اللون <span className="text-red-500">*</span></Label>
              <Select
                value={formData.color_id?.toString()}
                onValueChange={(value) => setFormData({ ...formData, color_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر اللون" />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color.color_id} value={color.color_id.toString()}>
                      {color.color_name} ({color.color_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>القيمة الثابتة <span className="text-red-500">*</span></Label>
              <Select
                value={formData.constant_value_id?.toString()}
                onValueChange={(value) => setFormData({ ...formData, constant_value_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر القيمة" />
                </SelectTrigger>
                <SelectContent>
                  {constantValues.map((val) => (
                    <SelectItem key={val.constant_value_id} value={val.constant_value_id.toString()}>
                      {val.label || val.value || val.constant_value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>طريقة التسعير <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                value={formData.price_color_By}
                onChange={(e) => setFormData({ ...formData, price_color_By: e.target.value })}
                placeholder="مثال: لكل متر"
              />
            </div>
            <div className="space-y-2">
              <Label>السعر <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={formData.price_per_meter}
                onChange={(e) => setFormData({ ...formData, price_per_meter: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>الملاحظات</Label>
              <Textarea
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
