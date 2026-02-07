// src\components\ui\textarea.jsx
import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({
  className,
  ...props
}) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-gray-400 focus:border-primary focus:ring-primary/20 flex min-h-20 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:shadow-md focus:ring-2 md:text-sm hover:border-gray-400",
        "aria-invalid:border-red-500 aria-invalid:ring-red-200 dark:aria-invalid:ring-red-400",
        className
      )}
      {...props} />
  );
}

export { Textarea }
