// /chat/layout.tsx
import Sidebar from "@/components/shared/Sidebar";
import { ChatProvider } from "@/context/ChatContext";
import { ChatAuthGuard } from "@/components/chat/ChatAuthGuard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatAuthGuard>
      <ChatProvider>
        <div className="min-h-screen flex bg-background text-foreground">
          {/* Sidebar */}
          <Sidebar />

          {/* Chat Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </ChatProvider>
    </ChatAuthGuard>
  );
}