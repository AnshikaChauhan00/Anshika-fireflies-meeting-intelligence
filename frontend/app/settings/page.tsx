"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, Link2, Palette, User } from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";
import { userService } from "@/services/searchService";
import { Avatar } from "@/components/common/Avatar";
import { Badge } from "@/components/common/Badge";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Skeleton } from "@/components/common/LoadingSkeleton";

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof User;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand-600" />
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">{title}</h2>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

const INTEGRATIONS = [
  "Live Meeting Bot",
  "Zoom Integration",
  "Google Meet Integration",
  "Calendar Integration",
  "CRM Integrations",
  "Team Collaboration",
];

export default function SettingsPage() {
  const { data: currentUser, isLoading } = useQuery({
    queryKey: queryKeys.currentUser(),
    queryFn: userService.me,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
      <SettingsSection icon={User} title="Profile" description="This project uses a single demo account.">
        {isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <div className="flex items-center gap-3">
            <Avatar name={currentUser?.name ?? "Anshika Chauhan"} avatarUrl={currentUser?.avatar_url} size={48} />
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {currentUser?.name ?? "Anshika Chauhan"}
              </p>
              <p className="text-xs text-gray-400">{currentUser?.email}</p>
            </div>
            <Badge className="ml-auto">Demo account</Badge>
          </div>
        )}
        <p className="mt-3 text-xs text-gray-400">
          Real authentication (sign-up, login, multi-user workspaces) is out of scope for this project — see the
          README for details.
        </p>
      </SettingsSection>

      <SettingsSection icon={Palette} title="Appearance" description="Switch between light and dark mode.">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">Dark mode</span>
          <ThemeToggle />
        </div>
      </SettingsSection>

      <SettingsSection icon={Bell} title="Notifications" description="Control what you get notified about.">
        <div className="space-y-2">
          {["Meeting summaries ready", "Action items assigned to me", "Weekly digest"].map((label) => (
            <div key={label} className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>{label}</span>
              <Badge>Coming Soon</Badge>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection icon={Link2} title="Integrations" description="Connect the tools your team already uses.">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {INTEGRATIONS.map((name) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300"
            >
              {name}
              <Badge>Coming Soon</Badge>
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
