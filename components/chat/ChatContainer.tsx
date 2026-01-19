// /components/chat/ChatContainer.tsx
"use client";

import { ReactNode, useRef, useEffect } from "react";

interface ChatContainerProps {
  children: ReactNode;
  dependencies?: any[];
}

export function ChatContainer({ children, dependencies = [] }: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: dependencies.length <= 1 ? "auto" : "smooth",
    });
  }, dependencies);

  return (
    <div
      ref={scrollRef}
      className="fixed top-14 right-0 bottom-35 left-0 lg:left-64 overflow-y-auto overflow-x-hidden bg-background"
    >
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 w-full">
        {children}
      </div>
    </div>
  );
}