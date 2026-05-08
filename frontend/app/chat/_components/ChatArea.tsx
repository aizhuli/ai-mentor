"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import MessageBubble from "./MessageBubble";
import EmptyState from "./EmptyState";
import type { Message } from "@/lib/api";

interface Props {
  activeSessionId: number | null;
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
  onSend: (content: string) => void;
}

export default function ChatArea({
  activeSessionId,
  messages,
  streamingContent,
  isStreaming,
  onSend,
}: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll when messages or streaming content change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming || activeSessionId === null) return;
    setInput("");
    onSend(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  const hasMessages = messages.length > 0 || streamingContent.length > 0;

  // The virtual streaming message shown while the assistant is responding
  const streamingMessage: Message | null =
    isStreaming && streamingContent
      ? {
          id: -1,
          role: "assistant",
          content: streamingContent,
          createdAt: new Date().toISOString(),
        }
      : null;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Message area */}
      <div className="flex-1 overflow-y-auto p-6">
        {!hasMessages ? (
          <EmptyState
            hasSession={activeSessionId !== null}
            onStarterClick={(prompt) => {
              if (activeSessionId !== null) onSend(prompt);
            }}
          />
        ) : (
          <>
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {streamingMessage && (
              <MessageBubble message={streamingMessage} streaming />
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      {activeSessionId !== null && (
        <div
          className="flex-none border-t-2 border-crimson"
          style={{ background: "#B5A48A" }}
        >
          <form onSubmit={handleSubmit} className="flex items-end gap-0">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              rows={1}
              placeholder={
                isStreaming ? "Receiving response…" : "Ask about nuclear engineering… (Enter to send, Shift+Enter for newline)"
              }
              className="flex-1 resize-none bg-transparent text-crimson placeholder-slate font-body text-sm px-4 py-3 focus:outline-none disabled:opacity-50"
              style={{
                maxHeight: "120px",
                overflowY: "auto",
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 120) + "px";
              }}
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="flex-none bg-teal text-cream font-heading text-xl px-5 py-3 h-full hover:bg-teal-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-stretch flex items-center"
              style={{ letterSpacing: "0.05em" }}
              title="Send (Enter)"
            >
              {isStreaming ? (
                <span className="inline-block w-4 h-4 border-2 border-cream border-t-transparent animate-spin" />
              ) : (
                "▶"
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
