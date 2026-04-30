import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60",
  {
    variants: {
      variant: {
        default:
          "border-white/10 bg-slate-900/90 text-slate-50 shadow-[0_20px_60px_rgba(2,8,23,0.28)] hover:bg-slate-800/90",
        primary:
          "border-cyan-300/40 bg-gradient-to-br from-cyan-400/20 to-emerald-300/15 text-cyan-50 hover:from-cyan-300/25 hover:to-emerald-200/20",
        ghost: "border-transparent bg-transparent text-slate-200 hover:bg-white/5",
        outline: "border-white/15 bg-slate-950/40 text-slate-100 hover:bg-slate-900/70"
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 px-5 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
