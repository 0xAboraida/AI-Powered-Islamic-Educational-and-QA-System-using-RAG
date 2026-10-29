import React from 'react';

export function SkeletonList({ viewMode }: { viewMode: 'grid' | 'list' }) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-slate-200 dark:border-white/10 bg-card/60 p-5 space-y-4">
            <div className="flex justify-between">
              <div className="h-5 w-24 rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-5 w-20 rounded bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="h-6 w-3/4 rounded bg-slate-300 dark:bg-white/20" />
            <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-white/10" />
            <div className="pt-3 flex gap-2">
              <div className="h-9 flex-1 rounded-xl bg-slate-200 dark:bg-white/10" />
              <div className="h-9 flex-1 rounded-xl bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-slate-200 dark:border-white/10 bg-card/60 p-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-1/3 rounded bg-slate-300 dark:bg-white/20" />
              <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-20 rounded-xl bg-slate-200 dark:bg-white/10" />
              <div className="h-9 w-24 rounded-xl bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SkeletonList;
