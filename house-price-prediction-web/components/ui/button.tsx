import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: "default" | "outline";
};

function Button({ className, type = "button", variant = "default", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      data-slot="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap border px-3 py-2 text-sm font-medium transition-[color,box-shadow,background-color,border-color] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        variant === "default" && "border-[#ed2021] bg-[#ed2021] text-white",
        variant === "outline" && "border-input bg-transparent text-foreground",
        "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        className,
      )}
      {...props}
    />
  );
}

export { Button };
