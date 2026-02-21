import * as React from "react";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("text-xs font-semibold tracking-wide text-[#a6b5d4]", className)}
      {...props}
    />
  );
}

export { Label };
