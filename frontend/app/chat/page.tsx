"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./_components/Sidebar";
import ChatArea from "./_components/ChatArea";
import {
  getSessions,
  createSession,
  deleteSession,
  renameSession,
  getMessages,
  sendMessage,
  clearToken,
  clearUsername,
  getUsername,
  type Session,
  type Message,
} from "@/lib/api";

export default function ChatPage() {
  const router = useRouter();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [username, setUsernameState] = useState<string | null>(null);

  // Load username from localStorage on mount
  useEffect(() => {
    setUsernameState(getUsername());
  }, []);

  // Load session list on mount
  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch {
      // token expired or network error — handled by proxy redirect
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load messages when active session changes
  useEffect(() => {
    if (activeSessionId === null) {
      setMessages([]);
      return;
    }
    getMessages(activeSessionId).then(setMessages).catch(console.error);
  }, [activeSessionId]);

  // ── Session operations ─────────────────────────────────────────────────────

  async function handleNewSession() {
    try {
      const session = await createSession();
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteSession(id: number) {
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRenameSession(id: number, title: string) {
    try {
      const updated = await renameSession(id, title);
      setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      console.error(err);
    }
  }

  // ── Messaging ──────────────────────────────────────────────────────────────

  function autoSessionTitle(content: string): string {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mmm = now.toLocaleString("en", { month: "short" }).toUpperCase();
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const snippet = content.replace(/\s+/g, " ").trim().slice(0, 40);
    const ellipsis = content.length > 40 ? "…" : "";
    return `${dd} ${mmm} ${hhmm} — ${snippet}${ellipsis}`;
  }

  async function handleSend(content: string) {
    if (activeSessionId === null || isStreaming) return;

    // Auto-name the session on the first message
    const isFirstMessage = messages.length === 0;
    if (isFirstMessage) {
      const title = autoSessionTitle(content);
      renameSession(activeSessionId, title).then((updated) => {
        setSessions((prev) => prev.map((s) => (s.id === activeSessionId ? updated : s)));
      });
    }

    // Optimistically show the user's message
    const optimisticUser: Message = {
      id: -Date.now(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setIsStreaming(true);
    setStreamingContent("");

    let assembled = "";

    await sendMessage(
      activeSessionId,
      content,
      // onChunk
      (chunk) => {
        assembled += chunk;
        setStreamingContent(assembled);
      },
      // onDone
      () => {
        const assistantMsg: Message = {
          id: -Date.now() - 1,
          role: "assistant",
          content: assembled,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingContent("");
        setIsStreaming(false);

        // Bring this session to the top (updatedAt changed on server)
        setSessions((prev) => {
          const target = prev.find((s) => s.id === activeSessionId);
          if (!target) return prev;
          return [
            { ...target, updatedAt: new Date().toISOString() },
            ...prev.filter((s) => s.id !== activeSessionId),
          ];
        });
      },
      // onError
      (err) => {
        console.error("Stream error:", err);
        setIsStreaming(false);
        setStreamingContent("");
      }
    );
  }

  // ── Auth ───────────────────────────────────────────────────────────────────

  function handleLogout() {
    clearToken();
    clearUsername();
    router.push("/login");
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-khaki">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        loading={sessionsLoading}
        onSelect={(id) => {
          if (id !== activeSessionId) {
            setActiveSessionId(id);
            setMessages([]);
            setStreamingContent("");
          }
        }}
        onNewSession={handleNewSession}
        onDelete={handleDeleteSession}
        onRename={handleRenameSession}
        username={username}
        onLogout={handleLogout}
      />
      <ChatArea
        activeSessionId={activeSessionId}
        messages={messages}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
        onSend={handleSend}
      />
    </div>
  );
}
