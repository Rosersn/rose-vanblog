import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AuthorCard, { AuthorCardProps } from "../components/AuthorCard";
import Layout from "../components/Layout";
import { TagListSkeleton } from "../components/Loading";
import { LayoutProps } from "../utils/getLayoutProps";
import { getTagPageProps } from "../utils/getPageProps";
import { revalidate } from "../utils/loadConfig";

export interface TagWithCount {
  name: string;
  articleCount: number;
}

export interface TagPageProps {
  layoutProps: LayoutProps;
  authorCardProps: AuthorCardProps;
  tags: string[];
  hotTags?: TagWithCount[];
}

const TagPage = (props: TagPageProps) => {
  const [allTags, setAllTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true); // 默认为loading状态
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'articleCount'>('articleCount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loadProgress, setLoadProgress] = useState({ current: 0, total: 0 });
  const [hasStartedLoading, setHasStartedLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // 分批加载所有标签
  const loadAllTags = useCallback(async () => {
    if (hasStartedLoading) return;
    
    setHasStartedLoading(true);
    setLoading(true);
    setLoadProgress({ current: 0, total: 0 });

    try {
      let allLoadedTags: TagWithCount[] = [];
      let currentPage = 1;
      const pageSize = 1000; // 每页1000个标签
      let hasMore = true;
      let totalTags = 0;

      while (hasMore) {
        try {
          const response = await fetch(`/api/public/tags/paginated?page=${currentPage}&pageSize=${pageSize}&sortBy=articleCount&sortOrder=desc`);
          const result = await response.json();
          
          if (result.statusCode === 200 && result.data?.tags) {
            const newTags = result.data.tags || [];
            allLoadedTags = [...allLoadedTags, ...newTags];
            
            // 更新进度
            if (result.data.total) {
              totalTags = result.data.total;
              setLoadProgress({ current: allLoadedTags.length, total: totalTags });
            }
            
            // 如果返回的标签数量少于pageSize，说明已经是最后一页
            hasMore = newTags.length === pageSize;
            currentPage++;
            
            // 避免无限循环，最多加载100页
            if (currentPage > 100) {
              console.warn('已达到最大页数限制，停止加载');
              break;
            }
          } else {
            // API调用失败，使用备用数据
            console.log('分页API调用失败，使用备用数据');
            hasMore = false;
            break;
          }
        } catch (error) {
          console.error(`加载第${currentPage}页标签失败:`, error);
          hasMore = false;
          break;
        }
      }

      if (allLoadedTags.length > 0) {
        setAllTags(allLoadedTags);
      } else {
        // 如果分页API完全失败，使用备用数据
        if (props.hotTags && props.hotTags.length > 0) {
          setAllTags(props.hotTags);
        } else {
          const tagsWithCount = props.tags.map(tag => ({ name: tag, articleCount: 0 }));
          setAllTags(tagsWithCount);
        }
      }
    } catch (error) {
      console.error('加载标签失败:', error);
      // 使用备用数据
      if (props.hotTags && props.hotTags.length > 0) {
        setAllTags(props.hotTags);
      } else {
        const tagsWithCount = props.tags.map(tag => ({ name: tag, articleCount: 0 }));
        setAllTags(tagsWithCount);
      }
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  }, [props.hotTags, props.tags, hasStartedLoading]);

  // 初始化：优先使用SSG数据，然后异步加载完整数据
  useEffect(() => {
    // 首先使用SSG的热门标签数据，立即显示内容
    if (props.hotTags && props.hotTags.length > 0) {
      setAllTags(props.hotTags);
      setLoading(false);
      setInitialLoadComplete(true);
      
      // 异步加载完整数据
      setTimeout(() => {
        loadAllTags();
      }, 100);
    } else {
      // 没有热门标签数据，直接加载
      loadAllTags();
    }
  }, [loadAllTags, props.hotTags]);

  // 搜索和排序处理
  const filteredAndSortedTags = useMemo(() => {
    let filtered = allTags;

    // 搜索过滤
    if (searchKeyword.trim()) {
      filtered = allTags.filter(tag => 
        tag.name.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }

    // 排序
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      if (sortBy === 'name') {
        compareValue = a.name.localeCompare(b.name, 'zh-CN');
      } else if (sortBy === 'articleCount') {
        compareValue = a.articleCount - b.articleCount;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [allTags, searchKeyword, sortBy, sortOrder]);

  // 处理搜索
  const handleSearch = () => {
    // 搜索逻辑已经在 useMemo 中处理，这里不需要额外操作
  };

  // 处理排序变化
  const handleSortChange = (newSortBy: 'name' | 'articleCount', newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  // 重新加载标签
  const handleReload = () => {
    setHasStartedLoading(false);
    setAllTags([]);
    setInitialLoadComplete(false);
    loadAllTags();
  };

  return (
    <Layout
      option={props.layoutProps}
      title="标签"
      sideBar={<AuthorCard option={props.authorCardProps}></AuthorCard>}
    >
      <div className="bg-white card-shadow dark:bg-dark dark:card-shadow-dark py-4 px-8 md:py-6 md:px-8 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg md:text-xl text-gray-700 dark:text-dark">
            标签
          </div>
          <button
            onClick={handleReload}
            disabled={loading && !initialLoadComplete}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            {loading && !initialLoadComplete ? '加载中...' : '刷新'}
          </button>
        </div>
        
        {/* 搜索和排序控件 */}
        <div className="mb-6 space-y-4">
          {/* 搜索框 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索标签..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              搜索
            </button>
          </div>

          {/* 排序控件 */}
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">排序：</span>
            <button
              onClick={() => handleSortChange('articleCount', sortOrder)}
              className={`px-2 py-1 rounded ${
                sortBy === 'articleCount' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              按文章数
            </button>
            <button
              onClick={() => handleSortChange('name', sortOrder)}
              className={`px-2 py-1 rounded ${
                sortBy === 'name' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              按名称
            </button>
            <button
              onClick={() => handleSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {sortOrder === 'asc' ? '↑ 升序' : '↓ 降序'}
            </button>
          </div>
        </div>

        {/* 后台加载状态和进度（不影响初始显示） */}
        {loading && hasStartedLoading && initialLoadComplete && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-blue-600 dark:text-blue-400 font-medium">
                正在更新标签数据...
              </div>
              {loadProgress.total > 0 && (
                <div className="text-sm text-blue-500 dark:text-blue-300">
                  {loadProgress.current} / {loadProgress.total}
                </div>
              )}
            </div>
            {loadProgress.total > 0 && (
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(loadProgress.current / loadProgress.total) * 100}%` }}
                ></div>
              </div>
            )}
            <div className="text-xs text-blue-500 dark:text-blue-300 mt-1">
              正在后台更新数据，请继续浏览...
            </div>
          </div>
        )}

        {/* 标签列表 */}
        {!initialLoadComplete ? (
          <TagListSkeleton />
        ) : filteredAndSortedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {filteredAndSortedTags.map((tag) => (
              <Link
                key={tag.name}
                href={`/tag/${encodeURIComponent(tag.name)}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span>{tag.name}</span>
                {tag.articleCount > 0 && (
                  <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                    ({tag.articleCount})
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchKeyword.trim() ? '没有找到匹配的标签' : '暂无标签'}
          </div>
        )}

        {/* 统计信息 */}
        {initialLoadComplete && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            {searchKeyword.trim() ? (
              <p>找到 {filteredAndSortedTags.length} 个匹配的标签</p>
            ) : (
              <p>共 {allTags.length} 个标签</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TagPage;

export async function getStaticProps(): Promise<{
  props: TagPageProps;
  revalidate?: number;
}> {
  const baseProps = await getTagPageProps();
  
  // 尝试获取少量热门标签作为备用数据
  let hotTags: TagWithCount[] = [];
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/public/tags/hot?limit=100`);
    const result = await response.json();
    if (result.statusCode === 200) {
      hotTags = result.data || [];
    }
  } catch (error) {
    console.log('获取热门标签失败，使用原有数据');
  }

  return {
    props: {
      ...baseProps,
      hotTags,
    },
    ...revalidate,
  };
}
