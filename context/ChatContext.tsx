"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Message } from "@/types/chat";


interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  input: string;
  setInput: (input: string) => void;
  streamProgress: string;
  setStreamProgress: React.Dispatch<React.SetStateAction<string>>;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAssistantTyping: boolean;
  setIsAssistantTyping: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  loadingMessages: boolean;
  currentSessionId: string | undefined;
  getChatMessagesById: (sessionId?: string) => Promise<void>;
  handleNewChat: () => void;
  handleSelectSession: (id: string, sessionId?: string) => void;
  handleSendMessage: (content: string, sessionId: string) => Promise<void>;
  handleStreamResponse: (userContent: string, chatSessionId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType);
export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
    undefined
  );
    const [streamProgress, setStreamProgress] = useState<string>("");

  const loadedSessionRef = useRef<string | undefined>(undefined);

  /**
   * Load all messages for a chat session
   * No parsing needed - new schema stores data correctly
   */
  const getChatMessagesById = useCallback(async (sessionId?: string) => {
    if (loadedSessionRef.current === sessionId) return;

    console.log("Loading messages for session:", sessionId);

    loadedSessionRef.current = sessionId;
    setCurrentSessionId(sessionId);
    setMessages([]);
    setLoadingMessages(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to load messages:", error);
        setError("Failed to load messages");
      } else if (data) {
        console.log(`✅ Loaded ${data.length} messages for session ${sessionId}`);
        
        // No parsing needed! New schema already has:
        // - content_text: string (plain text)
        // - content_json: string[] (suggestions array)
        setMessages(data as Message[]);
      }
    } catch (err:unknown) {
      console.error("Failed to load messages:", err);
      setError("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  /**
   * Start a new chat - clears all state and navigates to empty chat
   */
  const handleNewChat = useCallback(() => {
    if (isAssistantTyping) return;

    console.log("Starting new chat...");

    // Clean up all state
    setMessages([]);
    setInput("");
    setError(null);
    setIsAssistantTyping(false);
    setLoadingMessages(false);
    setCurrentSessionId(undefined);
    loadedSessionRef.current = undefined;

    // Navigate to empty chat page
    router.replace("/chat");
  }, [isAssistantTyping, router]);

  /**
   * Select an existing chat session from sidebar
   */
  const handleSelectSession = useCallback(
    (id: string, sessionId?: string) => {
      if (id === sessionId) {
        console.log("Already on this session, skipping navigation");
        return;
      }

      console.log(`Switching to session: ${id}`);

      // Clear error and input, but let the new page load messages
      setError(null);
      setInput("");
      setIsAssistantTyping(false);

      // Navigate to selected chat
      router.replace(`/chat/${id}`);
    },
    [router]
  );




// handleStreamResponse: handles the SSE connection and message streaming
  const handleStreamResponse = useCallback(
    async (userContent: string, chatSessionId: string) => {
      // Add validation at the start
      if (!userContent || typeof userContent !== "string") {
        console.error(
          "Chat Detail Page :📞 Invalid userContent passed to handleStreamResponse",
          {
            userContent,
            type: typeof userContent,
          },
        );
        setError("Invalid message content");
        setIsAssistantTyping(false);
        return;
      }

      console.log("Chat Detail Page :📞 Starting streaming query", {
        chatSessionId,
        contentLength: userContent.length,
      });

      setIsAssistantTyping(true);
      setError(null);
      setStreamProgress("Connecting...");

      try {
        console.time("Chat Detail Page :📞 SSE_CONNECTION");

        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: userContent,
            chatSessionId,
          }),
        });

        if (!response.ok) {
          console.error("Chat Detail Page :📞 SSE HTTP error", response.status);
          const errorText = await response.text();
          console.error("Chat Detail Page :📞 Error response:", errorText);
          throw new Error(`HTTP ${response.status}`);
        }

        console.timeEnd("Chat Detail Page :📞 SSE_CONNECTION");

        const reader = response.body?.getReader();

        if (!reader) {
          console.error("Chat Detail Page :📞 No readable stream");
          throw new Error("No readable body");
        }

        const decoder = new TextDecoder();
        let assistantMessageAdded = false;
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log("Chat Detail Page :📞 SSE stream closed");
            break;
          }

          // Decode chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Split by double newline (SSE message separator)
          const messages = buffer.split("\n\n");

          // Keep the last incomplete message in buffer
          buffer = messages.pop() || "";

          // Process complete messages
          for (const message of messages) {
            if (!message.trim()) continue;

            const lines = message.split("\n");
            let eventType = "";
            let data = "";

            // Parse event and data from the message
            for (const line of lines) {
              if (line.startsWith("event:")) {
                eventType = line.replace("event:", "").trim();
              } else if (line.startsWith("data:")) {
                data = line.replace("data:", "").trim();
              }
            }

            if (!eventType || !data) {
              console.warn("Chat Detail Page :📞 Incomplete SSE message:", {
                eventType,
                data,
              });
              continue;
            }

            try {
              const parsedData = JSON.parse(data);
              console.log(
                "Chat Detail Page :📞 SSE event:",
                eventType,
                parsedData,
              );

              switch (eventType) {
                case "progress":
                  setStreamProgress(parsedData.message || "Processing...");
                  break;

                case "assistant_response":
                  if (!assistantMessageAdded) {
                    console.log(
                      "Chat Detail Page :📞 Assistant message received",
                      {
                        contentLength: parsedData.content_text?.length,
                        contextCount: parsedData.context_used?.length,
                      },
                    );

                    const assistantMsg: Message = {
                      id: `temp-assistant-${Date.now()}`,
                      chat_session_id: chatSessionId,
                      role: "assistant",
                      content_text: parsedData.content_text || "",
                      content_json: parsedData.content_json || [],
                      context_used: parsedData.context_used || [],
                      created_at: new Date().toISOString(),
                    };

                    setMessages((prev) => [...prev, assistantMsg]);
                    assistantMessageAdded = true;
                    setIsAssistantTyping(false);
                    setStreamProgress("");
                  }
                  break;

                case "complete":
                  console.log("Chat Detail Page :📞 SSE completed");
                  setIsAssistantTyping(false);
                  setStreamProgress("");
                  break;

                case "error":
                  console.error(
                    "Chat Detail Page :📞 SSE error event",
                    parsedData,
                  );
                  setError(parsedData.message || "An error occurred");
                  setIsAssistantTyping(false);
                  setStreamProgress("");
                  break;

                default:
                  console.warn(
                    "Chat Detail Page :📞 Unknown SSE event type:",
                    eventType,
                  );
              }
            } catch (parseError) {
              console.error("Chat Detail Page :📞 Failed to parse SSE data:", {
                data,
                error: parseError,
              });
            }
          }
        }

        // Final cleanup
        setIsAssistantTyping(false);
        setStreamProgress("");
      } catch (err) {
        console.error("Chat Detail Page :📞 Streaming failure", err);
        setError("Failed to connect to chat service. Please try again.");
        setIsAssistantTyping(false);
        setStreamProgress("");
      }
    },
    [setMessages, setIsAssistantTyping, setError],
  );

  // SEND MESSAGE
  const handleSendMessage = useCallback(async (content: string, sessionId: string) => {

    if (!sessionId || !content.trim() || isAssistantTyping) {
      console.warn("Chat Detail Page :📞 Send blocked", {
        empty: !content.trim(),
        isAssistantTyping,
      });
      return;
    }

    const userContent = content.trim();

    console.log("Chat Detail Page :📞 Sending message", userContent);

    const optimisticUserMsg: Message = {
      id: `temp-user-${Date.now()}`,
      chat_session_id: sessionId,
      role: "user",
      content_text: userContent,
      content_json: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);

    await handleStreamResponse(userContent, sessionId);
  }, []);

  const value: ChatContextType = {
    messages,
    setMessages,
    input,
    setInput,
    sidebarOpen,
    setSidebarOpen,
    isAssistantTyping,
    setIsAssistantTyping,
    error,
    setError,
    loadingMessages,
    currentSessionId,
    getChatMessagesById,
    handleNewChat,
    handleSelectSession,
    handleSendMessage,
    handleStreamResponse,
    streamProgress,
    setStreamProgress,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

