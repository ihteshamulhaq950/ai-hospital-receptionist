// /components/chat/TypingIndicator.tsx
"use client";

import { Bot, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TypingIndicatorProps {
  streamProgress?: string | null;
}

export function TypingIndicator({ streamProgress }: TypingIndicatorProps) {
  return (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-left-5 duration-300">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-slate-100 dark:bg-primary shadow-md relative">
        <Bot className="w-4 h-4 text-slate-900 dark:text-primary-foreground" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-background" />
      </div>
      <Card className="px-4 py-3 rounded-2xl rounded-tl-md shadow-md max-w-[80%] md:max-w-[70%]">
        <div className="flex items-center gap-3">
          {!streamProgress ? (
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-slate-400 dark:bg-primary/60 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-slate-400 dark:bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 bg-slate-400 dark:bg-primary/60 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm text-foreground font-medium">
                {streamProgress}
              </span>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}