import React from "react";
import AuthorCardHover from "../AuthorCard/hover"; // 导入AuthorCardHover组件

// 骨架屏组件 - 使用CSS变量确保主题一致性
export function Skeleton({ 
  className = "", 
  height = "h-4", 
  width = "w-full",
  rounded = "rounded" 
}) {
  return (
    <div 
      className={`animate-pulse ${height} ${width} ${rounded} ${className}`}
      style={{ backgroundColor: 'var(--skeleton-pulse)' }}
    />
  );
}

// 文章卡片骨架屏
export function PostCardSkeleton({ count = 1 }) {
  return (
    <div className="space-y-2 md:space-y-4 skeleton-container">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-white dark:bg-dark card-shadow dark:card-shadow-dark py-4 px-1 sm:px-3 md:py-6 md:px-5 rounded-lg layout-transition">
          {/* 标题骨架屏 */}
          <div className="mb-3">
            <Skeleton height="h-6" width="w-3/4" className="mb-2" />
            <div className="flex items-center space-x-4 text-sm">
              <Skeleton height="h-4" width="w-20" />
              <Skeleton height="h-4" width="w-16" />
              <Skeleton height="h-4" width="w-24" />
            </div>
          </div>
          
          {/* 内容骨架屏 */}
          <div className="space-y-2 mb-4">
            <Skeleton height="h-4" width="w-full" />
            <Skeleton height="h-4" width="w-full" />
            <Skeleton height="h-4" width="w-2/3" />
          </div>
          
          {/* 阅读更多按钮骨架屏 */}
          <Skeleton height="h-8" width="w-24" />
        </div>
      ))}
    </div>
  );
}

// 侧边栏作者卡片骨架屏
export function AuthorCardSkeleton() {
  const skeletonContent = (
    <div className="w-52 flex flex-col justify-center items-center bg-white dark:bg-dark pt-6 pb-4 card-shadow dark:card-shadow-dark ml-2 rounded-lg skeleton-container layout-transition">
      <Skeleton height="h-16" width="w-16" rounded="rounded-full" className="mb-3" />
      <Skeleton height="h-5" width="w-20" className="mb-2" />
      <Skeleton height="h-4" width="w-32" className="mb-4" />
      <div className="flex space-x-4 text-sm">
        <div className="text-center">
          <Skeleton height="h-5" width="w-8" className="mb-1" />
          <Skeleton height="h-3" width="w-8" />
        </div>
        <div className="text-center">
          <Skeleton height="h-5" width="w-8" className="mb-1" />
          <Skeleton height="h-3" width="w-8" />
        </div>
        <div className="text-center">
          <Skeleton height="h-5" width="w-8" className="mb-1" />
          <Skeleton height="h-3" width="w-8" />
        </div>
      </div>
    </div>
  );
  
  return (
    <div id="author-card" className="sticky">
      <AuthorCardHover>
        {skeletonContent}
      </AuthorCardHover>
    </div>
  );
}

// 标签列表骨架屏
export function TagListSkeleton() {
  return (
    <div className="flex flex-wrap gap-2 skeleton-container">
      {Array.from({ length: 20 }, (_, i) => (
        <Skeleton 
          key={i} 
          height="h-8" 
          width={`w-${Math.floor(Math.random() * 8) + 12}`}
          rounded="rounded-full"
        />
      ))}
    </div>
  );
}

// 目录骨架屏
export function TocSkeleton() {
  return (
    <div className="bg-white dark:bg-dark w-60 card-shadow dark:card-shadow-dark ml-2 overflow-y-auto pb-2 rounded-lg p-4 skeleton-container layout-transition">
      <Skeleton height="h-5" width="w-16" className="mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={`${i % 3 === 1 ? 'ml-4' : i % 3 === 2 ? 'ml-8' : ''}`}>
            <Skeleton height="h-4" width={`w-${Math.floor(Math.random() * 20) + 20}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

// 主Loading组件
export default function Loading(props: { 
  children: any; 
  loading: boolean;
  skeleton?: React.ReactNode;
  minHeight?: string;
}) {
  if (props.loading) {
    if (props.skeleton) {
      return <div className="skeleton-container">{props.skeleton}</div>;
    }
    return (
      <div className={`flex items-center justify-center anti-flicker ${props.minHeight || 'min-h-[200px]'}`}>
        <div className="loader"></div>
      </div>
    );
  }
  return <div className="content-container fade-in">{props?.children}</div>;
}
