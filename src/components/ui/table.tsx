"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cn } from "cn"
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion"

// A restrained entrance for table rows — plays once per row on mount (a fresh page load,
// or a brand-new row appearing), not on every re-render, since variants only replay when
// a component actually (re)mounts. MotionConfig's reducedMotion="user" only covers layout
// animations (e.g. the sidebar's active-pill), not plain variant tweens like these, so
// prefers-reduced-motion is checked directly here instead — the reveal collapses to an
// instant, un-offset appearance rather than merely a shorter version of itself.
const tbodyVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035, delayChildren: 0.03 } },
}
const tbodyVariantsReduced = { hidden: {}, show: {} }
const trVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.2, 0.7, 0.1, 1] as const } },
}
const trVariantsReduced = { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: Omit<React.ComponentProps<"tbody">, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart">) {
  const reduceMotion = useSafeReducedMotion()
  return (
    <motion.tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      variants={reduceMotion ? tbodyVariantsReduced : tbodyVariants}
      initial="hidden"
      animate="show"
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: Omit<React.ComponentProps<"tr">, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart">) {
  const reduceMotion = useSafeReducedMotion()
  return (
    <motion.tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      variants={reduceMotion ? trVariantsReduced : trVariants}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
