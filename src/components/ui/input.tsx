import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        data-slot="input"
        className={cn(
          "flex h-11 w-full rounded-md border border-(--color-border) bg-(--color-background) px-3 py-2 text-base text-(--color-text-primary) transition-colors duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-(--color-text-muted) focus-visible:border-(--color-accent) focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
