// /chat/[sessionId]/page.tsx
"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useChat } from "@/context/ChatContext";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Message } from "@/types/chat";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";

export default function ChatDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const {
    messages,
    isAssistantTyping,
    input,
    setInput,
    loadingMessages,
    handleSendMessage,
    handleStreamResponse,
    streamProgress,
    error,
    getChatMessagesById,
    setMessages,
  } = useChat();

  // Handle session initialization
  useEffect(() => {
    if (!sessionId) return;

    console.log("Chat Detail Page: Session effect triggered", sessionId);

    const pendingKey = `pending_msg_${sessionId}`;
    const pendingRawMessage = sessionStorage.getItem(pendingKey);

    if (pendingRawMessage) {
      console.log("Chat Detail Page: First message detected → SSE start");

      try {
        const pendingMsg = JSON.parse(pendingRawMessage) as Message;

        if (!pendingMsg.content_text?.trim()) {
          console.error(
            "Chat Detail Page: Invalid pending message - missing content_text",
          );
          throw new Error("Invalid pending message");
        }

        sessionStorage.removeItem(pendingKey);
        setMessages([pendingMsg]);

        console.time("Chat Detail Page: FIRST_MESSAGE_STREAM");
        handleStreamResponse(pendingMsg.content_text, sessionId);
      } catch (error: unknown) {
        console.error("Chat Detail Page: Failed to parse pending message", error);
        sessionStorage.removeItem(pendingKey);
        getChatMessagesById(sessionId);
      }
    } else {
      console.log("Chat Detail Page: Existing session → loading messages");
      getChatMessagesById(sessionId);
    }
  }, [sessionId]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-black">
      <ChatHeader showNewChatButton showCloseButton />

      <ChatContainer dependencies={[messages, isAssistantTyping]}>
        {loadingMessages && messages.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-600 dark:text-slate-400">Loading messages...</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg: Message, index) => {
              const timestamp = new Date(msg.created_at);
              const suggestions = Array.isArray(msg.content_json)
                ? msg.content_json
                : [];
              const contextUsed = msg.context_used?.map(source => ({
                ...source,
                page: source.page ?? undefined,
              }));

              return (
                <MessageBubble
                  key={msg.id || index}
                  role={msg.role}
                  content={msg.content_text}
                  timestamp={timestamp}
                  suggestions={msg.role === "assistant" ? suggestions : undefined}
                  contextUsed={contextUsed}
                  onSuggestionClick={setInput}
                />
              );
            })}

            {isAssistantTyping && <TypingIndicator streamProgress={streamProgress} />}

            {error && (
              <Alert
                variant="destructive"
                className="animate-in fade-in slide-in-from-bottom-5 duration-300 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50"
              >
                <AlertCircle className="h-4 w-4 text-red-800 dark:text-red-400" />
                <AlertDescription className="text-sm text-red-800 dark:text-red-400">{error}</AlertDescription>
              </Alert>
            )}
          </>
        )}
      </ChatContainer>

      <ChatInput
        input={input}
        setInput={setInput}
        onSend={() => handleSendMessage(input, sessionId)}
        disabled={isAssistantTyping || loadingMessages}
        isLoading={isAssistantTyping}
      />
    </div>
  );
}