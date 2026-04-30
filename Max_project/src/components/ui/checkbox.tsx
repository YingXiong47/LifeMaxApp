import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer h-6 w-6 shrink-0 rounded-[0.9rem] border border-white/15 bg-slate-950/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ring-offset-slate-950 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 data-[state=checked]:border-cyan-300/55 data-[state=checked]:bg-cyan-400/24 data-[state=checked]:shadow-[0_0_0_6px_rgba(87,216,255,0.12)]",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-cyan-100">
        <Check className="h-[18px] w-[18px]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  ));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
