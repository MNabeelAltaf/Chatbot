"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatToken, setChatToken] = useState<string>("");


  useEffect(() => {
    const storedSettings = localStorage.getItem("settingsData");
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      if (settings.chat_token) setChatToken(settings.chat_token);
    }
  }, []);

  return (
    <div className="flex h-screen w-screen bg-[#101828] text-white overflow-hidden">

      <aside className="hidden md:flex w-64 bg-[#1E293B] border-r border-gray-700 p-5 flex-col gap-3">
        <h2 className="text-xl font-bold mb-4">Dashboard</h2>

        <NavLink
          href={`/chat${chatToken ? `?chat_token=${chatToken}` : ""}`}
          pathname={pathname}
          label="Chat"
        />
        <NavLink href="/subscription" pathname={pathname} label="Subscriptions" />
        <NavLink href="/settings" pathname={pathname} label="Settings" />
      </aside>


      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-64 bg-[#1E293B] p-5 border-r border-gray-700 z-50 flex flex-col gap-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Dashboard</h2>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            <NavLink
              href={`/chat${chatToken ? `?chat_token=${chatToken}` : ""}`}
              pathname={pathname}
              label="Chat"
              onClick={() => setSidebarOpen(false)}
            />
            <NavLink
              href="/subscription"
              pathname={pathname}
              label="Subscriptions"
              onClick={() => setSidebarOpen(false)}
            />
            <NavLink
              href="/settings"
              pathname={pathname}
              label="Settings"
              onClick={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

    
      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between bg-[#1E293B] p-4 border-b border-gray-700">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6 text-white" />
          </button>
          <h2 className="text-lg font-semibold">Dashboard</h2>
          <div className="w-6" />
        </header>

        <main className="flex-1 p-4 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  pathname,
  label,
  onClick,
}: {
  href: string;
  pathname: string;
  label: string;
  onClick?: () => void;
}) {
  const isActive = pathname === href || pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block px-3 py-2 rounded-lg transition ${
        isActive ? "bg-indigo-600" : "hover:bg-gray-700 text-gray-300 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}
