import React from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardAuthGuard } from "@/components/dashboard/DashboardAuthGuard";
import { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <AuthProvider>
      <DashboardAuthGuard>
        {/* <ChatProvider> */}
          <div className="flex min-h-screen">
            <DashboardSidebar />
            <main className="flex-1 lg:ml-64">
              <div className="container mx-auto p-6 lg:p-8">{children}</div>
            </main>
          </div>
        {/* </ChatProvider> */}
      </DashboardAuthGuard>
    // </AuthProvider>
  );
}
