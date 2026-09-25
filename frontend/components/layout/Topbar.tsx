"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Menu, Mic, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/common/Button";
import { NAV_ITEMS } from "@/components/layout/navItems";
import { CreateMeetingModal } from "@/components/meetings/CreateMeetingModal";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { userService } from "@/services/searchService";

const PAGE_TITLES: Record<string, string> = {
  "/": "Home",
  "/meetings": "Meetings",
  "/search": "Search",
  "/tags": "Tags",
  "/settings": "Settings",
};

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/meetings/")) return "Meeting Details";
  return "MeetingNotes";
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { data: currentUser } = useQuery({
    queryKey: queryKeys.currentUser(),
    queryFn: userService.me,
  });

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    if (searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-950 md:px-6">
        <button
          type="button"
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 focus-ring dark:hover:bg-gray-800 md:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <p className="hidden shrink-0 text-base font-semibold text-gray-900 dark:text-gray-50 sm:block">
          {resolveTitle(pathname)}
        </p>

        <form onSubmit={handleSearchSubmit} className="ml-2 flex-1 max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search meetings, transcripts, action items…"
              aria-label="Global search"
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus-ring focus:border-brand-400 focus:bg-white dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-3">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Meeting</span>
          </Button>
          <Link href="/settings" aria-label="Profile settings">
            <Avatar name={currentUser?.name ?? "Anshika Chauhan"} avatarUrl={currentUser?.avatar_url} size={32} />
          </Link>
        </div>
      </header>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full w-64 flex-col bg-white dark:bg-gray-950">
            <div className="flex h-14 items-center justify-between border-b border-gray-100 px-4 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                  <Mic className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">MeetingNotes</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation menu"
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-2">
              {NAV_ITEMS.map((item) => {
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                      isActive
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <CreateMeetingModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
