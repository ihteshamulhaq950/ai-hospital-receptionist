"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Upload,
  Menu,
  X,
  Activity,
  BarChart3,
  MessageSquare,
  Home,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { Button } from "@/components/ui/button";
import { SimpleThemeToggle } from "../shared/ThemeToggle";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Embedded PDFs", href: "/dashboard/pdf", icon: FileText },
  { name: "Upload PDF", href: "/dashboard/upload", icon: Upload },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Chat", href: "/chat", icon: MessageSquare },
];

export function DashboardSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { userClaims } = useAuth();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle swipe gestures
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      // Swipe from left edge to right (open sidebar)
      if (
        touchStartX.current < 50 &&
        touchEndX.current - touchStartX.current > 100
      ) {
        setIsOpen(true);
      }

      // Swipe from right to left (close sidebar)
      if (isOpen && touchStartX.current - touchEndX.current > 100) {
        setIsOpen(false);
      }
    };

    // Only add listeners on mobile
    if (window.innerWidth < 1024) {
      document.addEventListener("touchstart", handleTouchStart);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isOpen]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle sign out
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
      } else {
        router.push("/login");
      }
    } catch (err) {
      console.error("Unexpected sign out error:", err);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <>
      {/* Mobile Header - Fixed at top with HIGHEST z-index */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b border-border">
        <div className="flex items-center h-full px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 ml-3">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-sm font-semibold">Hospital RAG</span>
          </div>
        </div>
      </header>

      {/* Mobile Overlay - Lower z-index than header */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Between overlay and header */}
      <aside
        className={cn(
          // Mobile: fixed overlay that slides in
          "fixed top-0 left-0 bottom-0 z-40",
          "w-64 h-screen",
          // Desktop: fixed sidebar (doesn't scroll with content)
          "lg:fixed lg:left-0 lg:top-0 lg:bottom-0",
          "bg-sidebar border-r border-sidebar-border",
          // Mobile animation
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
            <div className="flex items-center gap-2">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-lg font-semibold text-sidebar-foreground">
                  Hospital RAG
                </h1>
                <p className="text-xs text-muted-foreground">Admin Dashboard</p>
              </div>
            </div>

            {/* Close button - Only visible on mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border p-4 space-y-3">
            {/* User Info */}
            {userClaims && (
              <div className="rounded-lg bg-sidebar-accent/30 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-sidebar-foreground truncate">
                      {userClaims ? userClaims.email : "Admin User"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Administrator
                    </p>
                  </div>
                </div>
                
                {/* Sign Out Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full justify-start text-xs h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  {isSigningOut ? "Signing out..." : "Sign Out"}
                </Button>
              </div>
            )}

            {/* Storage Status */}
            <div className="rounded-lg bg-sidebar-accent/50 p-3">
              <p className="text-xs font-medium text-sidebar-foreground">
                Storage Status
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                24 PDFs embedded
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-sidebar-border">
                <div className="h-full w-3/4 rounded-full bg-primary" />
              </div>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-sidebar-foreground">
                Theme
              </span>
              <SimpleThemeToggle />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// "use client";

// import { useState, useEffect, useRef } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import {
//   LayoutDashboard,
//   FileText,
//   Upload,
//   Menu,
//   X,
//   Activity,
//   BarChart3,
//   MessageSquare,
//   Home,
// } from "lucide-react";
// import { cn } from "@/lib/utils/utils";
// import { Button } from "@/components/ui/button";
// import { SimpleThemeToggle } from "../shared/ThemeToggle";

// const navigation = [
//   { name: "Home", href: "/", icon: Home },
//   { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
//   { name: "Embedded PDFs", href: "/dashboard/pdf", icon: FileText },
//   { name: "Upload PDF", href: "/dashboard/upload", icon: Upload },
//   { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
//   { name: "Chat", href: "/chat", icon: MessageSquare },
// ];

// export function DashboardSidebar() {
//   const [isOpen, setIsOpen] = useState(false);
//   const pathname = usePathname();
//   const touchStartX = useRef(0);
//   const touchEndX = useRef(0);

//   // Close sidebar when route changes (mobile)
//   useEffect(() => {
//     setIsOpen(false);
//   }, [pathname]);

//   // Handle swipe gestures
//   useEffect(() => {
//     const handleTouchStart = (e: TouchEvent) => {
//       touchStartX.current = e.touches[0].clientX;
//     };

//     const handleTouchMove = (e: TouchEvent) => {
//       touchEndX.current = e.touches[0].clientX;
//     };

//     const handleTouchEnd = () => {
//       // Swipe from left edge to right (open sidebar)
//       if (
//         touchStartX.current < 50 &&
//         touchEndX.current - touchStartX.current > 100
//       ) {
//         setIsOpen(true);
//       }

//       // Swipe from right to left (close sidebar)
//       if (isOpen && touchStartX.current - touchEndX.current > 100) {
//         setIsOpen(false);
//       }
//     };

//     // Only add listeners on mobile
//     if (window.innerWidth < 1024) {
//       document.addEventListener("touchstart", handleTouchStart);
//       document.addEventListener("touchmove", handleTouchMove);
//       document.addEventListener("touchend", handleTouchEnd);
//     }

//     return () => {
//       document.removeEventListener("touchstart", handleTouchStart);
//       document.removeEventListener("touchmove", handleTouchMove);
//       document.removeEventListener("touchend", handleTouchEnd);
//     };
//   }, [isOpen]);

//   // Prevent body scroll when sidebar is open on mobile
//   useEffect(() => {
//     if (isOpen) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'unset';
//     }
//     return () => {
//       document.body.style.overflow = 'unset';
//     };
//   }, [isOpen]);

//   return (
//     <>
//       {/* Mobile Header - Fixed at top with HIGHEST z-index */}
//       <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b border-border">
//         <div className="flex items-center h-full px-4">
//           <Button
//             variant="ghost"
//             size="icon"
//             onClick={() => setIsOpen(true)}
//             aria-label="Open menu"
//           >
//             <Menu className="h-5 w-5" />
//           </Button>
//           <div className="flex items-center gap-2 ml-3">
//             <Activity className="h-6 w-6 text-primary" />
//             <span className="text-sm font-semibold">Hospital RAG</span>
//           </div>
//         </div>
//       </header>

//       {/* Mobile Overlay - Lower z-index than header */}
//       {isOpen && (
//         <div
//           className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
//           onClick={() => setIsOpen(false)}
//           aria-hidden="true"
//         />
//       )}

//       {/* Sidebar - Between overlay and header */}
//       <aside
//         className={cn(
//           // Mobile: fixed overlay that slides in
//           "fixed top-0 left-0 bottom-0 z-40",
//           "w-64 h-screen",
//           // Desktop: fixed sidebar (doesn't scroll with content)
//           "lg:fixed lg:left-0 lg:top-0 lg:bottom-0",
//           "bg-sidebar border-r border-sidebar-border",
//           // Mobile animation
//           "transform transition-transform duration-300 ease-in-out",
//           isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
//         )}
//       >
//         <div className="flex h-full flex-col">
//           {/* Logo/Brand */}
//           <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
//             <div className="flex items-center gap-2">
//               <Activity className="h-8 w-8 text-primary" />
//               <div>
//                 <h1 className="text-lg font-semibold text-sidebar-foreground">
//                   Hospital RAG
//                 </h1>
//                 <p className="text-xs text-muted-foreground">Admin Dashboard</p>
//               </div>
//             </div>

//             {/* Close button - Only visible on mobile */}
//             <Button
//               variant="ghost"
//               size="icon"
//               className="lg:hidden"
//               onClick={() => setIsOpen(false)}
//               aria-label="Close menu"
//             >
//               <X className="h-5 w-5" />
//             </Button>
//           </div>

//           {/* Navigation */}
//           <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
//             {navigation.map((item) => {
//               const isActive = pathname === item.href;
//               return (
//                 <Link
//                   key={item.name}
//                   href={item.href}
//                   onClick={() => setIsOpen(false)}
//                   className={cn(
//                     "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
//                     isActive
//                       ? "bg-sidebar-accent text-sidebar-accent-foreground"
//                       : "text-sidebar-foreground hover:bg-sidebar-accent/50"
//                   )}
//                 >
//                   <item.icon className="h-5 w-5" />
//                   {item.name}
//                 </Link>
//               );
//             })}
//           </nav>

//           {/* Footer */}
//           <div className="border-t border-sidebar-border p-4">
//             <div className="rounded-lg bg-sidebar-accent/50 p-3">
//               <p className="text-xs font-medium text-sidebar-foreground">
//                 Storage Status
//               </p>
//               <p className="mt-1 text-xs text-muted-foreground">
//                 24 PDFs embedded
//               </p>
//               <div className="mt-2 h-1.5 rounded-full bg-sidebar-border">
//                 <div className="h-full w-3/4 rounded-full bg-primary" />
//               </div>
//             </div>
//             {/* Theme Toggle */}
//             <div className="flex items-center justify-between mt-3">
//               <span className="text-xs font-medium text-sidebar-foreground">
//                 Theme
//               </span>
//               <SimpleThemeToggle />
//             </div>
//           </div>
//         </div>
//       </aside>
//     </>
//   );
// }
