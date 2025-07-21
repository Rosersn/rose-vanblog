import { GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { getPublicMeta } from "../api/getAllData";
import { getArticlesByOption } from "../api/getArticles";
import { getArticlePath } from "../utils/getArticlePath";
import { getAuthorCardProps } from "../utils/getLayoutProps";
import { ThemeContext } from "../utils/themeContext";

export default function Custom404(props: { 
  name?: string;
  recommendedArticles?: any[];
  authorLogo?: string;
  authorLogoDark?: string;
  author?: string;
}) {
  const [articles, setArticles] = useState(props.recommendedArticles || []);
  const { theme } = useContext(ThemeContext);
  
  // 根据主题选择合适的logo
  const logoUrl = theme?.includes("dark") && props.authorLogoDark 
    ? props.authorLogoDark 
    : props.authorLogo || "/logo.svg";
  
  // 如果没有SSG获取的文章，客户端尝试获取
  useEffect(() => {
    if (!articles || articles.length === 0) {
      const fetchArticles = async () => {
        try {
          const { articles } = await getArticlesByOption({
            page: 1,
            pageSize: 3,
            sortCreatedAt: "desc"
          });
          setArticles(articles || []);
        } catch (error) {
          console.error("获取推荐文章失败", error);
        }
      };
      fetchArticles();
    }
  }, [articles]);
  
  return (
    <>
      <Head>
        <title>{`此${props?.name ? props.name : "页面"}不存在`}</title>
        <link rel="icon" href={"/favicon.ico"}></link>
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div
          className="flex flex-col items-center justify-center select-none mb-8"
        >
          <Image 
            alt={props.author ? `${props.author}的头像` : "作者头像"} 
            src={logoUrl} 
            width={120} 
            height={120} 
            priority 
            className="rounded-full"
          />
          <div className="mt-4 text-gray-600 font-base text-xl dark:text-dark">
            {`此${props?.name ? props.name : "页面"}不存在`}
          </div>
          <Link href="/">
            <div className="mt-4 ua ua-link text-base text-gray-600 dark:text-dark">
              返回主页
            </div>
          </Link>
        </div>
        
        {articles && articles.length > 0 && (
          <div className="w-full max-w-3xl mt-8">
            <h2 className="text-lg font-medium text-center text-gray-700 dark:text-dark mb-4">
              — 您可能感兴趣的文章 —
            </h2>
            <div className="space-y-4">
              {articles.map((article) => (
                <div key={article.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                  <Link href={`/post/${getArticlePath(article)}`}>
                    <div className="text-base md:text-lg font-medium text-gray-800 dark:text-dark hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
                      {article.title}
                    </div>
                  </Link>
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 overflow-hidden" style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical"
                  }}>
                    {article.description || article.content?.replace(/#+\s+|!\[.*?\]\(.*?\)|```[\s\S]*?```|<[\s\S]*?>|---|__/g, '').substring(0, 100)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    // 获取最新的3篇文章作为推荐
    const { articles } = await getArticlesByOption({
      page: 1,
      pageSize: 3,
      sortCreatedAt: "desc"
    });
    
    // 获取作者信息
    const data = await getPublicMeta();
    const authorCardProps = getAuthorCardProps(data);
    
    return {
      props: {
        recommendedArticles: articles || [],
        authorLogo: authorCardProps.logo || "",
        authorLogoDark: authorCardProps.logoDark || "",
        author: authorCardProps.author || ""
      },
      // 一小时重新生成一次
      revalidate: 3600
    };
  } catch (error) {
    console.error("获取数据失败", error);
    return {
      props: {
        recommendedArticles: [],
        authorLogo: "",
        authorLogoDark: "",
        author: ""
      },
      revalidate: 3600
    };
  }
};
