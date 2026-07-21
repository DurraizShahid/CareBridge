import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  hoverable = false,
  glass = false,
  accent = false,
  ...props
}: React.ComponentProps<"div"> & { 
  size?: "default" | "sm", 
  hoverable?: boolean,
  glass?: boolean,
  accent?: boolean
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden text-card-foreground [--card-spacing:--spacing(8)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(6)]",
        "rounded-3xl",
        "ring-1 ring-foreground/5 dark:ring-white/5",
        "bg-gradient-to-b from-card to-card/90 dark:from-card dark:to-card/85",
        "shadow-[0_1px_1px_rgba(0,0,0,0.02),0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_1px_rgba(0,0,0,0.3),0_4px_30px_rgba(0,0,0,0.4)]",
        "transition-all duration-300 ease-out",
        hoverable && "hover:-translate-y-1.5 hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_40px_rgba(0,0,0,0.5)] hover:ring-foreground/10 dark:hover:ring-white/10",
        glass && "glass-card",
        accent && "accent-gradient-card text-primary-foreground shadow-[0_10px_40px_rgba(88,140,126,0.3)] dark:shadow-[0_10px_40px_rgba(98,165,148,0.4)]",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-3 px-(--card-spacing) pt-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing) border-border/30",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-heading text-xl font-bold tracking-tight", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-base text-muted-foreground leading-relaxed", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing) flex-1", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-3 px-(--card-spacing) pb-(--card-spacing) [.border-t]:pt-(--card-spacing) border-border/30",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
