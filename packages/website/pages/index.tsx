import Head from "next/head";
import { useEffect, useState } from "react";
import AuthorCard, { AuthorCardProps } from "../components/AuthorCard";
import Layout from "../components/Layout";
import { AuthorCardSkeleton, PostCardSkeleton } from "../components/Loading";
import PageNav from "../components/PageNav";
import PostCard from "../components/PostCard";
import Waline from "../components/WaLine";
import { Article } from "../types/article";
import { getArticlePath } from "../utils/getArticlePath";
import { LayoutProps } from "../utils/getLayoutProps";
import { getIndexPageProps } from "../utils/getPageProps";
import { getArticlesKeyWord } from "../utils/keywords";
import { revalidate } from "../utils/loadConfig";

export interface IndexPageProps {
  layoutProps: LayoutProps;
  authorCardProps: AuthorCardProps;
  currPage: number;
  articles: Article[];
}

const Home = (props: IndexPageProps) => {
  const [articlesLoaded, setArticlesLoaded] = useState(false);
  const [authorCardLoaded, setAuthorCardLoaded] = useState(false);

  // 快速加载检测，最小化骨架屏时间
  useEffect(() => {
    // 对于SSG页面，数据应该立即可用
    if (props.articles && Array.isArray(props.articles)) {
      setArticlesLoaded(true);
    } else {
      // 即使数据无效，也快速显示内容避免长时间骨架屏
      const timer = setTimeout(() => setArticlesLoaded(true), 50);
      return () => clearTimeout(timer);
    }
    
    // 作者卡片数据检测
    if (props.authorCardProps && props.authorCardProps.author) {
      setAuthorCardLoaded(true);
    } else {
      const timer = setTimeout(() => setAuthorCardLoaded(true), 30);
      return () => clearTimeout(timer);
    }
  }, [props.articles, props.authorCardProps]);

  return (
    <Layout
      option={props.layoutProps}
      title={props.layoutProps.siteName}
      sideBar={
        authorCardLoaded ? (
          <AuthorCard option={props.authorCardProps}></AuthorCard>
        ) : (
          <AuthorCardSkeleton />
        )
      }
    >
      <Head>
        <meta
          name="keywords"
          content={getArticlesKeyWord(props.articles || []).join(",")}
        ></meta>
      </Head>
      
      {articlesLoaded ? (
        <div className="content-container fade-in">
          <div className="space-y-2 md:space-y-4">
            {(props.articles || []).map((article) => (
              <PostCard
                showEditButton={props.layoutProps.showEditButton === "true"}
                setContent={() => {}}
                showExpirationReminder={
                  props.layoutProps.showExpirationReminder == "true"
                }
                openArticleLinksInNewWindow={
                  props.layoutProps.openArticleLinksInNewWindow == "true"
                }
                customCopyRight={null}
                private={article.private}
                top={article.top || 0}
                id={getArticlePath(article)}
                key={article.id}
                title={article.title}
                updatedAt={new Date(article.updatedAt)}
                createdAt={new Date(article.createdAt)}
                catelog={article.category}
                content={article.content || ""}
                type={"overview"}
                enableComment={props.layoutProps.enableComment}
                copyrightAggreement={props.layoutProps.copyrightAggreement}
              ></PostCard>
            ))}
          </div>
          <PageNav
            total={props.authorCardProps?.postNum || 0}
            current={props.currPage}
            base={"/"}
            more={"/page"}
            pageSize={props.layoutProps.homePageSize || 5}
          ></PageNav>
          <Waline enable={props.layoutProps.enableComment} visible={false} />
        </div>
      ) : (
        <PostCardSkeleton count={props.layoutProps.homePageSize || 5} />
      )}
    </Layout>
  );
};

export default Home;

export async function getStaticProps(): Promise<{
  props: IndexPageProps;
  revalidate?: number;
}> {
  return {
    props: await getIndexPageProps(),
    ...revalidate,
  };
}
