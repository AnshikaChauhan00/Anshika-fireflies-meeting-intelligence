import { Suspense } from "react";
import { GlobalSearchResults } from "@/components/search/GlobalSearchResults";
import { Skeleton } from "@/components/common/LoadingSkeleton";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-3 px-4 py-6 sm:px-6">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      }
    >
      <GlobalSearchResults />
    </Suspense>
  );
}
