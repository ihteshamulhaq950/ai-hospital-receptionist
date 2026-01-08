// /chat/layout.tsx
import Sidebar from "@/components/shared/Sidebar";
import { ChatProvider } from "@/context/ChatContext";
import { ChatAuthGuard } from "@/components/chat/ChatAuthGuard";
// import { AuthProvider } from "@/provider/AuthContext";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <AuthProvider>
      <ChatAuthGuard>
        <ChatProvider>
          <div className="flex h-dvh bg-slate-50 font-sans relative">
            <Sidebar />
            {children}
          </div>
        </ChatProvider>
      </ChatAuthGuard>
    // {/* </AuthProvider> */}
  );
}
