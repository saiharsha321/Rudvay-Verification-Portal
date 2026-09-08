"use client";

import React, { useState } from "react";
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
  Sparkles
} from "lucide-react";

export interface TemplateElement {
  id: string;
  type: "TEXT" | "QR" | "LINE" | "RECTANGLE";
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

const PLACEHOLDERS = [
  { token: "{{name}}", label: "Recipient Name" },
  { token: "{{course}}", label: "Course / Program" },
  { token: "{{event}}", label: "Event Name" },
  { token: "{{date}}", label: "Issue Date" },
  { token: "{{duration}}", label: "Duration" },
  { token: "{{certificate_id}}", label: "Certificate ID" },
  { token: "{{verification_url}}", label: "Verification URL" },
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
          id: "elem_subtitle",
          type: "TEXT",
          x: 50,
          y: 110,
          width: 742,
          height: 30,
          content: "CERTIFICATE OF COMPLETION",
          fontFamily: "Helvetica",
          fontSize: 18,
          fontWeight: "bold",
          alignment: "center",
          textColor: "#D4AF37",
          strokeWidth: 1,
          opacity: 1,
          visibility: true
        },
        {
          id: "elem_presented",
          type: "TEXT",
          x: 50,
          y: 170,
          width: 742,
          height: 25,
          content: "This is proudly presented to",
          fontFamily: "Helvetica",
          fontSize: 14,
          fontWeight: "italic",
          alignment: "center",
          textColor: "#64748B",
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
          id: "elem_body",
          type: "TEXT",
          x: 100,
          y: 265,
          width: 642,
          height: 35,
          content: "for successfully mastering and completing the curriculum for {{course}}",
          fontFamily: "Helvetica",
          fontSize: 14,
          fontWeight: "normal",
          alignment: "center",
          textColor: "#334155",
          strokeWidth: 1,
          opacity: 1,
          visibility: true
        },
        {
          id: "elem_date",
          type: "TEXT",
          x: 100,
          y: 430,
          width: 250,
          height: 30,
          content: "Date: {{date}}",
          fontFamily: "Helvetica",
          fontSize: 12,
          fontWeight: "normal",
          alignment: "left",
          textColor: "#475569",
          strokeWidth: 1,
          opacity: 1,
          visibility: true
        },
        {
          id: "elem_id",
          type: "TEXT",
          x: 100,
          y: 460,
          width: 250,
          height: 30,
          content: "ID: {{certificate_id}}",
          fontFamily: "Helvetica",
          fontSize: 11,
          fontWeight: "bold",
          alignment: "left",
          textColor: "#0B192C",
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
  const selectedElement = design.elements.find(e => e.id === selectedId);

  const updateElement = (id: string, updates: Partial<TemplateElement>) => {
    setDesign(prev => ({
      ...prev,
      elements: prev.elements.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
  };

  const addElement = (type: "TEXT" | "QR" | "LINE" | "RECTANGLE") => {
    const newId = `elem_${Date.now()}`;
    const newElem: TemplateElement = {
      id: newId,
      type,
      x: 100,
      y: 100,
      width: type === "QR" ? 90 : type === "LINE" ? 200 : 250,
      height: type === "QR" ? 90 : type === "LINE" ? 4 : 40,
      content: type === "TEXT" ? "New Text Element" : type === "QR" ? "{{verification_url}}" : "",
      fontFamily: "Helvetica",
      fontSize: 16,
      fontWeight: "normal",
      alignment: "left",
      textColor: "#0B192C",
      strokeWidth: 1,
      opacity: 1,
      visibility: true
    };
    setDesign(prev => ({ ...prev, elements: [...prev.elements, newElem] }));
    setSelectedId(newId);
  };

  const removeElement = (id: string) => {
    setDesign(prev => ({ ...prev, elements: prev.elements.filter(e => e.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  };

  const insertPlaceholder = (token: string) => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, {
      content: `${selectedElement.content} ${token}`
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Action Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{templateName || "Certificate Designer"}</h2>
            <p className="text-xs text-slate-400">A4 Landscape &bull; In-Memory ReportLab Engine</p>
          </div>
        </div>

        {/* Toolbar items */}
        <div className="flex items-center gap-2">
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
            <QrCode className="w-3.5 h-3.5 text-gold-400" /> Add QR
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

      {/* Dynamic Placeholder Pill Bar */}
      <div className="glass-panel p-3 rounded-xl border border-slate-800/80 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs text-slate-400 font-semibold px-2 whitespace-nowrap">Placeholders:</span>
        {PLACEHOLDERS.map(p => (
          <button
            key={p.token}
            onClick={() => insertPlaceholder(p.token)}
            disabled={!selectedElement || selectedElement.type !== "TEXT"}
            className="bg-slate-900 hover:bg-brand-500/20 text-brand-300 hover:text-brand-200 border border-slate-800 hover:border-brand-500/40 px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-colors disabled:opacity-40 disabled:hover:bg-slate-900"
            title={`Insert ${p.label}`}
          >
            {p.token}
          </button>
        ))}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Visual Canvas (3 cols) */}
        <div className="lg:col-span-3 glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-center overflow-auto min-h-[500px] bg-slate-950/60">
          <div 
            style={{
              width: `${design.width}px`,
              height: `${design.height}px`,
              backgroundColor: design.backgroundColor,
              transform: 'scale(0.85)',
              transformOrigin: 'top center'
            }}
            className="relative shadow-2xl rounded-sm border-2 transition-all select-none"
          >
            {/* Border Decorative Frame */}
            {design.border.style !== "none" && (
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

            {/* Elements Layer */}
            {design.elements.map(elem => {
              const isSelected = elem.id === selectedId;

              return (
                <div
                  key={elem.id}
                  onClick={() => setSelectedId(elem.id)}
                  style={{
                    position: "absolute",
                    left: `${elem.x}px`,
                    top: `${elem.y}px`,
                    width: `${elem.width}px`,
                    height: `${elem.height}px`,
                    opacity: elem.opacity,
                  }}
                  className={`cursor-pointer transition-shadow rounded-sm ${
                    isSelected ? "ring-2 ring-brand-500 ring-offset-2 ring-offset-slate-900 shadow-lg" : "hover:ring-1 hover:ring-slate-400/50"
                  }`}
                >
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
                    <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-lg flex flex-col items-center justify-center p-2 text-center text-white">
                      <QrCode className="w-10 h-10 text-brand-400" />
                      <span className="text-[9px] font-mono mt-1 text-slate-300">QR CODE</span>
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
                  <label className="block text-slate-400 font-medium mb-1">Text Content</label>
                  <textarea
                    rows={2}
                    value={selectedElement.content}
                    onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              )}

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">X Position</label>
                  <input
                    type="number"
                    value={selectedElement.x}
                    onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Y Position</label>
                  <input
                    type="number"
                    value={selectedElement.y}
                    onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              {/* Size */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Width</label>
                  <input
                    type="number"
                    value={selectedElement.width}
                    onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Height</label>
                  <input
                    type="number"
                    value={selectedElement.height}
                    onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              {/* Typography */}
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
            <div className="text-center py-8 text-slate-500">
              <Move className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Click any canvas element to customize its properties</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
