"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "./AuthContext";
import { useRouter } from "next/navigation";
import { Message } from "@/types/chat";


interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  input: string;
  setInput: (input: string) => void;
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
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType);
export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
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
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

