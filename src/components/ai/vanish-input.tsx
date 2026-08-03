"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { RiAttachmentLine, RiStopCircleLine } from "@remixicon/react";

interface VanishInputProps {
  placeholders: string[];
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isStreaming?: boolean;
  onStop?: () => void;
  disabled?: boolean;
}

export function VanishInput({
  placeholders,
  value,
  onChange,
  onSubmit,
  isStreaming,
  onStop,
  disabled,
}: VanishInputProps) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [animating, setAnimating] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const newDataRef = useRef<any[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startAnimation = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
  }, [placeholders.length]);

  useEffect(() => {
    startAnimation();
    const handleVisibility = () => {
      if (document.visibilityState !== "visible" && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else if (document.visibilityState === "visible") {
        startAnimation();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [startAnimation]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 800;
    ctx.clearRect(0, 0, 800, 800);

    const computedStyles = getComputedStyle(textareaRef.current!);
    const fontSize = parseFloat(computedStyles.getPropertyValue("font-size"));
    ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;
    ctx.fillStyle = "#FFF";
    ctx.fillText(value, 16, 40);

    const imageData = ctx.getImageData(0, 0, 800, 800);
    const pixelData = imageData.data;
    const newData: any[] = [];

    for (let t = 0; t < 800; t++) {
      const i = 4 * t * 800;
      for (let n = 0; n < 800; n++) {
        const e = i + 4 * n;
        if (pixelData[e] !== 0 && pixelData[e + 1] !== 0 && pixelData[e + 2] !== 0) {
          newData.push({
            x: n,
            y: t,
            color: [pixelData[e], pixelData[e + 1], pixelData[e + 2], pixelData[e + 3]],
          });
        }
      }
    }

    newDataRef.current = newData.map(({ x, y, color }) => ({
      x,
      y,
      r: 1,
      color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`,
    }));
  }, [value]);

  useEffect(() => {
    draw();
  }, [value, draw]);

  const animate = (start: number) => {
    const animateFrame = (pos: number = 0) => {
      requestAnimationFrame(() => {
        const newArr = [];
        for (let i = 0; i < newDataRef.current.length; i++) {
          const current = newDataRef.current[i];
          if (current.x < pos) {
            newArr.push(current);
          } else {
            if (current.r <= 0) {
              current.r = 0;
              continue;
            }
            current.x += Math.random() > 0.5 ? 1 : -1;
            current.y += Math.random() > 0.5 ? 1 : -1;
            current.r -= 0.05 * Math.random();
            newArr.push(current);
          }
        }
        newDataRef.current = newArr;
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.clearRect(pos, 0, 800, 800);
          newDataRef.current.forEach((t) => {
            const { x: n, y: i, r: s, color } = t;
            if (n > pos) {
              ctx.beginPath();
              ctx.rect(n, i, s, s);
              ctx.fillStyle = color;
              ctx.strokeStyle = color;
              ctx.stroke();
            }
          });
        }
        if (newDataRef.current.length > 0) {
          animateFrame(pos - 8);
        } else {
          setAnimating(false);
        }
      });
    };
    animateFrame(start);
  };

  const vanishAndSubmit = () => {
    if (!value.trim()) return;
    setAnimating(true);
    draw();

    if (value) {
      const maxX = newDataRef.current.reduce(
        (prev, curr) => (curr.x > prev ? curr.x : prev),
        0
      );
      if (maxX > 0) animate(maxX);
    }
    onSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !animating) {
      e.preventDefault();
      vanishAndSubmit();
    }
  };

  return (
    <div
      className={cn(
        "relative flex items-end gap-2 rounded-2xl border border-border/40 bg-card px-4 py-3 shadow-sm transition-all duration-300",
        "focus-within:border-health/30 focus-within:shadow-[0_0_0_1px_hsl(var(--health)/0.3)]",
        value && "bg-card",
      )}
    >
      <canvas
        className={cn(
          "absolute pointer-events-none text-base transform scale-50 top-[20%] left-2 sm:left-8 origin-top-left filter invert dark:invert-0 pr-20",
          !animating ? "opacity-0" : "opacity-100",
        )}
        ref={canvasRef}
      />

      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={animating ? "" : value}
          onChange={(e) => {
            if (!animating) onChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          className={cn(
            "w-full resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none max-h-40 min-h-[24px] field-sizing-content",
            (animating || value) && "text-foreground",
          )}
          disabled={disabled}
        />

        <AnimatePresence mode="wait">
          {!value && !animating && (
            <motion.p
              initial={{ y: 5, opacity: 0 }}
              key={`placeholder-${currentPlaceholder}`}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.3, ease: "linear" }}
              className="pointer-events-none absolute left-0 top-0 text-sm text-muted-foreground/50 truncate w-[calc(100%-2rem)]"
            >
              {placeholders[currentPlaceholder]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {isStreaming ? (
        <button
          type="button"
          onClick={onStop}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground/70 hover:bg-foreground/20 hover:text-foreground transition-colors"
          aria-label="Stop generating"
        >
          <RiStopCircleLine className="size-4" />
        </button>
      ) : (
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-accent/50 transition-colors"
            aria-label="Attach file"
          >
            <RiAttachmentLine className="size-4" />
          </button>
          <button
            type="button"
            onClick={vanishAndSubmit}
            disabled={!value.trim() || animating}
            aria-label="Send message"
            className={cn(
              "flex size-8 items-center justify-center rounded-full transition-all duration-200",
              value.trim()
                ? "bg-health text-white shadow-sm shadow-health/20 hover:bg-health/90 hover:shadow-md hover:shadow-health/25 active:scale-95"
                : "bg-muted text-muted-foreground/40",
            )}
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(value.trim() ? "text-white" : "text-muted-foreground/40")}
            >
              <motion.path
                d="M5 12h14"
                initial={{ strokeDasharray: "50%", strokeDashoffset: "50%" }}
                animate={{ strokeDashoffset: value.trim() ? 0 : "50%" }}
                transition={{ duration: 0.3, ease: "linear" }}
              />
              <path d="M13 6l6 6" />
              <path d="M13 18l6-6" />
            </motion.svg>
          </button>
        </div>
      )}
    </div>
  );
}
