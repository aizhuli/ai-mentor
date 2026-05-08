"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { Message } from "@/lib/api";

interface Props {
  message: Message;
  /** When true, shows a blinking cursor at the end (streaming state) */
  streaming?: boolean;
}

export default function MessageBubble({ message, streaming }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[75%] px-4 py-3 ${
          isUser
            ? "bg-crimson text-cream"
            : "bg-slate text-cream"
        }`}
        style={{ boxShadow: "2px 2px 0 rgba(0,0,0,0.25)" }}
      >
        {/* Role label */}
        <p
          className={`font-heading text-xs tracking-widest mb-2 ${
            isUser ? "text-sand text-right" : "text-teal"
          }`}
          style={{ letterSpacing: "0.12em" }}
        >
          {isUser ? "YOU" : "NUCLEAR MENTOR"}
        </p>

        {/* Content with markdown + LaTeX */}
        <div className="prose-nuclear font-body text-sm leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              // Style code blocks
              code({ children, className }) {
                const isBlock = className?.startsWith("language-");
                if (isBlock) {
                  return (
                    <pre className="bg-black bg-opacity-30 px-3 py-2 overflow-x-auto text-xs font-mono my-2">
                      <code className={className}>{children}</code>
                    </pre>
                  );
                }
                return (
                  <code className="bg-black bg-opacity-20 px-1 text-xs font-mono">
                    {children}
                  </code>
                );
              },
              // Paragraphs
              p({ children }) {
                return <p className="mb-2 last:mb-0">{children}</p>;
              },
              // Headings
              h1({ children }) {
                return (
                  <h1 className="font-heading text-xl tracking-widest mt-3 mb-1">
                    {children}
                  </h1>
                );
              },
              h2({ children }) {
                return (
                  <h2 className="font-heading text-lg tracking-widest mt-3 mb-1">
                    {children}
                  </h2>
                );
              },
              h3({ children }) {
                return (
                  <h3 className="font-heading text-base tracking-wider mt-2 mb-1">
                    {children}
                  </h3>
                );
              },
              // Lists
              ul({ children }) {
                return <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>;
              },
              ol({ children }) {
                return (
                  <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>
                );
              },
              // Strong
              strong({ children }) {
                return <strong className="font-semibold">{children}</strong>;
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
          {streaming && (
            <span className="inline-block w-2 h-4 bg-cream opacity-75 animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      </div>
    </div>
  );
}
