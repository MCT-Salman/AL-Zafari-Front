// src\pages\Constant\PriceColor.jsx
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { priceColorApi } from "../../api/priceColorApi";
import { colorApi } from "../../api/colorApi";
import { rulerApi } from "../../api/rulerApi";
import { materialApi } from "../../api/materialApi";
import { settingApi } from "../../api/settingApi";
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
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Download, DollarSign, Palette, Package } from "lucide-react";
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
import { getApiData } from "../../utils/api";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");
const resolveColorImage = (color) => {
  if (!color) return null;
  const raw = color.imageUrl || color.image_url || color.color_image || null;
  if (!raw) return null;
  return raw.startsWith("http") ? raw : `${API_BASE_URL}${raw}`;
};
const formatTypeItemForExport = (value) => {
  if (value === "Machine") return "مكنة";
  if (value === "Presser") return "كوي";
  return "غير محدد";
};
const formatPricingByForExport = (value) => {
  switch (value) {
    case "isByMeter22":
      return "22 مم";
    case "isByMeter44":
      return "44 مم";
    case "isByMeter66":
      return "66 مم";
    case "isByBlanck":
    case "blanck":
      return "قطعة";
    default:
      return "غير محدد";
  }
};

export default function PriceColor() {
  // Create adapter to map generic CRUD method names to priceColorApi method names
  const priceColorApiAdapter = useMemo(() => ({
    getItems: (...args) => priceColorApi.getPriceColors(...args),
    getItemById: (...args) => priceColorApi.getPriceColorById(...args),
    createItem: (...args) => priceColorApi.createPriceColor(...args),
    updateItem: (...args) => priceColorApi.updatePriceColor(...args),
    deleteItem: (...args) => priceColorApi.deletePriceColor(...args),
  }), []);

  // State for USD price display setting
  const [showUsdPrice, setShowUsdPrice] = useState(true);

  // Load USD setting
  useEffect(() => {
    const loadUsdSetting = async () => {
      try {
        const res = await settingApi.getSettingByKey?.("price_color_show_usd_price");
        const payload = res?.data ?? res;
        const value = payload?.data?.value ?? payload?.data?.setting_value ?? payload?.value ?? payload?.setting_value ?? payload?.data ?? null;
        if (value == null) return;
        const v = String(value).toLowerCase();
        setShowUsdPrice(v === "true" || v === "1" || v === "yes" || v === "on");
      } catch {
        // keep default
      }
    };
    loadUsdSetting();
  }, []);

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
    keepOpenOnCreate: true,
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
    material_id: "",
    ruler_id: "",
    color_id: "",
    type_item: "",
    price_color_By: "",
    price_per_meter: "",
    notes: "",
  });
  const [formError, setFormError] = useState("");

  // Colors, Rulers and Materials for dropdowns/filters
  const [colors, setColors] = useState([]);
  const [rulers, setRulers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const selectedMaterial = useMemo(() => {
    if (!formData.material_id) return null;
    return materials.find(
      (m) => m.material_id?.toString() === formData.material_id?.toString()
    );
  }, [materials, formData.material_id]);
  const isSelectedMaterialPvc = useMemo(() => {
    const name = selectedMaterial?.material_name || "";
    return name.toLowerCase().includes("pvc");
  }, [selectedMaterial]);

  // Load price colors, colors, rulers and materials on mount
  useEffect(() => {
    fetchItems();
    loadColors();
    loadRulers();
    loadMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle open create modal
  const handleOpenCreate = () => {
    setFormError("");
    setFormData({
      material_id: formData.material_id || "",
      ruler_id: formData.ruler_id || "",
      color_id: "",
      type_item: "Machine",
      price_color_By: formData.price_color_By || "isByMeter22",
      price_per_meter: "",
      notes: "",
    });
    openCreateModal();
  };

  // Handle open edit modal
  const handleOpenEdit = (priceColor) => {
    setFormError("");
    const color = priceColor.color;
    const ruler = color?.ruler;

    // Deep extraction of IDs
    const materialId = (
      priceColor.material_id ||
      ruler?.material_id ||
      ruler?.material?.material_id ||
      ruler?.material?.id
    )?.toString() || "";

    const rulerId = (
      priceColor.ruler_id ||
      color?.ruler_id ||
      ruler?.ruler_id ||
      ruler?.id
    )?.toString() || "";

    const colorId = (
      priceColor.color_id ||
      color?.color_id ||
      color?.id
    )?.toString() || "";

    setFormData({
      material_id: materialId,
      ruler_id: rulerId,
      color_id: colorId,
      type_item: priceColor.type_item || "Machine",
      price_color_By: priceColor.price_color_By === "blanck" ? "isByBlanck" : (priceColor.price_color_By || "isByMeter22"),
      price_per_meter: priceColor.price_per_meter !== undefined ? priceColor.price_per_meter.toString() : "",
      notes: priceColor.notes || "",
    });
    openEditModal(priceColor);
  };

  // Load colors for dropdown
  const loadColors = async () => {
    try {
      const response = await colorApi.getColors();
      // Handle both { data: [...] } and [...] structures
      setColors(getApiData(response, []) || []);
    } catch (error) {
      // console.error("Failed to load colors:", error);
    }
  };

  // Load rulers for filters
  const loadRulers = async () => {
    try {
      const response = await rulerApi.getRulers();
      setRulers(getApiData(response, []) || []);
    } catch (error) {
      // console.error("Failed to load rulers:", error);
    }
  };

  // Load materials for filters
  const loadMaterials = async () => {
    try {
      const response = await materialApi.getMaterials();
      setMaterials(getApiData(response, []) || []);
    } catch (error) {
      // console.error("Failed to load materials:", error);
    }
  };

  // Load rulers for a specific material
  const loadRulersByMaterial = async (materialId) => {
    if (!materialId) {
      setRulers([]);
      return;
    }
    try {
      const response = await rulerApi.getRulersByMaterial(materialId);
      setRulers(getApiData(response, []) || []);
    } catch (error) {
      // console.error("Failed to load rulers by material:", error);
      setRulers([]);
    }
  };

  // Handle material change - load rulers for the selected material
  const handleMaterialChange = (materialId) => {
    setFormData({
      ...formData,
      material_id: materialId,
      ruler_id: "",
      color_id: "",
    });
    loadRulersByMaterial(materialId);
  };
  const getColorNameResolved = (priceColor) => {
    const name = priceColor?.color?.color_name || priceColor?.color_name;
    if (name) return name;
    const colorId = priceColor?.color_id || priceColor?.color?.color_id;
    if (colorId && colors.length > 0) {
      const color = colors.find(c => String(c.color_id) === String(colorId));
      if (color?.color_name) return color.color_name;
    }
    return "غير محدد";
  };
  const getRulerNameResolved = (priceColor) => {
    const name = priceColor?.color?.ruler?.ruler_name || priceColor?.ruler_name;
    if (name) return name;
    const rulerId =
      priceColor?.ruler_id ||
      priceColor?.color?.ruler_id ||
      priceColor?.color?.ruler?.ruler_id;
    if (rulerId && rulers.length > 0) {
      const ruler = rulers.find(r => String(r.ruler_id) === String(rulerId));
      if (ruler?.ruler_name) return ruler.ruler_name;
    }
    return "غير محدد";
  };
  const getMaterialNameResolved = (priceColor) => {
    const name = priceColor?.color?.ruler?.material?.material_name || priceColor?.material_name;
    if (name) return name;
    const materialId =
      priceColor?.material_id ||
      priceColor?.color?.ruler?.material_id ||
      priceColor?.color?.ruler?.material?.material_id;
    if (materialId && materials.length > 0) {
      const material = materials.find(m => String(m.material_id) === String(materialId));
      if (material?.material_name) return material.material_name;
    }
    return "غير محدد";
  };

  // Mapping for labels
  const typeItemOptions = [
    { value: "Machine", label: "مكنة" },
    { value: "Presser", label: "كوي" },
  ];

  // Dynamic pricing options based on material type
  const dynamicPricingOptions = useMemo(() => {
    const baseOptions = [
      { value: "isByMeter22", label: "22 مم" },
      { value: "isByMeter44", label: "44 مم" },
      { value: "isByMeter66", label: "66 مم" },
    ];
    
    // Add "قطعة" option only if material is not PVC
    if (!isSelectedMaterialPvc) {
      baseOptions.push({ value: "isByBlanck", label: "قطعة" });
    }
    
    return baseOptions;
  }, [isSelectedMaterialPvc]);

  const getLabel = (options, value) => {
    // Check both standard value and legacy 'blanck'
    const actualValue = value === "blanck" ? "isByBlanck" : value;
    return options.find(opt => opt.value === actualValue)?.label || actualValue || "-";
  };

  // Filter states for the main page
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedColorId, setSelectedColorId] = useState("");
  const [selectedRulerId, setSelectedRulerId] = useState("");
  const [selectedMaterialName, setSelectedMaterialName] = useState("");
  const [filteredRulers, setFilteredRulers] = useState([]);

  // Handle material filter change - update rulers list
  const handleMaterialFilterChange = (materialName) => {
    setSelectedMaterialName(materialName);
    setSelectedRulerId(""); // Reset ruler selection
    setSelectedColorId(""); // Reset color selection too
    
    if (!materialName) {
      // Show all rulers when no material is selected
      setFilteredRulers(sortedRulers);
    } else {
      // Find the selected material and filter rulers by material_id
      const material = materials.find(m => m.material_name === materialName);
      const materialId = material?.material_id;
      if (materialId) {
        const filtered = sortedRulers.filter(r => r.material_id?.toString() === materialId?.toString());
        setFilteredRulers(filtered);
      } else {
        setFilteredRulers([]);
      }
    }
  };

  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Use export hook
  const { exportToExcel, loading: exportLoading } = useExport({
    columns: [
      { key: "color_name", header: "اللون", format: (item) => getColorNameResolved(item) },
      { key: "ruler_name", header: "المسطرة", format: (item) => getRulerNameResolved(item) },
      { key: "material_name", header: "المادة", format: (item) => getMaterialNameResolved(item) },
      { key: "type_item", header: "النوع", format: (item) => formatTypeItemForExport(item?.type_item) },
      { key: "price_color_By", header: "طريقة التسعير", format: (item) => formatPricingByForExport(item?.price_color_By) },
      { key: "price_per_meter", header: `السعر ${showUsdPrice ? "($)" : ""}` },
      { key: "notes", header: "الملاحظات" },
    ],
    columnWidths: [
      { wch: 20 },  // اللون
      { wch: 20 },  // المسطرة
      { wch: 20 },  // المادة
      { wch: 15 },  // النوع
      { wch: 20 },  // طريقة التسعير
      { wch: 15 },  // السعر
      { wch: 30 },  // الملاحظات
    ],
    sheetName: "أسعار الألوان",
  });

  // Handle export
  const handleExport = () => {
    exportToExcel(filteredPriceColors, "أسعار_الألوان");
  };



  // Handle save with validation
  const handleSavePriceColor = async (idOrData, data) => {
    setFormError("");

    const isEditMode = typeof idOrData === 'number' || typeof idOrData === 'string';
    const actualData = isEditMode ? data : idOrData;

    // Validation
    const colorId = actualData.color_id;
    const typeItem = actualData.type_item?.trim();
    const priceColorBy = actualData.price_color_By?.trim();
    const pricePerMeter = actualData.price_per_meter;
    const isPvcMaterial = (() => {
      const materialId = actualData.material_id;
      if (!materialId) return false;
      const material = materials.find(
        (m) => m.material_id?.toString() === materialId?.toString()
      );
      const materialName = material?.material_name || "";
      return materialName.toLowerCase().includes("pvc");
    })();

    if (!colorId || !priceColorBy || !pricePerMeter || (isPvcMaterial && !typeItem)) {
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
      price_color_By: priceColorBy === "blanck" ? "isByBlanck" : priceColorBy,
      price_per_meter: parseFloat(pricePerMeter),
      notes: actualData.notes || "",
    };
    if (isPvcMaterial) {
      dataToSend.type_item = typeItem;
    }

    // Special handling for "blanck" (Board) if the backend expects different structure
    // (Assuming standard payload based on previous context, but ensuring clean values)

    await handleSave(dataToSend);

    // Keep dialog open but clear only editable fields
    if (modalState.mode === "create") {
      setFormData((prev) => ({
        material_id: prev.material_id,
        ruler_id: prev.ruler_id,
        color_id: "",
        type_item: "Machine",
        price_color_By: prev.price_color_By,
        price_per_meter: "",
        notes: "",
      }));
    }
  };

  // Lists for filters
  const sortedColors = useMemo(() => {
    return [...colors].sort((a, b) => (a.color_name || "").localeCompare(b.color_name || "", "ar"));
  }, [colors]);

  const sortedRulers = useMemo(() => {
    return [...rulers].sort((a, b) => (a.ruler_name || "").localeCompare(b.ruler_name || "", "ar"));
  }, [rulers]);

  // Initialize filteredRulers when rulers data is loaded
  useEffect(() => {
    setFilteredRulers(sortedRulers);
  }, [sortedRulers]);

  const uniqueSortedMaterials = useMemo(() => {
    const list = materials.map(m => m.material_name).filter(Boolean);
    return [...new Set(list)].sort((a, b) => a.localeCompare(b, "ar"));
  }, [materials]);
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
      const colorName = priceColorApi.getColorName(priceColor);
      const rulerName = priceColorApi.getRulerName(priceColor);
      const materialName = priceColorApi.getMaterialName(priceColor);

      const pricingLabel = getLabel(dynamicPricingOptions, priceColor.price_color_By);
      const typeLabel = getLabel(typeItemOptions, priceColor.type_item);

      const matchesSearch =
        colorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        priceColorApi.getColorCode(priceColor)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rulerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        typeLabel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pricingLabel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        priceColor.price_per_meter?.toString().includes(searchTerm.toLowerCase()) ||
        priceColor.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesColor = selectedColorId === "" || priceColor.color_id?.toString() === selectedColorId;
      const matchesRuler = selectedRulerId === "" || (priceColor.color?.ruler_id || priceColor.color?.ruler?.ruler_id)?.toString() === selectedRulerId;
      const matchesMaterial = selectedMaterialName === "" || materialName === selectedMaterialName;

      return matchesSearch && matchesColor && matchesRuler && matchesMaterial;
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
  }, [searchTerm, selectedColorId, selectedRulerId, selectedMaterialName]);

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
      unit: "$",
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
          onAction={handleOpenCreate}
        />

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {mainStats.map((stat) => (
            <StatsCard key={stat.id} {...stat} />
          ))}
        </div> */}

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
              placeholder="ابحث عن سعر (اللون، المسطرة، المادة، النوع)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters and Results */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FilterSelect
              label="المادة"
              value={selectedMaterialName}
              onChange={(e) => handleMaterialFilterChange(e.target.value)}
              options={[
                { value: "", label: "جميع المواد" },
                ...uniqueSortedMaterials.map(name => ({ value: name, label: name }))
              ]}
            />

            <FilterSelect
              label="المسطرة"
              value={selectedRulerId}
              onChange={(e) => setSelectedRulerId(e.target.value)}
              disabled={!selectedMaterialName}
              options={[
                { value: "", label: selectedMaterialName ? "جميع المساطر" : "اختر المادة أولاً" },
                ...filteredRulers.map(r => ({ value: r.ruler_id.toString(), label: r.ruler_name }))
              ]}
            />

            <FilterSelect
              label="اللون"
              value={selectedColorId}
              onChange={(e) => setSelectedColorId(e.target.value)}
              showSelectedImage={true}
              options={[
                { value: "", label: "جميع الألوان" },
                ...sortedColors.map(c => ({
                  value: c.color_id.toString(),
                  label: c.color_name,
                  imageUrl: resolveColorImage(c),
                }))
              ]}
            />

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
                      <TableHead>المسطرة</TableHead>
                      <TableHead>المادة</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>طريقة التسعير</TableHead>
                      <TableHead sortable sortKey="price_per_meter">
                        السعر بالمتر/قطعة {showUsdPrice && "($)"}
                      </TableHead>
                      <TableHead>الملاحظات</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPriceColors.map((priceColor) => (
                      <TableRow key={priceColor.price_color_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {resolveColorImage(priceColor?.color) && (
                              <img
                                src={resolveColorImage(priceColor?.color)}
                                alt=""
                                className="h-7 w-7 rounded-full border border-gray-200 object-cover"
                              />
                            )}
                            <div>
                              <div>{priceColorApi.getColorName(priceColor)}</div>
                              <div className="text-xs text-gray-500">{priceColorApi.getColorCode(priceColor)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {priceColorApi.getRulerName(priceColor)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {priceColorApi.getMaterialName(priceColor)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50">
                            {getLabel(typeItemOptions, priceColor.type_item)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{getLabel(dynamicPricingOptions, priceColor.price_color_By)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-800 font-bold">
                            {priceColorApi.formatPriceDisplay(priceColor, showUsdPrice)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {priceColor.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CrudActions
                              onView={() => openViewModal(priceColor.price_color_id)}
                              onEdit={() => handleOpenEdit(priceColor)}
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
              {
                key: "color_name",
                label: "اللون",
                formatValue: () => {
                  const color = selectedItem?.color;
                  const imageUrl = resolveColorImage(color);
                  const name = priceColorApi.getColorName(selectedItem);
                  const code = priceColorApi.getColorCode(selectedItem);
                  return (
                    <div className="flex items-center gap-2">
                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt=""
                          className="h-7 w-7 rounded-full border border-gray-200 object-cover"
                        />
                      )}
                      <span>{`${name} (${code})`}</span>
                    </div>
                  );
                }
              },
              { key: "ruler_name", label: "المسطرة", formatValue: () => priceColorApi.getRulerName(selectedItem) },
              { key: "material_name", label: "المادة", formatValue: () => priceColorApi.getMaterialName(selectedItem) },
              ...(priceColorApi.getMaterialName(selectedItem || {}).toLowerCase().includes("pvc")
                ? [{ key: "type_item", label: "النوع", formatValue: (key, value) => getLabel(typeItemOptions, value) }]
                : []),
              { key: "price_color_By", label: "طريقة التسعير", formatValue: (key, value) => getLabel(dynamicPricingOptions, value) },
              { key: "price_per_meter", label: `السعر بالمتر/قطعة ${showUsdPrice ? "($)" : ""}`, formatValue: (key, value) => showUsdPrice ? `${value} $` : value },
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المادة <span className="text-red-500">*</span></Label>
                <FilterSelect
                  value={formData.material_id?.toString() || ""}
                  onChange={(e) => handleMaterialChange(e.target.value)}
                  options={materials.map((m) => ({
                    value: m.material_id.toString(),
                    label: m.material_name,
                  }))}
                  placeholder="اختر المادة"
                />
              </div>

              <div className="space-y-2">
                <Label>المسطرة <span className="text-red-500">*</span></Label>
                <FilterSelect
                  value={formData.ruler_id?.toString() || ""}
                  onChange={(e) => setFormData({ ...formData, ruler_id: e.target.value, color_id: "" })}
                  disabled={!formData.material_id}
                  options={rulers.map((r) => ({ value: r.ruler_id.toString(), label: r.ruler_name }))}
                  placeholder={!formData.material_id ? "اختر المادة أولاً" : "اختر المسطرة"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>اللون <span className="text-red-500">*</span></Label>
              <FilterSelect
                value={formData.color_id?.toString() || ""}
                onChange={(e) => setFormData({ ...formData, color_id: e.target.value })}
                disabled={!formData.ruler_id}
                showSelectedImage={true}
                options={colors
                  .filter((c) => c.ruler_id?.toString() === formData.ruler_id?.toString())
                  .map((color) => ({
                    value: color.color_id.toString(),
                    label: `${color.color_name} (${color.color_code})`,
                    imageUrl: resolveColorImage(color),
                  }))}
                placeholder={!formData.ruler_id ? "اختر المسطرة أولاً" : "اختر اللون"}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isSelectedMaterialPvc && (
                <div className="space-y-2">
                  <Label>النوع <span className="text-red-500">*</span></Label>
                  <FilterSelect
                    value={formData.type_item || ""}
                    onChange={(e) => setFormData({ ...formData, type_item: e.target.value })}
                    options={typeItemOptions}
                    placeholder="اختر النوع"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>طريقة التسعير <span className="text-red-500">*</span></Label>
                <FilterSelect
                  value={formData.price_color_By || ""}
                  onChange={(e) => setFormData({ ...formData, price_color_By: e.target.value })}
                  options={dynamicPricingOptions}
                  placeholder="اختر الطريقة"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                السعر بالمتر/قطعة {showUsdPrice && "($)"} <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                value={formData.price_per_meter || ""}
                onChange={(e) => setFormData({ ...formData, price_per_meter: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>الملاحظات</Label>
              <Textarea
                value={formData.notes || ""}
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
