import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-[#2a2a2a] text-[#dce8ff] hover:bg-[#333333] focus-visible:ring-[#5dd1ff]",
        accent: "bg-[#53eab3] text-[#072515] hover:bg-[#68f2c0] focus-visible:ring-[#8efad2]",
        outline: "border border-[#3a3a3a] bg-[#1e1e1e] text-[#dce8ff] hover:bg-[#292929] focus-visible:ring-[#5dd1ff]",
        ghost: "text-[#a9b8d8] hover:bg-[#292929] hover:text-[#dce8ff] focus-visible:ring-[#5dd1ff]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3",
        lg: "h-10 rounded-md px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
