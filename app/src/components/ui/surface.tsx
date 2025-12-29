import * as React from "react"

import { cn } from "@/lib/utils"

type SurfaceProps = React.ComponentProps<"div"> & {
  innerClassName?: string
}

function Surface({
  className,
  innerClassName,
  children,
  ...props
}: SurfaceProps) {
  return (
    <div data-slot="surface" className={cn("relative", className)} {...props}>
      <div
        data-slot="surface-inner"
        className={cn("rounded-xl", innerClassName)}
      >
        {children}
      </div>
    </div>
  )
}

export { Surface }
