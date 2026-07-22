import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  glass = false,
  accent = false,
  ...props
}: React.ComponentProps<"div"> & { 
  size?: "default" | "sm", 
  glass?: boolean,
  accent?: boolean
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden text-card-foreground [--card-spacing:--spacing(8)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(6)]",
        "rounded-2xl",
        "bg-card dark:bg-card",
        "shadow-[0_4px_12px_-1px_rgba(0,0,0,0.25),-4px_0_12px_-1px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_12px_-1px_rgba(0,0,0,0.6),-4px_0_12px_-1px_rgba(0,0,0,0.4)]",
        "outline-none ring-0 [clip-path:inset(0_0_-20px_-20px_round_2rem)]",
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
