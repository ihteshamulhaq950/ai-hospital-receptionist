// /components/chat/ChatInput.tsx
"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: (e?: React.FormEvent) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({
  input,
  setInput,
  onSend,
  disabled = false,
  isLoading = false,
  placeholder = "Type your message...",
}: ChatInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div
      className="
        fixed inset-x-0 bottom-0 lg:left-64
        border-t border-border
        bg-background/95 backdrop-blur
        supports-backdrop-filter:bg-background/80
      "
    >
      <div className="mx-auto max-w-4xl px-4 py-3 space-y-2">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="
              h-11 flex-1 rounded-2xl
              bg-background
              text-foreground
              border-border
              placeholder:text-muted-foreground
              focus-visible:ring-2
              focus-visible:ring-ring
              focus-visible:ring-offset-2
              focus-visible:ring-offset-background
            "
          />

          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || disabled}
            className="
              h-11 w-11 rounded-xl
              bg-primary text-primary-foreground
              hover:bg-primary/90
              disabled:opacity-50
              disabled:pointer-events-none
            "
          >
            {isLoading ? (
              <span
                className="
                  h-4 w-4 animate-spin rounded-full
                  border-2 border-current border-t-transparent
                "
              />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>

        <p className="text-[10px] text-center text-muted-foreground">
          CityCare AI may provide general information. For emergencies, call 911.
        </p>
      </div>
    </div>
  );
}
