// src\components\ui\input.jsx
import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-gray-400 selection:bg-primary selection:text-white flex h-10 w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-primary focus:shadow-md focus:ring-2 focus:ring-primary/20 md:text-sm hover:border-gray-400",
        "aria-invalid:border-red-500 aria-invalid:ring-red-200 dark:aria-invalid:ring-red-400",
        className
      )}
      {...props} />
  );
}

export { Input }
