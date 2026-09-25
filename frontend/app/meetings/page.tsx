import { Suspense } from "react";
import { MeetingsPageContent } from "@/components/meetings/MeetingsPageContent";
import { MeetingCardSkeleton } from "@/components/common/LoadingSkeleton";

export default function MeetingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-6 sm:px-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MeetingCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <MeetingsPageContent />
    </Suspense>
  );
}
