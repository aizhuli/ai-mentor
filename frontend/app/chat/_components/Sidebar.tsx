"use client";

import { useState, useRef, useEffect } from "react";
import type { Session } from "@/lib/api";

interface Props {
  sessions: Session[];
  activeSessionId: number | null;
  loading: boolean;
  onSelect: (id: number) => void;
  onNewSession: () => void;
  onDelete: (id: number) => void;
  onRename: (id: number, title: string) => void;
  username: string | null;
  onLogout: () => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  loading,
  onSelect,
  onNewSession,
  onDelete,
  onRename,
  username,
  onLogout,
}: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId !== null) editRef.current?.focus();
  }, [editingId]);

  function startRename(session: Session) {
    setEditingId(session.id);
    setEditValue(session.title);
  }

  function commitRename(id: number) {
    const trimmed = editValue.trim();
    if (trimmed) onRename(id, trimmed);
    setEditingId(null);
  }

  return (
    <aside
      className="flex flex-col w-72 flex-none h-full bg-crimson"
      style={{ borderRight: "3px solid #6B1C28" }}
    >
      {/* App name */}
      <div className="px-5 pt-5 pb-3">
        <h1
          className="font-heading text-cream text-3xl leading-none"
          style={{ letterSpacing: "0.18em" }}
        >
          NUCLEAR MENTOR
        </h1>
        <div className="mt-2 h-px bg-cream opacity-30" />
      </div>

      {/* New session */}
      <div className="px-4 pb-3">
        <button
          onClick={onNewSession}
          className="w-full border-2 border-cream text-cream font-body text-xs tracking-widest uppercase px-3 py-2 hover:bg-cream hover:text-crimson transition-colors"
        >
          + NEW SESSION
        </button>
      </div>

      {/* Session list */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-px">
        {loading && (
          <p className="font-body text-xs text-sand opacity-60 px-2 py-3 tracking-widest uppercase">
            Loading…
          </p>
        )}
        {!loading && sessions.length === 0 && (
          <p className="font-body text-xs text-sand opacity-60 px-2 py-3 tracking-widest">
            No sessions yet
          </p>
        )}
        {sessions.map((s) => {
          const isActive = s.id === activeSessionId;
          return (
            <div
              key={s.id}
              className={`group flex items-center gap-1 px-2 py-2 cursor-pointer transition-colors ${
                isActive
                  ? "bg-crimson-dark border-l-2 border-teal"
                  : "hover:bg-crimson-dark border-l-2 border-transparent"
              }`}
              onClick={() => {
                if (editingId !== s.id) onSelect(s.id);
              }}
            >
              {editingId === s.id ? (
                <input
                  ref={editRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => commitRename(s.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(s.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-transparent border-b border-cream text-cream font-body text-xs focus:outline-none py-px"
                />
              ) : (
                <span
                  className="flex-1 font-body text-xs text-cream truncate"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startRename(s);
                  }}
                  title="Double-click to rename"
                >
                  {s.title}
                </span>
              )}

              {/* Delete button — visible on hover or when active */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(s.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-sand hover:text-cream font-body text-sm leading-none px-1 transition-opacity"
                title="Delete session"
              >
                ×
              </button>
            </div>
          );
        })}
      </nav>

      {/* User / logout */}
      <div className="border-t border-cream border-opacity-20 px-4 py-3 flex items-center gap-2">
        <span className="flex-1 font-body text-xs text-sand truncate uppercase tracking-widest">
          {username ?? "USER"}
        </span>
        <button
          onClick={onLogout}
          className="font-body text-xs text-sand hover:text-cream tracking-widest uppercase transition-colors"
        >
          LOGOUT
        </button>
      </div>
    </aside>
  );
}
