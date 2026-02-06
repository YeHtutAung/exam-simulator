"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { useRouter } from "next/navigation";

type CropBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type DragState =
  | {
      mode: "new";
      startX: number;
      startY: number;
    }
  | {
      mode: "move";
      startX: number;
      startY: number;
      origin: CropBox;
    };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampCrop(crop: CropBox, imageWidth: number, imageHeight: number): CropBox {
  const width = Math.max(1, Math.round(crop.width));
  const height = Math.max(1, Math.round(crop.height));
  const x = clamp(Math.round(crop.x), 0, Math.max(0, imageWidth - width));
  const y = clamp(Math.round(crop.y), 0, Math.max(0, imageHeight - height));

  return {
    x,
    y,
    width: Math.min(width, imageWidth - x),
    height: Math.min(height, imageHeight - y),
  };
}

function isPointInRect(x: number, y: number, rect: CropBox) {
  return (
    x >= rect.x &&
    y >= rect.y &&
    x <= rect.x + rect.width &&
    y <= rect.y + rect.height
  );
}

type ImportDraftQuestionCropperProps = {
  draftId: string;
  questionId: string;
  pageImageUrl: string;
  stemImageUrl?: string | null;
  initialCrop?: CropBox | null;
  prevQuestionId?: string | null;
  nextQuestionId?: string | null;
};

export function ImportDraftQuestionCropper({
  draftId,
  questionId,
  pageImageUrl,
  stemImageUrl,
  initialCrop,
  prevQuestionId,
  nextQuestionId,
}: ImportDraftQuestionCropperProps) {
  const router = useRouter();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [crop, setCrop] = useState<CropBox | null>(initialCrop ?? null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  const scale = useMemo(() => {
    if (!imageSize.width || !displaySize.width) {
      return { x: 1, y: 1 };
    }
    return {
      x: imageSize.width / displaySize.width,
      y: imageSize.height / displaySize.height,
    };
  }, [imageSize, displaySize]);

  const displayCrop = useMemo(() => {
    if (!crop) {
      return null;
    }
    return {
      x: crop.x / scale.x,
      y: crop.y / scale.y,
      width: crop.width / scale.x,
      height: crop.height / scale.y,
    };
  }, [crop, scale]);

  useEffect(() => {
    if (!imageRef.current) {
      return;
    }
    const update = () => {
      if (!imageRef.current) {
        return;
      }
      const rect = imageRef.current.getBoundingClientRect();
      setDisplaySize({ width: rect.width, height: rect.height });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(imageRef.current);
    return () => observer.disconnect();
  }, [pageImageUrl]);

  useEffect(() => {
    if (!imageRef.current || !canvasRef.current || !crop) {
      return;
    }

    const context = canvasRef.current.getContext("2d");
    if (!context) {
      return;
    }

    const scaleFactor = crop.width > 0 ? Math.min(1, 320 / crop.width) : 1;
    canvasRef.current.width = Math.max(1, Math.round(crop.width * scaleFactor));
    canvasRef.current.height = Math.max(1, Math.round(crop.height * scaleFactor));

    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    context.drawImage(
      imageRef.current,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
  }, [crop]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!imageRef.current || !imageSize.width || !displaySize.width) {
      return;
    }
    event.preventDefault();
    containerRef.current?.setPointerCapture(event.pointerId);
    const rect = imageRef.current.getBoundingClientRect();
    const startX = clamp(event.clientX - rect.left, 0, rect.width);
    const startY = clamp(event.clientY - rect.top, 0, rect.height);

    if (displayCrop && isPointInRect(startX, startY, displayCrop)) {
      dragRef.current = {
        mode: "move",
        startX,
        startY,
        origin: crop ?? {
          x: 0,
          y: 0,
          width: imageSize.width,
          height: imageSize.height,
        },
      };
    } else {
      dragRef.current = {
        mode: "new",
        startX,
        startY,
      };
      setCrop({
        x: Math.round(startX * scale.x),
        y: Math.round(startY * scale.y),
        width: 1,
        height: 1,
      });
    }

  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!imageRef.current || !dragRef.current) {
      return;
    }
    const rectMove = imageRef.current.getBoundingClientRect();
    const currentX = clamp(event.clientX - rectMove.left, 0, rectMove.width);
    const currentY = clamp(event.clientY - rectMove.top, 0, rectMove.height);

    if (dragRef.current.mode === "new") {
      const x1 = Math.min(dragRef.current.startX, currentX);
      const y1 = Math.min(dragRef.current.startY, currentY);
      const x2 = Math.max(dragRef.current.startX, currentX);
      const y2 = Math.max(dragRef.current.startY, currentY);

      const nextCrop = clampCrop(
        {
          x: x1 * scale.x,
          y: y1 * scale.y,
          width: (x2 - x1) * scale.x,
          height: (y2 - y1) * scale.y,
        },
        imageSize.width,
        imageSize.height
      );
      setCrop(nextCrop);
    } else {
      const deltaX = (currentX - dragRef.current.startX) * scale.x;
      const deltaY = (currentY - dragRef.current.startY) * scale.y;
      const origin = dragRef.current.origin;
      const nextCrop = clampCrop(
        {
          x: origin.x + deltaX,
          y: origin.y + deltaY,
          width: origin.width,
          height: origin.height,
        },
        imageSize.width,
        imageSize.height
      );
      setCrop(nextCrop);
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (containerRef.current?.hasPointerCapture(event.pointerId)) {
      containerRef.current.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!crop || !imageSize.width) {
      return;
    }

    const step = 1;
    let next: CropBox | null = null;

    if (event.key === "Enter") {
      event.preventDefault();
      void handleSave();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (event.shiftKey) {
        next = { ...crop, height: crop.height - step };
      } else {
        next = { ...crop, y: crop.y - step };
      }
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (event.shiftKey) {
        next = { ...crop, height: crop.height + step };
      } else {
        next = { ...crop, y: crop.y + step };
      }
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (event.shiftKey) {
        next = { ...crop, width: crop.width - step };
      } else {
        next = { ...crop, x: crop.x - step };
      }
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (event.shiftKey) {
        next = { ...crop, width: crop.width + step };
      } else {
        next = { ...crop, x: crop.x + step };
      }
    }

    if (next) {
      setCrop(clampCrop(next, imageSize.width, imageSize.height));
    }
  };

  const handleReset = () => {
    setError(null);
    setStatus(null);
    setCrop(initialCrop ?? null);
  };

  const handleAutoDetect = async () => {
    setIsAutoDetecting(true);
    setError(null);
    setStatus(null);
    try {
      const response = await fetch(
        `/api/admin/import/${draftId}/questions/${questionId}/recrop`,
        { method: "POST" }
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "Auto-detect failed.");
        return;
      }
      router.refresh();
    } finally {
      setIsAutoDetecting(false);
    }
  };

  const handleSave = async (): Promise<boolean> => {
    if (!crop) {
      setError("Select a crop area first.");
      return false;
    }
    setIsSaving(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch(
        `/api/admin/import/${draftId}/questions/${questionId}/crop`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            x: crop.x,
            y: crop.y,
            width: crop.width,
            height: crop.height,
          }),
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "Failed to save crop.");
        return false;
      }

      setStatus("Crop saved.");
      router.refresh();
      return true;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndNext = async () => {
    if (!nextQuestionId) {
      return;
    }
    const saved = await handleSave();
    if (saved) {
      router.push(`/admin/import/${draftId}/questions/${nextQuestionId}`);
    }
  };

  return (
    <div className="rounded-2xl border border-sand-300 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">Stem crop</p>
          <p className="text-xs text-slate-500">
            Drag to select. Arrow keys move, Shift + arrows resize, Enter saves.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {stemImageUrl ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                Cropped
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                Not cropped
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => prevQuestionId && router.push(`/admin/import/${draftId}/questions/${prevQuestionId}`)}
            disabled={!prevQuestionId}
            className="rounded-full border border-sand-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => nextQuestionId && router.push(`/admin/import/${draftId}/questions/${nextQuestionId}`)}
            disabled={!nextQuestionId}
            className="rounded-full border border-sand-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60"
          >
            Next
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-sand-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleAutoDetect}
            disabled={isAutoDetecting}
            className="rounded-full border border-sand-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60"
          >
            {isAutoDetecting ? "Detecting..." : "Auto-detect"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!crop || isSaving}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save crop"}
          </button>
          <button
            type="button"
            onClick={handleSaveAndNext}
            disabled={!crop || isSaving || !nextQuestionId}
            className="rounded-full bg-accent-strong px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save & Next
          </button>
        </div>
      </div>

      {(error || status) && (
        <div className="mt-3 space-y-2 text-sm">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{error}</p>}
          {status && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
              {status}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div
          ref={containerRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative overflow-hidden rounded-2xl border border-sand-300 bg-sand focus:outline-none focus:ring-2 focus:ring-accent/50 touch-none"
        >
          <img
            ref={imageRef}
            src={pageImageUrl}
            alt="PDF page"
            className="block h-auto w-full select-none"
            onLoad={(event) => {
              const target = event.currentTarget;
              setImageSize({
                width: target.naturalWidth,
                height: target.naturalHeight,
              });
            }}
          />
          {displayCrop && (
            <div
              className="pointer-events-none absolute border-2 border-accent bg-accent/10"
              style={{
                left: `${displayCrop.x}px`,
                top: `${displayCrop.y}px`,
                width: `${displayCrop.width}px`,
                height: `${displayCrop.height}px`,
              }}
            />
          )}
        </div>

        <div className="rounded-2xl border border-sand-300 bg-sand p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Preview</p>
          <div className="mt-3 flex items-center justify-center rounded-xl border border-sand-300 bg-white p-2">
            {crop ? (
              <canvas ref={canvasRef} className="max-w-full" />
            ) : (
              <p className="text-xs text-slate-500">Select a crop area to preview.</p>
            )}
          </div>
          <div className="mt-3 text-xs text-slate-600">
            <p>
              Image: {imageSize.width} x {imageSize.height}
            </p>
            {crop && (
              <p>
                Crop: x {crop.x} · y {crop.y} · w {crop.width} · h {crop.height}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
