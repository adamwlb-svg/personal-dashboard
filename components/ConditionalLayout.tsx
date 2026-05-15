"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { GlobalSearch } from "./GlobalSearch";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden bg-surface flex flex-col">
        {children}
      </main>
      <GlobalSearch />
    </div>
  );
}
