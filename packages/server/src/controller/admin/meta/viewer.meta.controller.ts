import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { config } from 'src/config';
import { ArticleProvider } from 'src/provider/article/article.provider';
import { AdminGuard } from 'src/provider/auth/auth.guard';
import { ISRProvider } from 'src/provider/isr/isr.provider';
import { MetaProvider } from 'src/provider/meta/meta.provider';
import { ApiToken } from 'src/provider/swagger/token';
import { VisitProvider } from 'src/provider/visit/visit.provider';
import { BatchUpdateViewerDto, UpdateSiteViewerDto } from 'src/types/viewer.dto';

@ApiTags('viewer')
@UseGuards(...AdminGuard)
@ApiToken
@Controller('/api/admin/meta/viewer')
export class ViewerMetaController {
  constructor(
    private readonly metaProvider: MetaProvider,
    private readonly articleProvider: ArticleProvider,
    private readonly visitProvider: VisitProvider,
    private readonly isrProvider: ISRProvider,
  ) {}

  @Get()
  async get() {
    const siteData = await this.metaProvider.getViewer();
    const articles = await this.articleProvider.getAll('list', true);
    const articlesViewer = articles
      .filter(article => !article.deleted && !article.hidden)
      .map(article => ({
        id: article.id,
        title: article.title,
        viewer: article.viewer || 0,
        visited: article.visited || 0,
      }));
    
    return {
      statusCode: 200,
      data: {
        site: siteData,
        articles: articlesViewer,
      },
    };
  }

  @Put('/site')
  async updateSite(@Body() updateDto: UpdateSiteViewerDto) {
    if (config.demo && config.demo == 'true') {
      return {
        statusCode: 401,
        message: '演示站禁止修改此项！',
      };
    }
    
    await this.metaProvider.update({
      viewer: updateDto.viewer,
      visited: updateDto.visited,
    });
    
    return {
      statusCode: 200,
      message: '网站浏览量更新成功！',
    };
  }

  @Put('/article')
  async updateArticle(@Body() updateDto: { id: number; viewer: number; visited: number }) {
    if (config.demo && config.demo == 'true') {
      return {
        statusCode: 401,
        message: '演示站禁止修改此项！',
      };
    }
    
    // 获取文章信息，检查是否有自定义路径
    const article = await this.articleProvider.getById(updateDto.id, 'admin');
    if (!article) {
      return {
        statusCode: 404,
        message: '文章不存在！',
      };
    }
    
    // 更新Article表中的浏览量
    await this.articleProvider.updateById(updateDto.id, {
      viewer: updateDto.viewer,
      visited: updateDto.visited,
    });
    
    // 更新基于ID的路径
    const idPathname = `/post/${updateDto.id}`;
    await this.visitProvider.rewriteToday(idPathname, updateDto.viewer, updateDto.visited);
    
    // 如果有自定义路径，也更新
    if (article.pathname) {
      const customPathname = `/post/${article.pathname}`;
      await this.visitProvider.rewriteToday(customPathname, updateDto.viewer, updateDto.visited);
      
      // 使用新的同步方法确保两个路径的数据完全一致
      await this.visitProvider.syncPathViewerData(updateDto.id, article.pathname);
    }
    
    // 强制触发ISR重新渲染文章页面和相关页面
    try {
      await this.isrProvider.activeArticleById(updateDto.id, 'update', article);
      
      // 额外确保自定义路径页面也得到更新
      if (article.pathname) {
        const customPath = `/post/${article.pathname}`;
        await this.isrProvider.activeUrl(customPath, true);
      }
    } catch (error) {
      console.error('触发增量渲染失败:', error);
    }
    
    return {
      statusCode: 200,
      message: '文章浏览量更新成功！',
    };
  }

  @Put('/batch')
  async batchUpdate(@Body() updateDto: BatchUpdateViewerDto) {
    if (config.demo && config.demo == 'true') {
      return {
        statusCode: 401,
        message: '演示站禁止修改此项！',
      };
    }
    
    // 更新网站总浏览量
    await this.metaProvider.update({
      viewer: updateDto.siteViewer,
      visited: updateDto.siteVisited,
    });
    
    // 需要强制刷新的文章路径
    const articlesToRefresh = [];
    
    // 批量更新文章浏览量
    for (const articleUpdate of updateDto.articles) {
      // 获取文章信息，检查是否有自定义路径
      const article = await this.articleProvider.getById(articleUpdate.id, 'admin');
      if (!article) {
        continue; // 跳过不存在的文章
      }
      
      // 更新Article表
      await this.articleProvider.updateById(articleUpdate.id, {
        viewer: articleUpdate.viewer,
        visited: articleUpdate.visited,
      });
      
      // 更新基于ID的路径
      const idPathname = `/post/${articleUpdate.id}`;
      await this.visitProvider.rewriteToday(idPathname, articleUpdate.viewer, articleUpdate.visited);
      
      // 添加到需要刷新的文章列表
      articlesToRefresh.push({id: articleUpdate.id, article});
      
      // 如果有自定义路径，也更新
      if (article.pathname) {
        const customPathname = `/post/${article.pathname}`;
        await this.visitProvider.rewriteToday(customPathname, articleUpdate.viewer, articleUpdate.visited);
        
        // 使用新的同步方法确保两个路径的数据完全一致
        await this.visitProvider.syncPathViewerData(articleUpdate.id, article.pathname);
      }
    }
    
    // 强制触发ISR重新渲染所有文章页面和相关页面
    try {
      // 首先触发全站刷新
      await this.isrProvider.activeAll('批量更新浏览量');
      
      // 然后逐个触发文章页面，确保完全更新
      for (const {id, article} of articlesToRefresh) {
        await this.isrProvider.activeArticleById(id, 'update', article);
        
        // 额外确保自定义路径页面也得到更新
        if (article.pathname) {
          const customPath = `/post/${article.pathname}`;
          await this.isrProvider.activeUrl(customPath, true);
        }
      }
    } catch (error) {
      console.error('触发增量渲染失败:', error);
    }
    
    return {
      statusCode: 200,
      message: '浏览量批量更新成功！',
    };
  }

  @Put('/auto-boost')
  async autoBoost(@Body() boostConfig: { 
    minIncrease: number; 
    maxIncrease: number; 
    siteMultiplier: number;
    articlesOnly?: boolean;
  }) {
    if (config.demo && config.demo == 'true') {
      return {
        statusCode: 401,
        message: '演示站禁止修改此项！',
      };
    }
    
    const { minIncrease, maxIncrease, siteMultiplier, articlesOnly = false } = boostConfig;
    
    // 获取所有文章
    const articles = await this.articleProvider.getAll('list', true);
    const validArticles = articles.filter(article => !article.deleted && !article.hidden);
    
    let totalViewerIncrease = 0;
    let totalVisitedIncrease = 0;
    
    // 需要强制刷新的文章路径
    const articlesToRefresh = [];
    
    // 随机提升每篇文章的浏览量
    for (const article of validArticles) {
      const viewerIncrease = Math.floor(Math.random() * (maxIncrease - minIncrease + 1)) + minIncrease;
      const visitedIncrease = Math.floor(viewerIncrease * (0.3 + Math.random() * 0.4)); // 访客数是访问量的30%-70%
      
      const newViewer = (article.viewer || 0) + viewerIncrease;
      const newVisited = (article.visited || 0) + visitedIncrease;
      
      // 更新Article表
      await this.articleProvider.updateById(article.id, {
        viewer: newViewer,
        visited: newVisited,
      });
      
      // 更新基于ID的路径
      const idPathname = `/post/${article.id}`;
      await this.visitProvider.rewriteToday(idPathname, newViewer, newVisited);
      
      // 添加到需要刷新的文章列表
      articlesToRefresh.push({id: article.id, article});
      
      // 如果有自定义路径，也更新
      if (article.pathname) {
        const customPathname = `/post/${article.pathname}`;
        await this.visitProvider.rewriteToday(customPathname, newViewer, newVisited);
        
        // 使用新的同步方法确保两个路径的数据完全一致
        await this.visitProvider.syncPathViewerData(article.id, article.pathname);
      }
      
      totalViewerIncrease += viewerIncrease;
      totalVisitedIncrease += visitedIncrease;
    }
    
    // 更新网站总浏览量（考虑到非文章页面的访问）
    if (!articlesOnly) {
      const currentSite = await this.metaProvider.getViewer();
      const siteViewerIncrease = Math.floor(totalViewerIncrease * siteMultiplier);
      const siteVisitedIncrease = Math.floor(totalVisitedIncrease * siteMultiplier);
      
      await this.metaProvider.update({
        viewer: currentSite.viewer + siteViewerIncrease,
        visited: currentSite.visited + siteVisitedIncrease,
      });
    }
    
    // 强制触发ISR重新渲染所有文章页面和相关页面
    try {
      // 首先触发全站刷新
      await this.isrProvider.activeAll('智能提升浏览量');
      
      // 然后逐个触发文章页面，确保完全更新
      for (const {id, article} of articlesToRefresh) {
        await this.isrProvider.activeArticleById(id, 'update', article);
        
        // 额外确保自定义路径页面也得到更新
        if (article.pathname) {
          const customPath = `/post/${article.pathname}`;
          await this.isrProvider.activeUrl(customPath, true);
        }
      }
    } catch (error) {
      console.error('触发增量渲染失败:', error);
    }
    
    return {
      statusCode: 200,
      data: {
        articlesUpdated: validArticles.length,
        totalViewerIncrease,
        totalVisitedIncrease,
      },
      message: '浏览量智能提升完成！',
    };
  }
} 