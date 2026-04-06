import { useEffect, useMemo, useState } from "react";
import { colorApi } from "../../api/colorApi";
import { rulerApi } from "../../api/rulerApi";
import { materialApi } from "../../api/materialApi";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import SearchInput from "../../components/common/SearchInput";
import FilterSelect from "../../components/common/FilterSelect";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import ResultsCounter from "../../components/common/ResultsCounter";
import RowsPerPageSelector from "../../components/common/RowsPerPageSelector";
import PaginationControls from "../../components/common/PaginationControls";
import { getApiData } from "../../utils/api";
import { Download } from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");
const resolveColorImage = (color) => {
  if (!color) return null;
  const raw = color.imageUrl || color.image_url || color.color_image || null;
  if (!raw) return null;
  return raw.startsWith("http") ? raw : `${API_BASE_URL}${raw}`;
};

export default function ColorsReadOnly() {
  const [loading, setLoading] = useState(false);
  const [colors, setColors] = useState([]);
  const [rulers, setRulers] = useState([]);
  const [materials, setMaterials] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [selectedRulerId, setSelectedRulerId] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [cRes, rRes, mRes] = await Promise.all([
          colorApi.getColors(),
          rulerApi.getRulers(),
          materialApi.getMaterials(),
        ]);
        setColors(getApiData(cRes, []) || []);
        setRulers(getApiData(rRes, []) || []);
        setMaterials(getApiData(mRes, []) || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredRulers = useMemo(() => {
    if (!selectedMaterialId) return rulers;
    return rulers.filter((r) => String(r.material_id) === String(selectedMaterialId));
  }, [rulers, selectedMaterialId]);

  const getMaterialIdFromColor = (color) => {
    const direct =
      color?.material_id ||
      color?.ruler?.material_id ||
      color?.ruler?.material?.material_id ||
      color?.material?.material_id;
    if (direct) return String(direct);
    const rulerId = color?.ruler_id || color?.ruler?.ruler_id;
    if (rulerId) {
      const r = rulers.find((rr) => String(rr.ruler_id) === String(rulerId));
      const mid = r?.material_id || r?.material?.material_id;
      if (mid) return String(mid);
    }
    return "";
  };

  const filteredColors = useMemo(() => {
    const term = String(searchTerm || "").toLowerCase().trim();
    return (colors || []).filter((c) => {
      const rulerId = String(c.ruler_id || c.ruler?.ruler_id || "");
      const materialId = getMaterialIdFromColor(c);
      const matchesMaterial = !selectedMaterialId || materialId === String(selectedMaterialId);
      const matchesRuler = !selectedRulerId || rulerId === String(selectedRulerId);
      const matchesSearch =
        !term ||
        String(c.color_name || "").toLowerCase().includes(term) ||
        String(c.color_code || "").toLowerCase().includes(term) ||
        String(c.notes || "").toLowerCase().includes(term) ||
        String(rulers.find(r => String(r.ruler_id) === rulerId)?.ruler_name || "").toLowerCase().includes(term) ||
        String(materials.find(m => String(m.material_id) === materialId)?.material_name || "").toLowerCase().includes(term);
      return matchesMaterial && matchesRuler && matchesSearch;
    });
  }, [colors, searchTerm, selectedMaterialId, selectedRulerId, rulers, materials]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMaterialId, selectedRulerId]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredColors.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedColors = filteredColors.slice(startIndex, endIndex);

  return (
    <Card className="p-4 h-full min-h-0 flex flex-col">
      {/* <div className="flex items-center justify-between gap-2 mb-3">
        <div className="font-bold text-lg">الشركات المكافئة</div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => window.print()}
        >
          <Download className="w-4 h-4" />
          طباعة
        </Button>
      </div> */}

      <div className="space-y-3">
        <SearchInput
          placeholder="ابحث ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <FilterSelect
            label="المادة"
            value={selectedMaterialId}
            onChange={(e) => {
              setSelectedMaterialId(e.target.value);
              setSelectedRulerId("");
            }}
            options={[
              { value: "", label: "كل المواد" },
              ...materials
                .slice()
                .sort((a, b) => (a.material_name || "").localeCompare((b.material_name || ""), "ar"))
                .map((m) => ({ value: String(m.material_id), label: m.material_name })),
            ]}
          />
          <FilterSelect
            label="المسطرة"
            value={selectedRulerId}
            onChange={(e) => setSelectedRulerId(e.target.value)}
            disabled={!selectedMaterialId}
            placeholder={!selectedMaterialId ? "اختر المادة أولاً" : "اختر المسطرة"}
            options={[
              { value: "", label: "كل المساطر" },
              ...filteredRulers.map((r) => ({ value: String(r.ruler_id), label: r.ruler_name })),
            ]}
          />
          <ResultsCounter current={paginatedColors.length} total={filteredColors.length} />
          <RowsPerPageSelector
            value={rowsPerPage}
            onChange={setRowsPerPage}
            options={[5, 10, 20, 50]}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 mt-3 overflow-y-auto overflow-x-auto rounded bg-white max-h-[50vh] min-[1366px]:min-h-[40vh]">
        {loading ? (
          <div className="p-6">
            <LoadingState message="جاري تحميل الألوان..." />
          </div>
        ) : paginatedColors.length === 0 ? (
          <div className="p-6">
            <EmptyState message="لا توجد ألوان" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow >
                  <TableHead>اللون</TableHead>
                  <TableHead>الكود</TableHead>
                  <TableHead>المسطرة</TableHead>
                  <TableHead>المادة</TableHead>
                  <TableHead>ملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedColors.map((c) => {
                  const rulerId = c.ruler_id || c.ruler?.ruler_id;
                  const ruler = rulers.find((r) => String(r.ruler_id) === String(rulerId));
                  const material = materials.find((m) => String(m.material_id) === String(getMaterialIdFromColor(c)));
                  return (
                    <TableRow key={c.color_id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {resolveColorImage(c) && (
                            <img
                              src={resolveColorImage(c)}
                              alt=""
                              className="h-7 w-7 rounded-full border border-gray-200 object-cover"
                            />
                          )}
                          <span>{c.color_name || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{c.color_code || "-"}</TableCell>
                      <TableCell>{ruler?.ruler_name || c.ruler_name || "-"}</TableCell>
                      <TableCell>{material?.material_name || c.material_name || "-"}</TableCell>
                      <TableCell>{c.notes || "-"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

          </>
        )}
      </div>
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevious={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        onNext={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
        onPageChange={setCurrentPage}
      />
    </Card>
  );
}

