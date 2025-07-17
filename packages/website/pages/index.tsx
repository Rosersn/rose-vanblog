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

  // 模拟数据加载完成
  useEffect(() => {
    // 检查文章数据是否有效
    if (props.articles && props.articles.length >= 0) {
      // 延迟一帧确保DOM渲染完成，避免闪烁
      requestAnimationFrame(() => {
        setArticlesLoaded(true);
      });
    }
    
    // 检查作者卡片数据是否有效
    if (props.authorCardProps) {
      requestAnimationFrame(() => {
        setAuthorCardLoaded(true);
      });
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
          content={getArticlesKeyWord(props.articles).join(",")}
        ></meta>
      </Head>
      
      {articlesLoaded ? (
        <div className="content-container fade-in">
          <div className="space-y-2 md:space-y-4">
            {props.articles.map((article) => (
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
            total={props.authorCardProps.postNum}
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
