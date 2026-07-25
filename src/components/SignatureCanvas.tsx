import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, Edit3 } from 'lucide-react';

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void;
  initialSignature?: string;
  label?: string;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSave,
  initialSignature = '',
  label = 'التوقيع الإلكتروني'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [savedPreview, setSavedPreview] = useState(initialSignature);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.clientWidth || 400;
    canvas.height = 140;

    // Configure stroke style
    ctx.strokeStyle = '#1e3a8a'; // Deep blue signature line
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      const dataUrl = canvas.toDataURL('image/png');
      setSavedPreview(dataUrl);
      onSave(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSavedPreview('');
    onSave('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Edit3 className="w-4 h-4 text-blue-600" />
          {label}
        </label>
        {hasSignature && (
          <button
            type="button"
            onClick={clearCanvas}
            className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium bg-rose-50 px-2 py-1 rounded"
          >
            <Eraser className="w-3.5 h-3.5" />
            مسح التوقيع
          </button>
        )}
      </div>

      {savedPreview && !isDrawing && !hasSignature ? (
        <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-3 text-center relative group">
          <p className="text-xs text-blue-700 mb-2 font-medium">توقيع مسجل سابقاً:</p>
          <img src={savedPreview} alt="Signature" className="max-h-20 mx-auto object-contain" />
          <button
            type="button"
            onClick={() => {
              setSavedPreview('');
              setHasSignature(false);
            }}
            className="mt-2 text-xs text-slate-600 underline"
          >
            إعادة التوقيع من جديد
          </button>
        </div>
      ) : (
        <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-white overflow-hidden touch-none shadow-inner">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full cursor-crosshair block"
          />
          {!hasSignature && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs">
              وقع بالماوس أو الإصبع هنا...
            </div>
          )}
        </div>
      )}
      {hasSignature && (
        <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
          <Check className="w-3.5 h-3.5" /> تم اعتماد التوقيع بنجاح
        </p>
      )}
    </div>
  );
};
