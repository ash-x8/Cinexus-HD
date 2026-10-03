import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Check, 
  Crop, 
  Move, 
  Sparkles,
  Loader2
} from 'lucide-react';

interface AvatarCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string, croppedBlob: Blob) => Promise<void> | void;
}

export const AvatarCropperModal: React.FC<AvatarCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete
}) => {
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load Image when imageSrc changes
  useEffect(() => {
    if (!imageSrc || !isOpen) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImgElement(img);
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  // Draw the preview onto the interactive canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgElement) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width; // 400x400
    ctx.clearRect(0, 0, size, size);

    // Save state
    ctx.save();

    // Center and apply user transform
    ctx.translate(size / 2 + position.x, size / 2 + position.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Calculate aspect fit dimensions
    const imgAspect = imgElement.width / imgElement.height;
    let drawWidth = size;
    let drawHeight = size;

    if (imgAspect > 1) {
      drawWidth = size * imgAspect;
      drawHeight = size;
    } else {
      drawWidth = size;
      drawHeight = size / imgAspect;
    }

    ctx.drawImage(
      imgElement,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    ctx.restore();
  }, [imgElement, scale, rotation, position]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Mouse Drag / Touch Drag handling
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Zoom with Wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.002;
    setScale((prev) => Math.min(Math.max(0.6, prev + delta), 4));
  };

  // Rotate 90deg clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Generate cropped output blob and save
  const handleSaveCrop = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgElement) return;

    setIsSaving(true);
    try {
      // Create offscreen canvas for final clean output
      const outSize = 400;
      const offscreen = document.createElement('canvas');
      offscreen.width = outSize;
      offscreen.height = outSize;
      const ctx = offscreen.getContext('2d');

      if (!ctx) throw new Error('Could not initialize canvas context');

      // Draw avatar onto offscreen canvas with current transforms
      ctx.save();
      ctx.translate(outSize / 2 + position.x, outSize / 2 + position.y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);

      const imgAspect = imgElement.width / imgElement.height;
      let drawWidth = outSize;
      let drawHeight = outSize;

      if (imgAspect > 1) {
        drawWidth = outSize * imgAspect;
        drawHeight = outSize;
      } else {
        drawWidth = outSize;
        drawHeight = outSize / imgAspect;
      }

      ctx.drawImage(imgElement, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      // Convert to blob and dataUrl
      const dataUrl = offscreen.toDataURL('image/jpeg', 0.88);

      const blob = await new Promise<Blob>((resolve, reject) => {
        offscreen.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to create image blob'));
          },
          'image/jpeg',
          0.88
        );
      });

      await onCropComplete(dataUrl, blob);
      onClose();
    } catch (err) {
      console.error('[AvatarCropperModal] Crop failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div 
        ref={containerRef}
        className="w-full max-w-lg bg-[#0e121b] border border-[#D4AF37]/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(212,175,55,0.2)] text-white space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-display">
                Crop & Adjust Profile Avatar
              </h3>
              <p className="text-[11px] text-zinc-400">
                Drag to position, zoom and rotate your photo for the perfect circle fit.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cropper Viewport & Overlay */}
        <div className="relative w-full aspect-square max-w-[340px] mx-auto rounded-3xl overflow-hidden bg-black/70 border border-white/10 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-inner">
          
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            className="w-full h-full object-contain"
          />

          {/* Circular Cutout Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[85%] aspect-square rounded-full border-2 border-[#D4AF37] shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] ring-2 ring-[#D4AF37]/40" />
          </div>

          {/* Drag Hint */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] text-zinc-300 font-medium flex items-center gap-1.5 pointer-events-none">
            <Move className="w-3 h-3 text-[#D4AF37]" />
            <span>Drag image to center face</span>
          </div>

        </div>

        {/* Controls Toolbar (Zoom & Rotate) */}
        <div className="space-y-4 px-2">
          
          {/* Zoom Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 font-bold">
                <ZoomIn className="w-3.5 h-3.5 text-[#D4AF37]" /> Zoom Level
              </span>
              <span className="font-mono text-zinc-300">{Math.round(scale * 100)}%</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setScale((prev) => Math.max(0.6, prev - 0.15))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="0.6"
                max="3.5"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="flex-1 accent-[#D4AF37] h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />

              <button
                type="button"
                onClick={() => setScale((prev) => Math.min(3.5, prev + 0.15))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleRotate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-bold transition-colors cursor-pointer border border-white/5"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Rotate 90°</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScale(1);
                setRotation(0);
                setPosition({ x: 0, y: 0 });
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors"
            >
              Reset Position
            </button>
          </div>

        </div>

        {/* Modal Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition-all cursor-pointer border border-white/10 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveCrop}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-950/40 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Avatar...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Crop & Save Avatar</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
