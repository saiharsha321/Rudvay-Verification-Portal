"use client";

import React, { useState, useRef } from "react";
import { 
  Type, 
  QrCode, 
  Square, 
  Minus, 
  Move, 
  Trash2, 
  Eye, 
  Save, 
  RotateCw, 
  Layers, 
  Sliders, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Palette,
  Loader2,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Plus,
  Tag,
  X,
  FileUp
} from "lucide-react";

export interface TemplateElement {
  id: string;
  type: "TEXT" | "QR" | "LINE" | "RECTANGLE" | "IMAGE";
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold" | "italic";
  alignment: "left" | "center" | "right";
  textColor: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth: number;
  opacity: number;
  visibility: boolean;
}

export interface TemplateDesignData {
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImage?: string;
  accentColor: string;
  border: {
    style: "none" | "single" | "double" | "dashed";
    color: string;
    width: number;
    inset: number;
  };
  elements: TemplateElement[];
}

interface CanvasEditorProps {
  initialDesign?: TemplateDesignData;
  templateName: string;
  onSave: (design: TemplateDesignData) => Promise<void>;
  saving?: boolean;
}

const DEFAULT_PLACEHOLDERS = [
  { token: "{{name}}", label: "Recipient Name" },
  { token: "{{course}}", label: "Course / Program" },
  { token: "{{event}}", label: "Event Name" },
  { token: "{{date}}", label: "Issue Date" },
  { token: "{{duration}}", label: "Duration" },
  { token: "{{certificate_id}}", label: "Certificate ID" },
  { token: "{{verification_url}}", label: "Verification QR/Link" },
  { token: "{{email}}", label: "Recipient Email" },
];

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  initialDesign,
  templateName,
  onSave,
  saving = false
}) => {
  const [design, setDesign] = useState<TemplateDesignData>(
    initialDesign || {
      width: 842,
      height: 595,
      backgroundColor: "#FFFFFF",
      accentColor: "#D4AF37",
      border: {
        style: "double",
        color: "#0B192C",
        width: 3,
        inset: 20
      },
      elements: [
        {
          id: "elem_title",
          type: "TEXT",
          x: 50,
          y: 60,
          width: 742,
          height: 45,
          content: "RUDVAY TECH",
          fontFamily: "Helvetica",
          fontSize: 28,
          fontWeight: "bold",
          alignment: "center",
          textColor: "#0B192C",
          strokeWidth: 1,
          opacity: 1,
          visibility: true
        },
        {
          id: "elem_name",
          type: "TEXT",
          x: 50,
          y: 205,
          width: 742,
          height: 45,
          content: "{{name}}",
          fontFamily: "Helvetica",
          fontSize: 26,
          fontWeight: "bold",
          alignment: "center",
          textColor: "#0259A1",
          strokeWidth: 1,
          opacity: 1,
          visibility: true
        },
        {
          id: "elem_qr",
          type: "QR",
          x: 650,
          y: 410,
          width: 90,
          height: 90,
          content: "{{verification_url}}",
          fontFamily: "Helvetica",
          fontSize: 12,
          fontWeight: "normal",
          alignment: "center",
          textColor: "#0B192C",
          strokeWidth: 1,
          opacity: 1,
          visibility: true
        }
      ]
    }
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customTagInput, setCustomTagInput] = useState("");
  const [dragInfo, setDragInfo] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const imageElemInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const CANVAS_SCALE = 0.85;
  const selectedElement = design.elements.find(e => e.id === selectedId);

  const updateElement = (id: string, updates: Partial<TemplateElement>) => {
    setDesign(prev => ({
      ...prev,
      elements: prev.elements.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
  };

  const addElement = (type: "TEXT" | "QR" | "LINE" | "RECTANGLE" | "IMAGE", initialContent?: string) => {
    const newId = `elem_${Date.now()}`;
    const newElem: TemplateElement = {
      id: newId,
      type,
      x: 200,
      y: 200,
      width: type === "QR" ? 90 : type === "LINE" ? 200 : type === "IMAGE" ? 150 : 350,
      height: type === "QR" ? 90 : type === "LINE" ? 4 : type === "IMAGE" ? 150 : 40,
      content: initialContent || (type === "TEXT" ? "New Text Element" : type === "QR" ? "{{verification_url}}" : ""),
      fontFamily: "Helvetica",
      fontSize: 20,
      fontWeight: "normal",
      alignment: "center",
      textColor: "#0B192C",
      strokeWidth: 1,
      opacity: 1,
      visibility: true
    };
    setDesign(prev => ({ ...prev, elements: [...prev.elements, newElem] }));
    setSelectedId(newId);
  };

  const addPlaceholderAsElement = (token: string) => {
    if (selectedElement && selectedElement.type === "TEXT") {
      updateElement(selectedElement.id, {
        content: `${selectedElement.content} ${token}`.trim()
      });
    } else {
      addElement("TEXT", token);
    }
  };

  const handleAddCustomPlaceholder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTagInput.trim()) return;
    let clean = customTagInput.trim();
    if (!clean.startsWith("{{")) clean = `{{${clean}`;
    if (!clean.endsWith("}}")) clean = `${clean}}`;
    addPlaceholderAsElement(clean);
    setCustomTagInput("");
  };

  const removeElement = (id: string) => {
    setDesign(prev => ({ ...prev, elements: prev.elements.filter(e => e.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  };

  // Background Image Handler
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setDesign(prev => ({
        ...prev,
        backgroundImage: dataUrl,
        border: { ...prev.border, style: "none" } // Disable border default so custom background shows full
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeBgImage = () => {
    setDesign(prev => {
      const next = { ...prev };
      delete next.backgroundImage;
      return next;
    });
  };

  // Drag and drop event handlers
  const handlePointerDown = (e: React.PointerEvent, elem: TemplateElement) => {
    e.stopPropagation();
    setSelectedId(elem.id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const mouseXOnCanvas = (e.clientX - canvasRect.left) / CANVAS_SCALE;
    const mouseYOnCanvas = (e.clientY - canvasRect.top) / CANVAS_SCALE;

    setDragInfo({
      id: elem.id,
      offsetX: mouseXOnCanvas - elem.x,
      offsetY: mouseYOnCanvas - elem.y
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragInfo) return;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const mouseXOnCanvas = (e.clientX - canvasRect.left) / CANVAS_SCALE;
    const mouseYOnCanvas = (e.clientY - canvasRect.top) / CANVAS_SCALE;

    const newX = Math.max(0, Math.min(design.width - 20, Math.round(mouseXOnCanvas - dragInfo.offsetX)));
    const newY = Math.max(0, Math.min(design.height - 20, Math.round(mouseYOnCanvas - dragInfo.offsetY)));

    updateElement(dragInfo.id, { x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragInfo) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
      setDragInfo(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 select-none">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={bgInputRef}
        onChange={handleBgUpload}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      {/* Top Action Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{templateName || "Certificate Designer"}</h2>
            <p className="text-xs text-slate-400">
              {design.backgroundImage ? "Custom Background Image Attached" : "A4 Landscape Engine"} &bull; Drag elements to position
            </p>
          </div>
        </div>

        {/* Toolbar items */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Upload Background Button */}
          <button
            onClick={() => bgInputRef.current?.click()}
            className="bg-brand-600/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/40 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Upload custom background image template"
          >
            <Upload className="w-3.5 h-3.5 text-brand-400" /> Upload Background Image
          </button>

          {design.backgroundImage && (
            <button
              onClick={removeBgImage}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors"
              title="Remove background image"
            >
              <X className="w-3.5 h-3.5" /> Remove BG
            </button>
          )}

          <div className="h-5 w-px bg-slate-800 mx-1" />

          <button
            onClick={() => addElement("TEXT")}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Type className="w-3.5 h-3.5 text-brand-400" /> Add Text
          </button>
          <button
            onClick={() => addElement("QR")}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-gold-400" /> Add QR Code
          </button>
          <button
            onClick={() => addElement("LINE")}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Minus className="w-3.5 h-3.5 text-emerald-400" /> Add Line
          </button>

          <button
            onClick={() => onSave(design)}
            disabled={saving}
            className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-glow transition-all disabled:opacity-50 ml-2"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Version
          </button>
        </div>
      </div>

      {/* Placeholders Bar & Custom Field Creator */}
      <div className="glass-panel p-3 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-xs text-slate-400 font-semibold px-2 whitespace-nowrap flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-brand-400" /> Placeholders:
          </span>
          {DEFAULT_PLACEHOLDERS.map(p => (
            <button
              key={p.token}
              onClick={() => addPlaceholderAsElement(p.token)}
              className="bg-slate-900 hover:bg-brand-500/20 text-brand-300 hover:text-brand-200 border border-slate-800 hover:border-brand-500/50 px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-all shadow-sm"
              title={`Add ${p.label} placeholder field to template`}
            >
              + {p.token}
            </button>
          ))}
        </div>

        {/* Create custom placeholder input */}
        <form onSubmit={handleAddCustomPlaceholder} className="flex items-center gap-2 flex-shrink-0">
          <input
            type="text"
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            placeholder="Custom field tag (e.g. grade)"
            className="bg-slate-950 border border-slate-700 hover:border-brand-500 focus:border-brand-500 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors w-44"
          />
          <button
            type="submit"
            className="bg-slate-800 hover:bg-brand-600 text-slate-200 hover:text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Tag
          </button>
        </form>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Visual Canvas (3 cols) */}
        <div className="lg:col-span-3 glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-center overflow-auto min-h-[520px] bg-slate-950/80">
          <div 
            ref={canvasRef}
            onPointerMove={handlePointerMove}
            style={{
              width: `${design.width}px`,
              height: `${design.height}px`,
              backgroundColor: design.backgroundColor,
              transform: `scale(${CANVAS_SCALE})`,
              transformOrigin: 'top center'
            }}
            className="relative shadow-2xl rounded-sm border border-slate-800 transition-all select-none overflow-hidden"
          >
            {/* Custom Uploaded Background Image Layer */}
            {design.backgroundImage && (
              <img
                src={design.backgroundImage}
                alt="Custom Template Background"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none"
              />
            )}

            {/* Border Decorative Frame (if enabled and no background image) */}
            {design.border.style !== "none" && !design.backgroundImage && (
              <div 
                style={{
                  top: `${design.border.inset}px`,
                  left: `${design.border.inset}px`,
                  right: `${design.border.inset}px`,
                  bottom: `${design.border.inset}px`,
                  borderColor: design.border.color,
                  borderWidth: `${design.border.width}px`,
                  borderStyle: design.border.style === "double" ? "solid" : design.border.style
                }}
                className="absolute pointer-events-none"
              >
                {design.border.style === "double" && (
                  <div 
                    style={{
                      top: '5px',
                      left: '5px',
                      right: '5px',
                      bottom: '5px',
                      borderColor: design.accentColor,
                      borderWidth: '1px',
                    }}
                    className="absolute pointer-events-none"
                  />
                )}
              </div>
            )}

            {/* Canvas Elements Layer */}
            {design.elements.map(elem => {
              const isSelected = elem.id === selectedId;
              const isPlaceholder = elem.type === "TEXT" && elem.content.includes("{{");

              return (
                <div
                  key={elem.id}
                  onPointerDown={(e) => handlePointerDown(e, elem)}
                  onPointerUp={handlePointerUp}
                  style={{
                    position: "absolute",
                    left: `${elem.x}px`,
                    top: `${elem.y}px`,
                    width: `${elem.width}px`,
                    height: `${elem.height}px`,
                    opacity: elem.opacity,
                    touchAction: "none"
                  }}
                  className={`cursor-move transition-shadow rounded-sm group ${
                    isSelected 
                      ? "ring-2 ring-brand-400 ring-offset-2 ring-offset-slate-900 shadow-xl z-20" 
                      : isPlaceholder
                      ? "ring-1 ring-brand-500/60 hover:ring-brand-400 z-10"
                      : "hover:ring-1 hover:ring-slate-400/50"
                  }`}
                >
                  {/* Handle indicator badge for placeholders */}
                  {isPlaceholder && (
                    <div className="absolute -top-5 left-0 bg-brand-600 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow-sm opacity-80 group-hover:opacity-100 flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" /> PLACEHOLDER
                    </div>
                  )}

                  {elem.type === "TEXT" && (
                    <div
                      style={{
                        fontFamily: elem.fontFamily,
                        fontSize: `${elem.fontSize}px`,
                        fontWeight: elem.fontWeight === "bold" ? "bold" : "normal",
                        fontStyle: elem.fontWeight === "italic" ? "italic" : "normal",
                        color: elem.textColor,
                        textAlign: elem.alignment,
                        lineHeight: `${elem.height}px`,
                      }}
                      className="w-full h-full overflow-hidden whitespace-nowrap text-ellipsis px-1"
                    >
                      {elem.content}
                    </div>
                  )}

                  {elem.type === "QR" && (
                    <div className="w-full h-full bg-slate-900/90 border border-brand-500/50 rounded-lg flex flex-col items-center justify-center p-2 text-center text-white backdrop-blur-sm">
                      <QrCode className="w-9 h-9 text-brand-400" />
                      <span className="text-[9px] font-mono mt-1 text-slate-300">VERIFICATION QR</span>
                    </div>
                  )}

                  {elem.type === "LINE" && (
                    <div 
                      style={{
                        backgroundColor: elem.textColor || design.accentColor,
                        height: `${elem.strokeWidth || 2}px`
                      }}
                      className="w-full mt-2"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Element Properties Inspector (1 col) */}
        <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-brand-400" /> Element Properties
            </h3>
            {selectedElement && (
              <button
                onClick={() => removeElement(selectedElement.id)}
                className="text-red-400 hover:text-red-300 p-1 rounded-md hover:bg-red-500/10 transition-colors"
                title="Delete Element"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {selectedElement ? (
            <div className="space-y-4 text-xs">
              {/* Content */}
              {selectedElement.type === "TEXT" && (
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Text / Placeholder Content</label>
                  <textarea
                    rows={2}
                    value={selectedElement.content}
                    onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              )}

              {/* Position coordinates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">X Position (px)</label>
                  <input
                    type="number"
                    value={selectedElement.x}
                    onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Y Position (px)</label>
                  <input
                    type="number"
                    value={selectedElement.y}
                    onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Bounding box dimensions */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={selectedElement.width}
                    onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={selectedElement.height}
                    onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Text formatting styling */}
              {selectedElement.type === "TEXT" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Font Size</label>
                      <input
                        type="number"
                        value={selectedElement.fontSize}
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Style</label>
                      <select
                        value={selectedElement.fontWeight}
                        onChange={(e) => updateElement(selectedElement.id, { fontWeight: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="italic">Italic</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Alignment</label>
                    <div className="flex gap-2">
                      {(["left", "center", "right"] as const).map(align => (
                        <button
                          key={align}
                          onClick={() => updateElement(selectedElement.id, { alignment: align })}
                          className={`flex-1 py-1.5 rounded-lg border flex items-center justify-center ${
                            selectedElement.alignment === align ? "bg-brand-500/20 border-brand-500 text-brand-300" : "bg-slate-950 border-slate-700 text-slate-400"
                          }`}
                        >
                          {align === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                          {align === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                          {align === "right" && <AlignRight className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Text Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={selectedElement.textColor}
                        onChange={(e) => updateElement(selectedElement.id, { textColor: e.target.value })}
                        className="w-8 h-8 rounded-md bg-transparent cursor-pointer border border-slate-700"
                      />
                      <input
                        type="text"
                        value={selectedElement.textColor}
                        onChange={(e) => updateElement(selectedElement.id, { textColor: e.target.value })}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 space-y-2">
              <Move className="w-8 h-8 mx-auto opacity-50 text-brand-400 animate-bounce" />
              <p className="text-xs text-slate-300 font-medium">Click and drag any placeholder or text on the canvas</p>
              <p className="text-[11px] text-slate-500">You can also add custom background images or custom field tags above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
