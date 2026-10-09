import Image from "next/image";
import { cn } from "@/lib/utils";

/** Outlined vector identity from the approved Care Weave wide-leaf brand kit. */
export function BrandLogo({ tone = "navy", className, priority = false }: {
  tone?: "navy" | "white" | "gradient";
  className?: string;
  priority?: boolean;
}) {
  const src = tone === "gradient" ? "/brand/carebridge-primary-logo.svg" : "/brand/carebridge-logo-" + tone + ".svg";
  return <Image src={src} alt="CareBridge Health" width={510} height={190}
    className={cn("h-auto w-[180px] object-contain", className)} priority={priority} />;
}
export function BrandMark({ tone = "navy", className }: {
  tone?: "navy" | "white" | "blue" | "gradient";
  className?: string;
}) {
  const src = tone === "gradient" ? "/brand/carebridge-mark-on-gradient.svg" : "/brand/carebridge-mark-" + tone + ".svg";
  return <Image src={src} alt="CareBridge mark" width={256} height={256}
    className={cn("size-10 object-contain", className)} />;
}