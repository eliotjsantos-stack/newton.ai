'use client';

function Shimmer({ className = '' }) {
  return (
    <div className={`rounded-lg bg-white/[0.06] animate-pulse ${className}`} />
  );
}

const cardBase = "bg-[#0d0d0d] border border-white/10 rounded-2xl";

export default function SkeletonDashboard() {
  return (
    <div className="space-y-8">
      {/* Intelligence Layer (Radar + Observation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`${cardBase} p-6 sm:p-8`}>
          <Shimmer className="h-3 w-28 mb-6" />
          <div className="flex justify-center">
            <Shimmer className="w-[200px] h-[200px] !rounded-full" />
          </div>
        </div>
        <div className={`${cardBase} p-6 sm:p-8`}>
          <Shimmer className="h-3 w-36 mb-6" />
          <Shimmer className="h-4 w-full mb-2" />
          <Shimmer className="h-4 w-3/4 mb-4" />
          <Shimmer className="h-3 w-40" />
        </div>
      </div>

      {/* Subject Tiles (grid-cols-3, compact) */}
      <div>
        <Shimmer className="h-3 w-16 mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${cardBase} p-4 sm:p-5 flex flex-col items-center`}>
              <Shimmer className="w-10 h-10 !rounded-xl mb-3" />
              <Shimmer className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Progress Card */}
      <div className={`${cardBase} p-6 sm:p-8`}>
        <div className="flex items-center justify-between">
          <div>
            <Shimmer className="h-5 w-28 mb-2" />
            <Shimmer className="h-3 w-48" />
          </div>
          <Shimmer className="w-5 h-5 !rounded" />
        </div>
      </div>

      {/* Weekly Activity */}
      <div className={`${cardBase} p-6 sm:p-8`}>
        <Shimmer className="h-3 w-20 mb-4" />
        <div className="flex items-center justify-between">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Shimmer className="w-10 h-10 !rounded-full" />
              <Shimmer className="h-3 w-6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
