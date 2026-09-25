import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "brand" | "success" | "warning" | "danger";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  brand: "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
  danger: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
