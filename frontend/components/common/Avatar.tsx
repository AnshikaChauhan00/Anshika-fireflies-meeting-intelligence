import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, avatarUrl, size = 28, className }: AvatarProps) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full border border-white object-cover dark:border-gray-900", className)}
        unoptimized
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-white bg-brand-100 font-semibold text-brand-700 dark:border-gray-900 dark:bg-brand-900 dark:text-brand-200",
        className
      )}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

export function AvatarStack({ names, max = 4 }: { names: string[]; max?: number }) {
  const visible = names.slice(0, max);
  const remaining = names.length - visible.length;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((name, index) => (
        <Avatar key={`${name}-${index}`} name={name} size={26} />
      ))}
      {remaining > 0 && (
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-white bg-gray-100 text-[10px] font-semibold text-gray-600 dark:border-gray-900 dark:bg-gray-800 dark:text-gray-300">
          +{remaining}
        </div>
      )}
    </div>
  );
}
