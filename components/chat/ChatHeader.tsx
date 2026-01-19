// /components/chat/ChatHeader.tsx
"use client";

import { Bot, Menu, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useChat } from "@/context/ChatContext";
import { SimpleThemeToggle } from "../shared/ThemeToggle";

interface ChatHeaderProps {
  showNewChatButton?: boolean;
  showCloseButton?: boolean;
}

export function ChatHeader({ 
  showNewChatButton = true, 
  showCloseButton = true 
}: ChatHeaderProps) {
  const { setSidebarOpen, handleNewChat } = useChat();

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 lg:z-50 bg-white dark:bg-black backdrop-blur supports-backdrop-filter:bg-white/60 dark:supports-backdrop-filter:bg-black/60 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center lg:hidden">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-none text-slate-900 dark:text-white">
                CityCare AI
              </h1>
              <Badge
                variant="outline"
                className="mt-1 h-4 px-1.5 text-[10px] border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400 dark:bg-green-500/20"
              >
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1" />
                Online
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <SimpleThemeToggle />
          {showNewChatButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleNewChat()}
              title="New chat"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          {showCloseButton && (
            <a href="/" className="hidden lg:block">
              <Button variant="ghost" size="icon" title="Close chat">
                <X className="h-5 w-5" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}