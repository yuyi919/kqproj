import { forwardRefIfNeeded } from "@stackframe/stack-shared/dist/utils/react";
import { Loader2Icon } from "lucide-react";
import React from "react";
import { cn } from "../../lib/utils";

export const Spinner = forwardRefIfNeeded<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span"> & {
    size?: number;
  }
>(({ size = 15, ...props }, ref) => {
  return (
    <span ref={ref} {...props} className={cn("stack-scope", props.className)}>
      <Loader2Icon className="animate-spin" width={size} height={size} />
    </span>
  );
});
Spinner.displayName = "Spinner";
