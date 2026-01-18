"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/context/ChatContext";
import { Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message } from "@/types/chat";

export default function EmptyChatPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setIsAssistantTyping } = useChat();

  const handleSendFirstChatMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim() || isLoading) return;

    const content = input.trim();

    // Create optimistic user message
    const optimisticUserMessage: Message = {
      id: `temp-user-${Date.now()}`,
      chat_session_id: "temp",
      role: "user",
      content_text: content,
      content_json: [],
      created_at: new Date().toISOString(),
    };

    setInput("");
    setIsLoading(true);
    setIsAssistantTyping(true);
    setError(null);

    try {
      // Create session and save first user message
      const res = await fetch("/api/chat/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // body: JSON.stringify({ content }),
      });

      const data = await res.json();

      if (!res.ok || !data.sessionId) {
        throw new Error(data.error || "Failed to start chat");
      }

      // Store pending message for the chat detail page
      sessionStorage.setItem(
        `pending_msg_${data.sessionId}`,
        JSON.stringify(optimisticUserMessage)
      );

      // Dispatch event to refresh sidebar
      window.dispatchEvent(new Event("chatCreated"));

      // Navigate to chat page - it will handle the streaming
      router.replace(`/chat/${data.sessionId}`);
    } catch (err) {
      console.error("Error starting chat:", err);
      setError("Network error. Please try again.");
      setIsAssistantTyping(false);
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "What services does CityCare offer?",
    "How do I schedule an appointment?",
    "What are your visiting hours?",
    "Do you accept my insurance?",
  ];

  return (
    <div className="flex flex-col flex-1 min-w-0 h-dvh">
      {/* Header */}
      <header className="bg-white border-b px-4 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-none">
              CityCare AI
            </h1>
            <span className="text-[10px] text-green-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </header>

      {/* Welcome Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Welcome to CityCare AI
              </h2>
              <p className="text-slate-600 text-sm">
                Ask me anything about our hospital services, appointments, or
                general health questions.
              </p>
            </div>
          </div>

          {/* Suggested Questions */}
          <div className="mt-8">
            <p className="text-xs font-medium text-slate-500 mb-3">
              Try asking:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestedQuestions.map((question, i) => (
                <button
                  key={i}
                  onClick={() => setInput(question)}
                  disabled={isLoading}
                  className="text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm text-slate-700 disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t sticky bottom-0">
        <div className="max-w-2xl mx-auto space-y-4">
          <form
            onSubmit={handleSendFirstChatMessage}
            className="relative flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendFirstChatMessage();
                }
              }}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-xl h-11 w-11 shrink-0 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>

          <p className="text-[10px] text-center text-slate-400">
            CityCare AI may provide general info. For emergencies, call 911.
          </p>
        </div>
      </div>
    </div>
  );
}