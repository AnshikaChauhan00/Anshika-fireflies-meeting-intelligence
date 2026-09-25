"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronsLeft, ChevronsRight, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { userService } from "@/services/searchService";
import { NAV_ITEMS } from "@/components/layout/navItems";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: currentUser } = useQuery({
    queryKey: queryKeys.currentUser(),
    queryFn: userService.me,
  });

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-200 dark:border-gray-800 dark:bg-gray-950 md:flex",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-gray-100 px-4 dark:border-gray-800">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Mic className="h-4 w-4" aria-hidden="true" />
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
            MeetingNotes
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-ring",
                isActive
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-3 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="mb-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-100 focus-ring dark:hover:bg-gray-800"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
        <Link
          href="/settings"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 focus-ring dark:hover:bg-gray-800"
        >
          <Avatar name={currentUser?.name ?? "Anshika Chauhan"} avatarUrl={currentUser?.avatar_url} size={30} />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                {currentUser?.name ?? "Anshika Chauhan"}
              </p>
              <p className="truncate text-xs text-gray-400">{currentUser?.email ?? ""}</p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
