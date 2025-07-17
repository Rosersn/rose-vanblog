export const washArticlesByKey = (
  rawArticles: any[],
  getValueFn: (val: any) => any,
  isKeyArray: boolean
) => {
  const articles = {} as any;

  const dates = Array.from(
    new Set(
      isKeyArray
        ? rawArticles.flatMap((a) => getValueFn(a))
        : rawArticles.map((a) => getValueFn(a))
    )
  );

  // 使用与客户端完全相同的排序逻辑，避免视觉闪烁
  const sortedDates = dates.sort((a, b) => parseInt(b) - parseInt(a));

  for (const date of sortedDates) {
    const curArticles = rawArticles
      .filter((each) =>
        isKeyArray ? getValueFn(each).includes(date) : getValueFn(each) == date
      )
      .map((each) => ({
        title: each.title,
        id: each.id,
        createdAt: each.createdAt,
        updatedAt: each.updatedAt,
      }))
      .sort(
        (prev, next) =>
          new Date(next.createdAt).getTime() -
          new Date(prev.createdAt).getTime()
      );

    articles[String(date)] = curArticles;
  }

  return articles;
};
