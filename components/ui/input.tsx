import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-[#3a3a3a] bg-[#1d1d1d] px-3 py-1 text-sm text-[#e8f0ff] shadow-xs transition-[color,border-color] outline-none placeholder:text-[#6f7d9b] focus-visible:border-[#4fd2ff] focus-visible:ring-2 focus-visible:ring-[#4fd2ff33]",
        className
      )}
      {...props}
    />
  );
}

export { Input };
