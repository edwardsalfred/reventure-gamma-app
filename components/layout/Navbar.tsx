"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface NavbarProps {
  username: string;
  role: string;
}

export function Navbar({ username, role }: NavbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900">Reventure AI</span>
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Meetings
            </Link>
            {role === "admin" && (
              <Link
                href="/admin/users"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Users
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">{username}</span>
              {role === "admin" && (
                <span className="ml-1.5 text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                  Admin
                </span>
              )}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
