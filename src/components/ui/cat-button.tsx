"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

const catButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-4 focus-visible:ring-primary/30 active:translate-y-px disabled:pointer-events-none disabled:opacity-60 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary:
          "bg-primary-light text-secondary-foreground hover:bg-primary-light/80",
        ghost: "bg-transparent text-foreground hover:bg-muted",
        outline:
          "border-2 border-border bg-card text-foreground hover:bg-muted",
      },
      size: {
        lg: "h-14 px-7 text-base",
        md: "h-12 px-6 text-sm",
        sm: "h-10 px-4 text-sm",
        icon: "size-12",
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
        {loading && <Spinner className="size-4" />}
        {children}
      </button>
    );
  },
);
