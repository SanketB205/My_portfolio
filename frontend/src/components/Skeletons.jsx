import React from 'react'

export function Skeleton({ className = '' }) {
  return <div className={`skeleton-shimmer rounded-xl ${className}`} />
}

export function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-xs flex flex-col justify-between">
      <div>
        {/* Thumbnail Image Skeleton */}
        <div className="aspect-video skeleton-shimmer rounded-t-3xl" />
        
        {/* Content Skeleton */}
        <div className="p-6 space-y-3">
          <div className="h-3 w-16 rounded-full skeleton-shimmer" />
          <div className="h-6 w-3/4 rounded-full skeleton-shimmer" />
          
          <div className="space-y-2 pt-2">
            <div className="h-3.5 w-full rounded-full skeleton-shimmer" />
            <div className="h-3.5 w-11/12 rounded-full skeleton-shimmer" />
            <div className="h-3.5 w-3/4 rounded-full skeleton-shimmer" />
          </div>

          <div className="flex flex-wrap gap-2 pt-3">
            <div className="h-6 w-16 rounded-full skeleton-shimmer" />
            <div className="h-6 w-20 rounded-full skeleton-shimmer" />
            <div className="h-6 w-14 rounded-full skeleton-shimmer" />
          </div>
        </div>
      </div>

      {/* Footer Links Skeleton */}
      <div className="px-6 pb-6 pt-3 border-t border-gray-100 flex items-center gap-6">
        <div className="h-4 w-20 rounded-full skeleton-shimmer" />
        <div className="h-4 w-24 rounded-full skeleton-shimmer" />
      </div>
    </div>
  )
}

export function AdminProjectSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start justify-between gap-4">
      <div className="flex-1 space-y-2.5">
        <div className="h-5 w-48 rounded-full skeleton-shimmer" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-12 rounded-full skeleton-shimmer" />
          <div className="h-4 w-16 rounded-full skeleton-shimmer" />
          <div className="h-4 w-14 rounded-full skeleton-shimmer" />
        </div>
        <div className="h-3.5 w-5/6 rounded-full skeleton-shimmer" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg skeleton-shimmer" />
        <div className="w-8 h-8 rounded-lg skeleton-shimmer" />
      </div>
    </div>
  )
}

export function CertificationSkeletonItem({ isFirst, isLast }) {
  return (
    <div className={`flex items-center gap-3 ${isFirst ? 'pb-4' : isLast ? 'pt-4' : 'py-4'}`}>
      <div className="w-5 h-5 rounded-full skeleton-shimmer flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 skeleton-shimmer rounded-full w-3/4" />
        <div className="h-2.5 skeleton-shimmer rounded-full w-1/3" />
      </div>
      <div className="h-5 w-12 skeleton-shimmer rounded-full" />
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#F2F2F2] flex flex-col font-sans p-4 sm:p-6 lg:p-8 space-y-12 max-w-[1400px] mx-auto animate-pulse">
      {/* Navbar Skeleton */}
      <div className="h-14 bg-white/80 rounded-full border border-gray-200/80 px-6 flex items-center justify-between">
        <div className="h-5 w-24 rounded-full skeleton-shimmer" />
        <div className="hidden md:flex items-center gap-6">
          <div className="h-3.5 w-14 rounded-full skeleton-shimmer" />
          <div className="h-3.5 w-14 rounded-full skeleton-shimmer" />
          <div className="h-3.5 w-14 rounded-full skeleton-shimmer" />
          <div className="h-3.5 w-14 rounded-full skeleton-shimmer" />
        </div>
        <div className="h-9 w-28 rounded-full skeleton-shimmer" />
      </div>

      {/* Hero Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="h-7 w-48 rounded-full skeleton-shimmer" />
          <div className="space-y-3">
            <div className="h-12 sm:h-16 w-3/4 rounded-2xl skeleton-shimmer" />
            <div className="h-12 sm:h-16 w-5/6 rounded-2xl skeleton-shimmer" />
          </div>
          <div className="space-y-2 max-w-[500px]">
            <div className="h-4 w-full rounded-full skeleton-shimmer" />
            <div className="h-4 w-4/5 rounded-full skeleton-shimmer" />
          </div>
          <div className="flex gap-4 pt-2">
            <div className="h-12 w-36 rounded-full skeleton-shimmer" />
            <div className="h-12 w-44 rounded-full skeleton-shimmer" />
          </div>
          <div className="flex gap-8 pt-4">
            <div className="space-y-1.5">
              <div className="h-8 w-16 rounded-lg skeleton-shimmer" />
              <div className="h-3 w-14 rounded-full skeleton-shimmer" />
            </div>
            <div className="space-y-1.5">
              <div className="h-8 w-16 rounded-lg skeleton-shimmer" />
              <div className="h-3 w-14 rounded-full skeleton-shimmer" />
            </div>
            <div className="space-y-1.5">
              <div className="h-8 w-16 rounded-lg skeleton-shimmer" />
              <div className="h-3 w-14 rounded-full skeleton-shimmer" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-[420px] aspect-[4/5] bg-white rounded-[2.5rem] p-4 shadow-sm">
            <div className="w-full h-full rounded-2xl skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  )
}
