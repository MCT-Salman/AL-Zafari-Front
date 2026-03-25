import { Printer } from "lucide-react";

import { getQrUrl, printQr } from "./qrPrint";

export default function QrPrintButton({
  data,
  title,
  footer = "",
  className = "",
  iconClassName = "h-4 w-4"
}) {
  return (
    <button
      type="button"
      onClick={() => printQr(getQrUrl(data), title, footer)}
      className={`rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-50 ${className}`.trim()}
      title="طباعة QR"
    >
      <Printer className={iconClassName} />
    </button>
  );
}
