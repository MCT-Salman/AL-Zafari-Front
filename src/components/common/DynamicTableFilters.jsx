import PropTypes from "prop-types";
import { Search, RotateCcw } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import FilterSelect from "./FilterSelect";
import { cn } from "@/lib/utils";

const DEFAULT_FILTERS = {
  search: "",
  status: "",
  userId: "",
  dateFrom: "",
  dateTo: "",
  materialId: "",
};

const DEFAULT_TEXTS = {
  searchPlaceholder: "بحث عام في الجدول...",
  statusLabel: "الحالة",
  userLabel: "المستخدم",
  dateFromLabel: "من تاريخ",
  dateToLabel: "إلى تاريخ",
  materialLabel: "المادة",
  resetLabel: "مسح الفلاتر",
  allStatusesLabel: "كل الحالات",
  allUsersLabel: "كل المستخدمين",
  allMaterialsLabel: "كل المواد",
  resultsLabel: "النتائج",
  resultsFromLabel: "من أصل",
};

function DynamicTableFilters({
  value = DEFAULT_FILTERS,
  onChange,
  onReset,
  className,
  fields,
  statusOptions = [],
  userOptions = [],
  materialOptions = [],
  texts,
  customFields = [],
  actions,
  resettable = true,
  disabled = false,
  resultsCount,
  totalCount,
  showResults = true,
}) {
  const mergedTexts = { ...DEFAULT_TEXTS, ...texts };
  const mergedFields = {
    search: true,
    status: true,
    user: true,
    dateRange: true,
    material: true,
    ...fields,
  };

  const filters = {
    ...DEFAULT_FILTERS,
    ...value,
  };

  const emitChange = (key, nextValue) => {
    if (typeof onChange !== "function") return;
    onChange({
      ...filters,
      [key]: nextValue,
    });
  };

  const handleReset = () => {
    if (typeof onReset === "function") {
      onReset();
      return;
    }

    if (typeof onChange === "function") {
      onChange({ ...DEFAULT_FILTERS });
    }
  };

  return (
    <div className={cn("table-filters-panel p-3", className)}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {mergedFields.search && (
          <div className="xl:col-span-1">
            <div className="relative">
              <Search className="table-filters-search-icon pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                type="text"
                value={filters.search}
                onChange={(event) => emitChange("search", event.target.value)}
                placeholder={mergedTexts.searchPlaceholder}
                disabled={disabled}
                className="pr-10"
              />
            </div>
          </div>
        )}

        {mergedFields.status && (
          <FilterSelect
            label={mergedTexts.statusLabel}
            value={filters.status}
            onChange={(event) => emitChange("status", event.target.value)}
            options={[
              { value: "", label: mergedTexts.allStatusesLabel },
              ...statusOptions,
            ]}
            disabled={disabled}
            placeholder={mergedTexts.allStatusesLabel}
          />
        )}

        {mergedFields.user && (
          <FilterSelect
            label={mergedTexts.userLabel}
            value={filters.userId}
            onChange={(event) => emitChange("userId", event.target.value)}
            options={[
              { value: "", label: mergedTexts.allUsersLabel },
              ...userOptions,
            ]}
            disabled={disabled}
            placeholder={mergedTexts.allUsersLabel}
          />
        )}

        {mergedFields.material && (
          <FilterSelect
            label={mergedTexts.materialLabel}
            value={filters.materialId}
            onChange={(event) => emitChange("materialId", event.target.value)}
            options={[
              { value: "", label: mergedTexts.allMaterialsLabel },
              ...materialOptions,
            ]}
            disabled={disabled}
            placeholder={mergedTexts.allMaterialsLabel}
          />
        )}

        {mergedFields.dateRange && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:col-span-2">
            <div>
              <label className="table-filters-label mb-2 block tracking-wide">
                {mergedTexts.dateFromLabel}
              </label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(event) => emitChange("dateFrom", event.target.value)}
                disabled={disabled}
              />
            </div>

            <div>
              <label className="table-filters-label mb-2 block tracking-wide">
                {mergedTexts.dateToLabel}
              </label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(event) => emitChange("dateTo", event.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
        )}

        {customFields.map((field) => (
          <div key={field.key} className={cn("min-w-0", field.className)}>
            {field.render({
              value: filters[field.key],
              filters,
              onChange: (nextValue) => emitChange(field.key, nextValue),
              disabled,
            })}
          </div>
        ))}
      </div>

      {showResults && typeof resultsCount === "number" && (
        <div className="table-filters-results mt-3 flex items-center justify-end">
          <span className="table-filters-results-badge">
            {mergedTexts.resultsLabel}: {resultsCount}
            {typeof totalCount === "number" ? ` ${mergedTexts.resultsFromLabel} ${totalCount}` : ""}
          </span>
        </div>
      )}

      {(resettable || actions) && (
        <div className="table-filters-divider mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          {resettable ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={disabled}
              className="table-filters-reset min-w-[140px]"
            >
              <RotateCcw className="h-4 w-4" />
              {mergedTexts.resetLabel}
            </Button>
          ) : (
            <span />
          )}

          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      )}
    </div>
  );
}

DynamicTableFilters.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func,
  onReset: PropTypes.func,
  className: PropTypes.string,
  fields: PropTypes.shape({
    search: PropTypes.bool,
    status: PropTypes.bool,
    user: PropTypes.bool,
    dateRange: PropTypes.bool,
    material: PropTypes.bool,
  }),
  statusOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
    })
  ),
  userOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
    })
  ),
  materialOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
    })
  ),
  texts: PropTypes.object,
  customFields: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      className: PropTypes.string,
      render: PropTypes.func.isRequired,
    })
  ),
  actions: PropTypes.node,
  resettable: PropTypes.bool,
  disabled: PropTypes.bool,
  resultsCount: PropTypes.number,
  totalCount: PropTypes.number,
  showResults: PropTypes.bool,
};

DynamicTableFilters.defaultProps = {
  value: DEFAULT_FILTERS,
  onChange: undefined,
  onReset: undefined,
  className: "",
  fields: undefined,
  statusOptions: [],
  userOptions: [],
  materialOptions: [],
  texts: undefined,
  customFields: [],
  actions: null,
  resettable: true,
  disabled: false,
  resultsCount: undefined,
  totalCount: undefined,
  showResults: true,
};

export { DEFAULT_FILTERS as dynamicTableFiltersDefaults };
export default DynamicTableFilters;
