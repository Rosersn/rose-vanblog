const DEFAULT_PAGEVIEW_RESPONSE = { viewer: 0, visited: 0 };

export interface PageViewData {
  viewer: number;
  visited: number;
}

export const getPageview = async (pathname: string): Promise<PageViewData> => {
  try {
    const { statusCode, data } = await fetch(
      `/api/public/viewer`,
      {method: "GET"}
    ).then((res) => res.json());

    return statusCode === 233 ? DEFAULT_PAGEVIEW_RESPONSE : data;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export const updatePageview = async (
  pathname: string
): Promise<PageViewData> => {
  const hasVisited = window.localStorage.getItem("visited");
  const hasVisitedCurrentPath = window.localStorage.getItem(
    `visited-${pathname}`
  );

  if (!hasVisited) {
    window.localStorage.setItem("visited", "true");
  }

  if (!hasVisitedCurrentPath) {
    window.localStorage.setItem(`visited-${pathname}`, "true");
  }

  try {
    // 获取管理员 token（如果已登录）
    const token = window.localStorage.getItem("token") || window.sessionStorage.getItem("token");
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers["token"] = token;
    }

    const { statusCode, data } = await fetch(
      `/api/public/viewer?isNew=${!hasVisited}&isNewByPath=${!hasVisitedCurrentPath}`,
      { 
        method: "POST",
        headers: headers
      }
    ).then((res) => res.json());

    return statusCode === 233 ? DEFAULT_PAGEVIEW_RESPONSE : data;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

