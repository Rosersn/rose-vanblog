import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import dayjs from 'dayjs';
import { Model } from 'mongoose';
import { Visit, VisitDocument } from 'src/scheme/visit.schema';
import { createVisitDto } from 'src/types/visit.dto';

@Injectable()
export class VisitProvider {
  constructor(@InjectModel('Visit') private visitModel: Model<VisitDocument>) {}

  async add(createViewerDto: createVisitDto): Promise<any> {
    // 先找一下有没有今天的，有的话就在今天的基础上加1。
    const { isNew, pathname } = createViewerDto;
    // 这里的 isNew 代表是对于这个文章来说有没有访问过。
    const today = dayjs().format('YYYY-MM-DD');
    const todayData = await this.findByDateAndPath(today, pathname);
    if (todayData) {
      // 有今天的，直接在今天的基础上 +1 就行了
      return await this.visitModel.updateOne(
        { _id: todayData._id },
        {
          viewer: todayData.viewer + 1,
          visited: isNew ? todayData.visited + 1 : todayData.visited,
          lastVisitedTime: new Date(),
        },
      );
    } else {
      // 没有今天的，找到能找到的上一天，然后加一，并创建今天的。
      const lastData = await this.getLastData(pathname);
      const lastVisit = lastData?.visited || 0;
      const lastViewer = lastData?.viewer || 0;
      const createdData = new this.visitModel({
        date: today,
        viewer: lastViewer + 1,
        visited: isNew ? lastVisit + 1 : lastVisit,
        pathname: pathname,
        lastVisitedTime: new Date(),
      });
      return await createdData.save();
    }
  }

  async rewriteToday(pathname: string, viewer: number, visited: number) {
    const today = dayjs().format('YYYY-MM-DD');
    const todayData = await this.findByDateAndPath(today, pathname);
    if (todayData) {
      await this.visitModel.updateOne({ _id: todayData.id }, { viewer, visited });
    } else {
      await this.visitModel.create({
        date: today,
        viewer,
        visited,
        pathname,
      });
    }
  }

  async getLastData(pathname: string) {
    const lastData = await this.visitModel.find({ pathname }).sort({ date: -1 }).limit(1);
    if (lastData && lastData.length > 0) {
      return lastData[0];
    }
    return null;
  }

  async getAll(): Promise<Visit[]> {
    return this.visitModel.find({}).exec();
  }

  async findByDateAndPath(date: string, pathname: string): Promise<Visit> {
    return this.visitModel.findOne({ date, pathname }).exec();
  }
  
  async getByArticleId(id: number | string) {
    // 判断是否是数字ID还是自定义路径名
    const isCustomPath = typeof id === 'string' && isNaN(Number(id));
    
    // 查询路径
    const pathname = id == 0 
      ? `/about` 
      : `/post/${id}`;
    
    // 查询今天的数据
    const result = await this.visitModel
      .find({
        pathname,
      })
      .sort({ date: -1 })
      .limit(1);
    
    // 如果使用自定义路径没有找到数据，尝试使用数字ID查询
    if ((!result || result.length === 0) && isCustomPath) {
      // 这里可能需要额外依赖注入 ArticleProvider 来获取文章ID
      // 由于这里不容易修改依赖结构，先使用直接查询的方式
      // 查询基于ID路径的数据
      const allData = await this.visitModel.find({}).exec();
      const matchingData = allData
        .filter(data => data.pathname.startsWith('/post/') && !isNaN(Number(data.pathname.replace('/post/', ''))))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (matchingData.length > 0) {
        return matchingData[0];
      }
    }
    
    if (result && result.length) {
      return result[0];
    }
    return null;
  }
  
  async getLastVisitItem() {
    const result = await this.visitModel
      .find({
        lastVisitedTime: { $exists: true },
      })
      .sort({ lastVisitedTime: -1 })
      .limit(1);
    if (result && result.length) {
      return result[0];
    }
    return null;
  }

  async import(data: Visit[]) {
    for (const each of data) {
      const oldData = await this.visitModel.findOne({
        pathname: each.pathname,
        date: each.date,
      });
      if (oldData) {
        await this.visitModel.updateOne({ _id: oldData._id }, each);
      } else {
        const newData = new this.visitModel(each);
        await newData.save();
      }
    }
  }
}
