"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/lib/auth/guards";
import { apiClient } from "@/lib/api/client";
import { ExcelWizard } from "@/components/excel/excel-wizard";
import { FileSpreadsheet, Layers, Calendar, Plus } from "lucide-react";

export default function BulkGeneratePage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [newEventName, setNewEventName] = useState("");
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tpls, evs] = await Promise.all([
          apiClient<any[]>("/templates").catch(() => []),
          apiClient<any[]>("/events").catch(() => [])
        ]);
        setTemplates(tpls || []);
        setEvents(evs || []);

        if (tpls && tpls.length > 0) {
          setSelectedTemplateId(tpls[0].templateId);
        }
        if (evs && evs.length > 0) {
          setSelectedEventId(evs[0].eventId);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateQuickEvent = async () => {
    if (!newEventName.trim()) return;
    try {
      const ev = await apiClient<any>("/events", {
        method: "POST",
        body: JSON.stringify({
          name: newEventName.trim(),
          date: new Date().toISOString().split("T")[0]
        })
      });
      setEvents(prev => [...prev, ev]);
      setSelectedEventId(ev.eventId);
      setIsCreatingEvent(false);
      setNewEventName("");
    } catch (e) {
      alert("Failed to create event");
    }
  };

  const selectedTemplate = templates.find(t => t.templateId === selectedTemplateId);
  const selectedEvent = events.find(e => e.eventId === selectedEventId);

  return (
    <RoleGuard allowedRoles={["COORDINATOR", "ADMIN"]}>
      <div className="flex-1 max-w-5xl mx-auto px-4 py-12 w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Bulk Certificate Generator</h1>
            <p className="text-xs text-slate-400">Upload participant spreadsheets, validate columns, and run chunked batch delivery</p>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Template Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand-400" /> Certificate Template
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              {templates.map(t => (
                <option key={t.templateId} value={t.templateId}>
                  {t.name} (Version {t.currentVersion})
                </option>
              ))}
            </select>
          </div>

          {/* Event Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gold-400" /> Target Event
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingEvent(!isCreatingEvent)}
                className="text-[11px] text-brand-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Quick Add Event
              </button>
            </div>

            {isCreatingEvent ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Cybersecurity Workshop 2026"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleCreateQuickEvent}
                  className="bg-brand-600 hover:bg-brand-500 text-white px-3 py-2 rounded-xl text-xs font-bold"
                >
                  Save
                </button>
              </div>
            ) : (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                {events.map(ev => (
                  <option key={ev.eventId} value={ev.eventId}>
                    {ev.name} ({ev.date || "Active"})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Excel Wizard */}
        <ExcelWizard
          templateId={selectedTemplateId}
          templateVersion={selectedTemplate?.currentVersion || 1}
          eventId={selectedEventId}
          eventName={selectedEvent?.name || "Workshop Session"}
          onJobCreated={(jobId) => router.push(`/coordinator/jobs/${jobId}`)}
        />
      </div>
    </RoleGuard>
  );
}
