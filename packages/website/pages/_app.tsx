import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { getPageview, updatePageview } from "../api/pageview";
import "../styles/code-dark.css";
import "../styles/code-light.css";
import "../styles/custom-container.css";
import "../styles/github-markdown.css";
import "../styles/globals.css";
import "../styles/loader.css";
import "../styles/scrollbar.css";
import "../styles/side-bar.css";
import "../styles/tip-card.css";
import "../styles/toc.css";
import "../styles/var.css";
import "../styles/zoom.css";
import { GlobalContext, GlobalState } from "../utils/globalContext";

function MyApp({ Component, pageProps }: AppProps) {
  const { current } = useRef({ hasInit: false });
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const lastUpdatePathRef = useRef<string>("");
  const isInitializingRef = useRef(false);

  const [globalState, setGlobalState] = useState<GlobalState>({
    viewer: 0,
    visited: 0,
  });

  const router = useRouter();
  
  // 检查并清理可能影响访问量的设置
  const checkViewerSettings = useCallback(() => {
    try {
      // 检查是否有禁用访问量统计的标记
      const noViewer = window.localStorage.getItem("noViewer");
      if (noViewer) {
        console.log("[访问量统计] 检测到noViewer标记:", noViewer);
        // 可以选择性地清除这个标记，或者提示用户
        // window.localStorage.removeItem("noViewer"); // 取消注释以清除标记
      }
      
      // 检查访问历史
      const visited = window.localStorage.getItem("visited");
      console.log("[访问量统计] 访问历史标记:", visited);
      
      return !noViewer; // 返回是否应该正常统计访问量
    } catch (error) {
      console.error("[访问量统计] 检查设置失败:", error);
      return true; // 默认启用统计
    }
  }, []);
  
  // 优化的访问量更新函数
  const reloadViewer = useCallback(
    async (reason: string) => {
      const pathname = window.location.pathname;
      
      // 检查访问量统计设置
      const shouldTrack = checkViewerSettings();
      
      // 初始化时立即执行，不进行重复检查
      if (reason === "初始化") {
        if (isInitializingRef.current) {
          return; // 防止重复初始化
        }
        isInitializingRef.current = true;
        
        try {
          console.log(`[访问量统计] 开始${reason}，路径: ${pathname}，应该统计: ${shouldTrack}`);
          
          let result;
          if (window.localStorage.getItem("noViewer")) {
            console.log("[访问量统计] 检测到noViewer标记，仅获取数据");
            result = await getPageview(pathname);
          } else {
            console.log("[访问量统计] 正常模式，更新访问量");
            result = await updatePageview(pathname);
          }
          
          console.log("[访问量统计] API返回结果:", result);
          
          if (result && (result.viewer > 0 || result.visited > 0)) {
            setGlobalState({ viewer: result.viewer, visited: result.visited });
            console.log("[访问量统计] 更新状态成功:", result);
          } else {
            // 如果API返回的数据异常，尝试再次获取或使用合理的默认值
            console.warn("[访问量统计] API返回数据异常，尝试重新获取");
            try {
              const retryResult = await getPageview(pathname);
              if (retryResult && (retryResult.viewer > 0 || retryResult.visited > 0)) {
                setGlobalState({ viewer: retryResult.viewer, visited: retryResult.visited });
                console.log("[访问量统计] 重试成功:", retryResult);
              } else {
                // 最后使用合理的默认值
                const defaultState = { viewer: 1, visited: 1 };
                setGlobalState(defaultState);
                console.log("[访问量统计] 使用默认值:", defaultState);
              }
            } catch (retryError) {
              console.error("[访问量统计] 重试失败:", retryError);
              const fallbackState = { viewer: 1, visited: 1 };
              setGlobalState(fallbackState);
              console.log("[访问量统计] 使用最终回退值:", fallbackState);
            }
          }
          
          lastUpdatePathRef.current = pathname;
        } catch (error) {
          console.error("初始化访问量失败:", error);
          // 初始化失败时设置默认值
          const fallbackState = { viewer: 1, visited: 1 };
          setGlobalState(fallbackState);
          console.log("[访问量统计] 使用回退值:", fallbackState);
        } finally {
          isInitializingRef.current = false;
        }
        return;
      }
      
      // 页面跳转时的防重复检查（放宽条件）
      if (lastUpdatePathRef.current === pathname && reason === "页面跳转") {
        console.log(`[访问量统计] 跳过重复更新: ${pathname}`);
        return;
      }
      
      // 清除之前的定时器
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // 页面跳转时使用较短的防抖延迟
      updateTimeoutRef.current = setTimeout(async () => {
        try {
          console.log(`[访问量统计] 开始${reason}，路径: ${pathname}`);
          
          let result;
          if (window.localStorage.getItem("noViewer")) {
            result = await getPageview(pathname);
          } else {
            result = await updatePageview(pathname);
          }
          
          console.log("[访问量统计] 页面跳转API返回:", result);
          
          if (result && typeof result.viewer === 'number' && typeof result.visited === 'number') {
            setGlobalState(prev => {
              const newState = { viewer: result.viewer, visited: result.visited };
              console.log("[访问量统计] 更新状态:", prev, "->", newState);
              return newState;
            });
          }
          
          lastUpdatePathRef.current = pathname;
        } catch (error) {
          console.error("更新访问量失败:", error);
          // 页面跳转失败时保持当前状态，不重置为0
        }
      }, 100); // 减少延迟到100ms
    },
    [checkViewerSettings]
  );
  
  const handleRouteChange = (
    url: string,
    { shallow }: { shallow: boolean }
  ) => {
    // 只有非浅层路由变化才更新访问量
    if (!shallow) {
      reloadViewer("页面跳转");
    }
  };
  
  useEffect(() => {
    if (!current.hasInit) {
      current.hasInit = true;
      
      // 延迟一点确保DOM加载完成
      setTimeout(() => {
        reloadViewer("初始化");
      }, 100);
      
      router.events.on("routeChangeComplete", handleRouteChange);
      
      return () => {
        router.events.off("routeChangeComplete", handleRouteChange);
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
      };
    }
  }, [current, reloadViewer, router.events]);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, user-scalable=no"
        />
      </Head>
      <GlobalContext.Provider
        value={{ state: globalState, setState: setGlobalState }}
      >
        <Component {...pageProps} />
      </GlobalContext.Provider>
    </>
  );
}

export default MyApp;
