"use client";

import { useEffect, useId, useRef, useState } from "react";

type InfoTooltipProps = {
  text: string;
};

export function InfoTooltip({ text }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapperRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current) {
        return;
      }
      if (event.target instanceof Node && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  return (
    <span
      ref={wrapperRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-describedby={id}
        aria-label={text}
        onClick={() => setOpen((prev) => !prev)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium text-slate-400 transition hover:text-slate-600 focus:text-slate-600"
      >
        i
      </button>
      <span
        id={id}
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-60 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-xs leading-relaxed text-white shadow-lg transition ${
          open ? "opacity-100" : "opacity-0"
        }`}
      >
        {text}
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-slate-900" />
      </span>
    </span>
  );
}
