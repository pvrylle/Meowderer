"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const catButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white shadow-sm hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "text-foreground hover:bg-muted",
        outline: "border border-border bg-card text-foreground hover:bg-muted",
        soft: "bg-primary/10 text-primary hover:bg-primary/15",
      },
      size: {
        lg: "h-12 px-6 text-[15px] rounded-xl",
        md: "h-11 px-5 text-sm rounded-xl",
        sm: "h-9 px-4 text-sm rounded-lg",
        xs: "h-8 px-3 text-xs rounded-lg",
        icon: "size-10 rounded-xl",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg",
      block: false,
    },
  },
);

export interface CatButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof catButtonVariants> {
  loading?: boolean;
}

export const CatButton = React.forwardRef<HTMLButtonElement, CatButtonProps>(
  function CatButton(
    { className, variant, size, block, loading, disabled, children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(catButtonVariants({ variant, size, block, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="size-4 animate-spin rounded-full border-2 border-current/25 border-t-current" />
        )}
        {children}
      </button>
    );
  },
);
