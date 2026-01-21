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
    <DashboardAuthGuard>
      <div className="min-h-screen">
        {/* Fixed Sidebar */}
        <DashboardSidebar />
        
        {/* Main content - pushed right on desktop */}
        <main className="min-h-screen lg:ml-64">
          {/* Mobile: add top padding for fixed header */}
          <div className="pt-14 lg:pt-0">
            <div className="container mx-auto p-6 lg:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </DashboardAuthGuard>
  );
}

// import React from "react";
// import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
// import { DashboardAuthGuard } from "@/components/dashboard/DashboardAuthGuard";
// import { Metadata } from "next";

// export const metadata: Metadata = {
//   robots: {
//     index: false,
//     follow: false,
//   },
// };

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     // <AuthProvider>
//       <DashboardAuthGuard>
//         {/* <ChatProvider> */}
//           <div className="flex min-h-screen">
//             <DashboardSidebar />
//             <main className="flex-1 lg:ml-64">
//               <div className="container mx-auto p-6 lg:p-8">{children}</div>
//             </main>
//           </div>
//         {/* </ChatProvider> */}
//       </DashboardAuthGuard>
//     // </AuthProvider>
//   );
// }
