import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

const toStringValue = (value) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const buildEventLike = (value) => ({
  target: { value },
  currentTarget: { value },
});

const FilterSelect = ({
  label = "",
  value = "",
  onChange = () => {},
  onValueChange,
  searchValue,
  onSearchValueChange,
  onInputFocus,
  options = [],
  className = "",
  disabled = false,
  placeholder = "ابحث أو اختر...",
}) => {
  const selectId = useId();
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [internalSearchTerm, setInternalSearchTerm] = useState("");

  const normalizedValue = toStringValue(value);

  const selectedOption = useMemo(
    () => options.find((option) => toStringValue(option?.value) === normalizedValue),
    [options, normalizedValue]
  );

  const effectiveSearchTerm = typeof searchValue === "string" ? searchValue : internalSearchTerm;

  const filteredOptions = useMemo(() => {
    const query = effectiveSearchTerm.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => {
      const labelText = String(option?.label ?? "").toLowerCase();
      const valueText = String(option?.value ?? "").toLowerCase();
      return labelText.includes(query) || valueText.includes(query);
    });
  }, [effectiveSearchTerm, options]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
        if (typeof onSearchValueChange === "function") onSearchValueChange("");
        setInternalSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (optionValue) => {
    const nextValue = toStringValue(optionValue);
    if (typeof onValueChange === "function") {
      onValueChange(nextValue);
    }
    onChange(buildEventLike(nextValue));
    setIsOpen(false);
    if (typeof onSearchValueChange === "function") onSearchValueChange("");
    setInternalSearchTerm("");
  };

  const handleInputFocus = () => {
    if (disabled) return;
    setIsOpen(true);
    if (typeof onInputFocus === "function") onInputFocus();
  };

  const handleInputChange = (event) => {
    const next = event.target.value;
    if (typeof onSearchValueChange === "function") onSearchValueChange(next);
    setInternalSearchTerm(next);
    if (!isOpen) setIsOpen(true);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      if (typeof onSearchValueChange === "function") onSearchValueChange("");
      setInternalSearchTerm("");
      inputRef.current?.blur();
      return;
    }

    if (event.key === "Enter" && filteredOptions.length > 0) {
      event.preventDefault();
      handleSelect(filteredOptions[0]?.value);
    }
  };

  const inputText = isOpen
    ? effectiveSearchTerm
    : String(selectedOption?.label ?? (normalizedValue ? normalizedValue : ""));

  return (
    <div ref={wrapperRef} className={`group relative w-full ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-2 block text-xs font-semibold tracking-wide text-secondary-t transition-colors group-focus-within:text-primary-f"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-secondary-fo" />
        <input
          id={selectId}
          ref={inputRef}
          type="text"
          value={inputText}
          onFocus={handleInputFocus}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="h-[52px] w-full rounded-md border border-primary-f bg-primary-s py-2 pl-10 pr-10 text-right text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => {
            if (disabled) return;
            setIsOpen((prev) => !prev);
            inputRef.current?.focus();
          }}
          disabled={disabled}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-secondary-fo transition-transform duration-200 disabled:cursor-not-allowed"
          aria-label="تبديل القائمة"
        >
          <ChevronDown className={`h-4 w-4 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-secondary-f/30 bg-primary-s p-1 shadow-md">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => {
              const optionValue = toStringValue(option?.value);
              const optionLabel = String(option?.label ?? optionValue);
              const optionDisabled = Boolean(option?.disabled);
              const isSelected = optionValue === normalizedValue;

              return (
                <button
                  key={`${optionValue}-${index}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  disabled={optionDisabled}
                  onClick={() => handleSelect(optionValue)}
                  className={`flex w-full items-center justify-start rounded-sm px-3 py-2 text-right text-sm transition-colors hover:bg-secondary-f hover:text-primary-s disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected ? "bg-secondary-f/20 font-semibold" : ""
                  }`}
                >
                  {optionLabel}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-right text-sm text-secondary-fo">
              لا توجد نتائج
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterSelect;
