// src/components/common/StandardTableColumns.jsx
export const STANDARD_COLUMNS = {
  // Base column order for all tables
  BASE_ORDER: [
    { key: "id", header: "الرقم", width: "w-12" },
    { key: "material_name", header: "المادة", width: "w-20" },
    { key: "color_name", header: "اللون", width: "w-20" },
    { key: "width", header: "العرض", width: "w-16" },
    { key: "quantity", header: "الكمية", width: "w-16" },
    { key: "type_item", header: "النوع", width: "w-16" },
    { key: "batch_number", header: "الطبخة", width: "w-20" },
    { key: "thickness", header: "السماكة", width: "w-16" },
    { key: "destination", header: "الوجهة", width: "w-20" },
    { key: "source", header: "المصدر", width: "w-20" },
    { key: "status", header: "الحالة", width: "w-20" },
    { key: "user", header: "المستخدم", width: "w-20" },
    { key: "timing", header: "التوقيت", width: "w-24" },
    { key: "notes", header: "الملاحظات", width: "w-32" },
    { key: "actions", header: "الإجراءات", width: "w-24" }
  ],

  // Order items table columns
  ORDER_ITEMS: [
    { key: "id", header: "الرقم", width: "w-12" },
    { key: "material_name", header: "المادة", width: "w-20" },
    { key: "color_name", header: "اللون", width: "w-20" },
    { key: "width", header: "العرض", width: "w-16" },
    { key: "quantity", header: "الكمية", width: "w-16" },
    { key: "type_item", header: "النوع", width: "w-16" },
    { key: "batch_number", header: "الطبخة", width: "w-20" },
    { key: "thickness", header: "السماكة", width: "w-16" },
    { key: "ruler_name", header: "المسطرة", width: "w-24" },
    { key: "actions", header: "الإجراءات", width: "w-24" }
  ],

  // Production requests table columns
  PRODUCTION_REQUESTS: [
    { key: "id", header: "الرقم", width: "w-12" },
    { key: "material_name", header: "المادة", width: "w-20" },
    { key: "color_name", header: "اللون", width: "w-20" },
    { key: "width", header: "العرض", width: "w-16" },
    { key: "quantity", header: "الكمية", width: "w-16" },
    { key: "type_item", header: "النوع", width: "w-16" },
    { key: "batch_number", header: "الطبخة", width: "w-20" },
    { key: "thickness", header: "السماكة", width: "w-16" },
    { key: "status", header: "الحالة", width: "w-20" },
    { key: "user", header: "المستخدم", width: "w-20" },
    { key: "timing", header: "التوقيت", width: "w-24" },
    { key: "notes", header: "الملاحظات", width: "w-32" },
    { key: "actions", header: "الإجراءات", width: "w-24" }
  ]
};

export const getTableColumns = (type) => {
  return STANDARD_COLUMNS[type] || STANDARD_COLUMNS.BASE_ORDER;
};

export const renderTableHeader = (columns) => {
  return (
    <thead className="bg-gray-100 sticky top-0 z-10">
      <tr>
        {columns.map((column) => (
          <th key={column.key} className={`p-2 text-right border-b ${column.width}`}>
            {column.header}
          </th>
        ))}
      </tr>
    </thead>
  );
};
