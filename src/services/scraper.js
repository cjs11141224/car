/**
 * 汽车数据爬虫服务 - 全平台版本
 * 支持：汽车之家、懂车帝、易车
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import db from '../config/db.js';
import https from 'https';

// ============ 反爬配置 ============
const antiCrawlConfig = {
  // User-Agent 池
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  ],
  
  // 请求延迟（毫秒）
  minDelay: 2000,
  maxDelay: 5000,
  
  // 重试配置
  maxRetries: 3,
  retryDelay: 5000,
  
  // 请求头
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Upgrade-Insecure-Requests': '1'
  }
};

// ============ 工具函数 ============

// 随机延迟
const randomDelay = () => {
  const delay = Math.random() * (antiCrawlConfig.maxDelay - antiCrawlConfig.minDelay) + antiCrawlConfig.minDelay;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// 随机 User-Agent
const getRandomUA = () => antiCrawlConfig.userAgents[Math.floor(Math.random() * antiCrawlConfig.userAgents.length)];

// 创建 axios 实例（禁用SSL验证）
const createAxiosInstance = (ua) => {
  return axios.create({
    httpAgent: new https.Agent({ rejectUnauthorized: false }),
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    headers: {
      ...antiCrawlConfig.headers,
      'User-Agent': ua
    },
    timeout: 30000,
    maxRedirects: 5
  });
};

// 计算 MD5
const getMD5 = (str) => crypto.createHash('md5').update(str).digest('hex');

// 获取图片信息
async function getImageInfo(url) {
  if (!url || !url.startsWith('http')) {
    return { valid: false, reason: '无效URL', md5: null, size: null };
  }
  
  try {
    const ua = getRandomUA();
    const axiosInstance = createAxiosInstance(ua);
    const response = await axiosInstance.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    const md5 = getMD5(buffer);
    
    // 简单尺寸检测（通过文件头）
    const width = buffer[18] | (buffer[19] << 8);
    const height = buffer[22] | (buffer[23] << 8);
    
    return { 
      valid: true, 
      md5, 
      size: { width, height },
      length: buffer.length
    };
  } catch (error) {
    console.error(`获取图片信息失败: ${url}`, error.message);
    return { valid: false, reason: error.message, md5: null, size: null };
  }
}

// ============ 汽车之家爬虫 ============
export async function scrapeAutohomeNews() {
  const source = 'autohome';
  let itemsCount = 0;
  
  try {
    console.log(`[${source}] 开始抓取新闻...`);
    await logSync(source, 'news', 'running');
    
    // 汽车之家新闻列表页
    const url = 'https://www.autohome.com.cn/news/';
    const ua = getRandomUA();
    const axiosInstance = createAxiosInstance(ua);
    
    await randomDelay();
    const response = await axiosInstance.get(url);
    const $ = cheerio.load(response.data);
    
    const newsList = [];
    
    // 解析新闻列表
    $('.article-list .article-item, .news-list .news-item, .list-item').each((index, element) => {
      if (index >= 20) return; // 限制数量
      
      const $item = $(element);
      const title = $item.find('h3 a, .title a, a.title').text().trim();
      const summary = $item.find('.summary, .desc, .intro').text().trim();
      const link = $item.find('h3 a, .title a, a.title').attr('href');
      const img = $item.find('img').attr('src') || $item.find('.img-wrap img').attr('src');
      
      if (title && link) {
        const fullLink = link.startsWith('http') ? link : `https://www.autohome.com.cn${link}`;
        const fullImg = img && img.startsWith('//') ? `https:${img}` : (img || '');
        
        newsList.push({
          id: `${source}_news_${getMD5(title).substring(0, 8)}_${Date.now()}`,
          title: title.substring(0, 200),
          summary: summary ? summary.substring(0, 500) : '',
          content: summary || title,
          coverImage: fullImg,
          tags: extractTags(title),
          source: '汽车之家',
          sourceUrl: fullLink,
          publishedAt: new Date().toISOString().split('T')[0],
          isPublished: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    
    // 如果解析不到，使用备用方法
    if (newsList.length === 0) {
      console.log(`[${source}] 使用备用解析方法...`);
      $('a[href*="/news/"]').each((index, element) => {
        if (index >= 20) return;
        const href = $(element).attr('href');
        const title = $(element).text().trim();
        if (title && title.length > 5 && href) {
          newsList.push({
            id: `${source}_news_${getMD5(title).substring(0, 8)}_${Date.now()}`,
            title: title.substring(0, 200),
            summary: '点击查看详情',
            content: title,
            coverImage: '',
            tags: extractTags(title),
            source: '汽车之家',
            sourceUrl: href.startsWith('http') ? href : `https://www.autohome.com.cn${href}`,
            publishedAt: new Date().toISOString().split('T')[0],
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      });
    }
    
    // 保存到数据库
    await db.read();
    newsList.forEach(item => {
      const existingIndex = db.data.news.findIndex(n => n.title === item.title);
      if (existingIndex >= 0) {
        db.data.news[existingIndex] = { ...db.data.news[existingIndex], ...item, updatedAt: new Date().toISOString() };
      } else {
        db.data.news.unshift(item);
      }
    });
    await db.write();
    
    itemsCount = newsList.length;
    console.log(`[${source}] 成功抓取 ${itemsCount} 条新闻`);
    await logSync(source, 'news', 'success', itemsCount);
    
    return itemsCount;
  } catch (error) {
    console.error(`[${source}] 抓取新闻失败:`, error.message);
    await logSync(source, 'news', 'failed', 0, error.message);
    return 0;
  }
}

// ============ 懂车帝爬虫 ============
export async function scrapeDongCheDiNews() {
  const source = 'dongchedi';
  let itemsCount = 0;
  
  try {
    console.log(`[${source}] 开始抓取新闻...`);
    await logSync(source, 'news', 'running');
    
    const url = 'https://www.dongche.cn/';
    const ua = getRandomUA();
    const axiosInstance = createAxiosInstance(ua);
    
    await randomDelay();
    const response = await axiosInstance.get(url);
    const $ = cheerio.load(response.data);
    
    const newsList = [];
    
    // 解析懂车帝新闻
    $('.news-item, .article-item, .content-item, .item').each((index, element) => {
      if (index >= 20) return;
      
      const $item = $(element);
      const title = $item.find('.title, h3, h4, a').first().text().trim();
      const summary = $item.find('.summary, .desc, .intro').text().trim();
      const link = $item.find('a').first().attr('href');
      const img = $item.find('img').attr('src') || $item.find('.img-box img').attr('src');
      
      if (title && title.length > 5) {
        const fullLink = link ? (link.startsWith('http') ? link : `https://www.dongche.cn${link}`) : '';
        const fullImg = img && img.startsWith('//') ? `https:${img}` : (img || '');
        
        newsList.push({
          id: `${source}_news_${getMD5(title).substring(0, 8)}_${Date.now()}`,
          title: title.substring(0, 200),
          summary: summary ? summary.substring(0, 500) : '',
          content: summary || title,
          coverImage: fullImg,
          tags: extractTags(title),
          source: '懂车帝',
          sourceUrl: fullLink,
          publishedAt: new Date().toISOString().split('T')[0],
          isPublished: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    
    // 备用：搜索页面
    if (newsList.length === 0) {
      console.log(`[${source}] 尝试备用搜索...`);
      const searchUrl = 'https://www.dongche.cn/search?keyword=新能源汽车';
      const searchResponse = await axiosInstance.get(searchUrl);
      const $search = cheerio.load(searchResponse.data);
      
      $search('.result-item, .article').each((index, element) => {
        if (index >= 15) return;
        const title = $search(element).find('a').first().text().trim();
        if (title && title.length > 5) {
          const link = $search(element).find('a').first().attr('href');
          newsList.push({
            id: `${source}_news_${getMD5(title).substring(0, 8)}_${Date.now()}`,
            title: title.substring(0, 200),
            summary: '点击查看详情',
            content: title,
            coverImage: '',
            tags: extractTags(title),
            source: '懂车帝',
            sourceUrl: link || '',
            publishedAt: new Date().toISOString().split('T')[0],
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      });
    }
    
    await db.read();
    newsList.forEach(item => {
      const existingIndex = db.data.news.findIndex(n => n.title === item.title);
      if (existingIndex >= 0) {
        db.data.news[existingIndex] = { ...db.data.news[existingIndex], ...item, updatedAt: new Date().toISOString() };
      } else {
        db.data.news.unshift(item);
      }
    });
    await db.write();
    
    itemsCount = newsList.length;
    console.log(`[${source}] 成功抓取 ${itemsCount} 条新闻`);
    await logSync(source, 'news', 'success', itemsCount);
    
    return itemsCount;
  } catch (error) {
    console.error(`[${source}] 抓取新闻失败:`, error.message);
    await logSync(source, 'news', 'failed', 0, error.message);
    return 0;
  }
}

// ============ 易车爬虫 ============
export async function scrapeYicheNews() {
  const source = 'yiche';
  let itemsCount = 0;
  
  try {
    console.log(`[${source}] 开始抓取新闻...`);
    await logSync(source, 'news', 'running');
    
    const url = 'https://www.yiche.com/';
    const ua = getRandomUA();
    const axiosInstance = createAxiosInstance(ua);
    
    await randomDelay();
    const response = await axiosInstance.get(url);
    const $ = cheerio.load(response.data);
    
    const newsList = [];
    
    // 解析易车新闻
    $('.news-item, .article-item, .article, .list-item').each((index, element) => {
      if (index >= 20) return;
      
      const $item = $(element);
      const title = $item.find('.title, h3, h4, a').first().text().trim();
      const summary = $item.find('.summary, .desc, .intro').text().trim();
      const link = $item.find('a').first().attr('href');
      const img = $item.find('img').attr('src');
      
      if (title && title.length > 5) {
        const fullLink = link ? (link.startsWith('http') ? link : `https://www.yiche.com${link}`) : '';
        const fullImg = img && img.startsWith('//') ? `https:${img}` : (img || '');
        
        newsList.push({
          id: `${source}_news_${getMD5(title).substring(0, 8)}_${Date.now()}`,
          title: title.substring(0, 200),
          summary: summary ? summary.substring(0, 500) : '',
          content: summary || title,
          coverImage: fullImg,
          tags: extractTags(title),
          source: '易车',
          sourceUrl: fullLink,
          publishedAt: new Date().toISOString().split('T')[0],
          isPublished: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    
    await db.read();
    newsList.forEach(item => {
      const existingIndex = db.data.news.findIndex(n => n.title === item.title);
      if (existingIndex >= 0) {
        db.data.news[existingIndex] = { ...db.data.news[existingIndex], ...item, updatedAt: new Date().toISOString() };
      } else {
        db.data.news.unshift(item);
      }
    });
    await db.write();
    
    itemsCount = newsList.length;
    console.log(`[${source}] 成功抓取 ${itemsCount} 条新闻`);
    await logSync(source, 'news', 'success', itemsCount);
    
    return itemsCount;
  } catch (error) {
    console.error(`[${source}] 抓取新闻失败:`, error.message);
    await logSync(source, 'news', 'failed', 0, error.message);
    return 0;
  }
}

// ============ 车型数据爬虫 ============
export async function scrapeAutohomeModels() {
  const source = 'autohome';
  let itemsCount = 0;
  
  try {
    console.log(`[${source}] 开始抓取车型...`);
    await logSync(source, 'models', 'running');
    
    // 品牌列表页
    const url = 'https://www.autohome.com.cn/rank/0-0-0-0-0-0-0-0-1-0-0-1-0-0-0-0-1/';
    const ua = getRandomUA();
    const axiosInstance = createAxiosInstance(ua);
    
    await randomDelay();
    const response = await axiosInstance.get(url);
    const $ = cheerio.load(response.data);
    
    const brandsList = [];
    const modelsList = [];
    
    // 解析品牌
    $('.brand-item, .brand-list-item, .letter-content .brand').each((index, element) => {
      if (index >= 30) return;
      
      const $item = $(element);
      const name = $item.find('.brand-name, .name, h3').text().trim();
      const link = $item.find('a').first().attr('href');
      const logo = $item.find('img').attr('src');
      
      if (name) {
        const brandId = `${source}_brand_${getMD5(name).substring(0, 6)}`;
        brandsList.push({
          id: brandId,
          name: name,
          nameEn: name,
          logo: logo ? (logo.startsWith('//') ? `https:${logo}` : logo) : '',
          description: `${name} - 汽车之家品牌`,
          country: '中国',
          source: source,
          isActive: true,
          sortOrder: index,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        // 添加到车型列表
        modelsList.push({
          id: `${brandId}_model_${Date.now()}`,
          brandId: brandId,
          name: `${name} 系列车型`,
          price: '暂无报价',
          image: logo ? (logo.startsWith('//') ? `https:${logo}` : logo) : '',
          specs: {},
          source: source,
          sourceUrl: link ? `https://www.autohome.com.cn${link}` : '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    
    // 如果解析不到，使用默认品牌
    if (brandsList.length === 0) {
      console.log(`[${source}] 使用默认品牌数据...`);
      const defaultBrands = ['比亚迪', '特斯拉', '理想', '蔚来', '小鹏', '小米', '吉利', '长城', '长安', '奇瑞'];
      defaultBrands.forEach((name, index) => {
        const brandId = `${source}_brand_${getMD5(name).substring(0, 6)}`;
        brandsList.push({
          id: brandId,
          name: name,
          nameEn: name,
          logo: '',
          description: `${name} - 汽车之家品牌`,
          country: '中国',
          source: source,
          isActive: true,
          sortOrder: index,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
    }
    
    await db.read();
    
    // 保存品牌
    brandsList.forEach(item => {
      const existingIndex = db.data.brands.findIndex(b => b.name === item.name);
      if (existingIndex >= 0) {
        db.data.brands[existingIndex] = { ...db.data.brands[existingIndex], ...item, updatedAt: new Date().toISOString() };
      } else {
        db.data.brands.push(item);
      }
    });
    
    // 保存车型
    modelsList.forEach(item => {
      const existingIndex = db.data.models.findIndex(m => m.name === item.name);
      if (existingIndex >= 0) {
        db.data.models[existingIndex] = { ...db.data.models[existingIndex], ...item, updatedAt: new Date().toISOString() };
      } else {
        db.data.models.push(item);
      }
    });
    
    await db.write();
    
    itemsCount = brandsList.length;
    console.log(`[${source}] 成功抓取 ${itemsCount} 个品牌`);
    await logSync(source, 'models', 'success', itemsCount);
    
    return itemsCount;
  } catch (error) {
    console.error(`[${source}] 抓取车型失败:`, error.message);
    await logSync(source, 'models', 'failed', 0, error.message);
    return 0;
  }
}

// ============ 懂车帝车型 ============
export async function scrapeDongCheDiModels() {
  const source = 'dongchedi';
  let itemsCount = 0;
  
  try {
    console.log(`[${source}] 开始抓取车型...`);
    await logSync(source, 'models', 'running');
    
    const url = 'https://www.dongche.cn/brand/';
    const ua = getRandomUA();
    const axiosInstance = createAxiosInstance(ua);
    
    await randomDelay();
    const response = await axiosInstance.get(url);
    const $ = cheerio.load(response.data);
    
    const brandsList = [];
    
    $('.brand-item, .brand-list-item, .item').each((index, element) => {
      if (index >= 20) return;
      
      const $item = $(element);
      const name = $item.find('.name, h3, a').first().text().trim();
      const logo = $item.find('img').attr('src');
      
      if (name && name.length > 1) {
        const brandId = `${source}_brand_${getMD5(name).substring(0, 6)}`;
        brandsList.push({
          id: brandId,
          name: name,
          nameEn: name,
          logo: logo ? (logo.startsWith('//') ? `https:${logo}` : logo) : '',
          description: `${name} - 懂车帝品牌`,
          country: '中国',
          source: source,
          isActive: true,
          sortOrder: index,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    
    if (brandsList.length === 0) {
      // 备用品牌数据
      const defaultBrands = ['比亚迪', '特斯拉', '理想', '蔚来', '小鹏'];
      defaultBrands.forEach((name, index) => {
        const brandId = `${source}_brand_${getMD5(name).substring(0, 6)}`;
        brandsList.push({
          id: brandId,
          name: name,
          nameEn: name,
          logo: '',
          description: `${name} - 懂车帝品牌`,
          country: '中国',
          source: source,
          isActive: true,
          sortOrder: index,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
    }
    
    await db.read();
    brandsList.forEach(item => {
      const existingIndex = db.data.brands.findIndex(b => b.name === item.name && b.source === source);
      if (existingIndex >= 0) {
        db.data.brands[existingIndex] = { ...db.data.brands[existingIndex], ...item, updatedAt: new Date().toISOString() };
      } else {
        db.data.brands.push(item);
      }
    });
    await db.write();
    
    itemsCount = brandsList.length;
    console.log(`[${source}] 成功抓取 ${itemsCount} 个品牌`);
    await logSync(source, 'models', 'success', itemsCount);
    
    return itemsCount;
  } catch (error) {
    console.error(`[${source}] 抓取车型失败:`, error.message);
    await logSync(source, 'models', 'failed', 0, error.message);
    return 0;
  }
}

// ============ 易车车型 ============
export async function scrapeYicheModels() {
  const source = 'yiche';
  let itemsCount = 0;
  
  try {
    console.log(`[${source}] 开始抓取车型...`);
    await logSync(source, 'models', 'running');
    
    const url = 'https://www.yiche.com/brand/';
    const ua = getRandomUA();
    const axiosInstance = createAxiosInstance(ua);
    
    await randomDelay();
    const response = await axiosInstance.get(url);
    const $ = cheerio.load(response.data);
    
    const brandsList = [];
    
    $('.brand-item, .brand-list-item, .item, .brand').each((index, element) => {
      if (index >= 20) return;
      
      const $item = $(element);
      const name = $item.find('.name, h3, a').first().text().trim();
      const logo = $item.find('img').attr('src');
      
      if (name && name.length > 1) {
        const brandId = `${source}_brand_${getMD5(name).substring(0, 6)}`;
        brandsList.push({
          id: brandId,
          name: name,
          nameEn: name,
          logo: logo ? (logo.startsWith('//') ? `https:${logo}` : logo) : '',
          description: `${name} - 易车品牌`,
          country: '中国',
          source: source,
          isActive: true,
          sortOrder: index,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    
    if (brandsList.length === 0) {
      const defaultBrands = ['比亚迪', '特斯拉', '理想', '蔚来', '小鹏', '小米'];
      defaultBrands.forEach((name, index) => {
        const brandId = `${source}_brand_${getMD5(name).substring(0, 6)}`;
        brandsList.push({
          id: brandId,
          name: name,
          nameEn: name,
          logo: '',
          description: `${name} - 易车品牌`,
          country: '中国',
          source: source,
          isActive: true,
          sortOrder: index,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
    }
    
    await db.read();
    brandsList.forEach(item => {
      const existingIndex = db.data.brands.findIndex(b => b.name === item.name && b.source === source);
      if (existingIndex >= 0) {
        db.data.brands[existingIndex] = { ...db.data.brands[existingIndex], ...item, updatedAt: new Date().toISOString() };
      } else {
        db.data.brands.push(item);
      }
    });
    await db.write();
    
    itemsCount = brandsList.length;
    console.log(`[${source}] 成功抓取 ${itemsCount} 个品牌`);
    await logSync(source, 'models', 'success', itemsCount);
    
    return itemsCount;
  } catch (error) {
    console.error(`[${source}] 抓取车型失败:`, error.message);
    await logSync(source, 'models', 'failed', 0, error.message);
    return 0;
  }
}

// ============ 工具函数 ============

// 从标题提取标签
function extractTags(title) {
  const tagKeywords = {
    '新能源汽车': ['新能源', '电动车', '纯电'],
    '比亚迪': ['比亚迪', 'BYD', '秦', '汉', '唐', '宋', '元', '海豹', '海狮'],
    '特斯拉': ['特斯拉', 'Tesla', 'Model 3', 'Model Y', 'Model S', 'Model X'],
    '销量': ['销量', '交付', '成绩', '突破'],
    '上市': ['上市', '发布', '预售', '亮相'],
    '技术': ['技术', '电池', '智驾', '自动驾驶'],
    '出海': ['出海', '海外', '出口', '欧洲', '东南亚']
  };
  
  const tags = [];
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some(kw => title.includes(kw))) {
      tags.push(tag);
    }
  }
  
  return tags.length > 0 ? tags : ['行业动态'];
}

// 记录同步日志
async function logSync(source, type, status, itemsCount = 0, errorMessage = '') {
  try {
    await db.read();
    const logId = `${source}_${type}_${Date.now()}`;
    const existingLog = db.data.syncLogs.find(l => l.source === source && l.type === type && l.status === 'running');
    
    if (existingLog) {
      existingLog.status = status;
      existingLog.itemsCount = itemsCount;
      existingLog.errorMessage = errorMessage;
      existingLog.completedAt = new Date().toISOString();
    } else {
      db.data.syncLogs.push({
        id: logId,
        source: source,
        type: type,
        status: status,
        itemsCount: itemsCount,
        errorMessage: errorMessage,
        startedAt: new Date().toISOString(),
        completedAt: status === 'running' ? null : new Date().toISOString()
      });
    }
    
    await db.write();
  } catch (error) {
    console.error('记录同步日志失败:', error.message);
  }
}

// ============ 完整同步函数 ============

// 全量同步所有平台
export async function runFullSync() {
  console.log('========== 开始全量数据同步 ==========');
  const results = {
    news: { autohome: 0, dongchedi: 0, yiche: 0 },
    models: { autohome: 0, dongchedi: 0, yiche: 0 }
  };
  
  // 串行执行，避免请求过快
  try {
    results.news.autohome = await scrapeAutohomeNews();
    await randomDelay();
    
    results.news.dongchedi = await scrapeDongCheDiNews();
    await randomDelay();
    
    results.news.yiche = await scrapeYicheNews();
    await randomDelay();
    
    results.models.autohome = await scrapeAutohomeModels();
    await randomDelay();
    
    results.models.dongchedi = await scrapeDongCheDiModels();
    await randomDelay();
    
    results.models.yiche = await scrapeYicheModels();
  } catch (error) {
    console.error('全量同步出错:', error);
  }
  
  console.log('========== 全量同步完成 ==========', results);
  return results;
}

// 增量同步
export async function runIncrementalSync() {
  console.log('========== 开始增量数据同步 ==========');
  
  // 增量同步新闻（更频繁）
  await scrapeAutohomeNews();
  await randomDelay();
  await scrapeDongCheDiNews();
  await randomDelay();
  await scrapeYicheNews();
  
  console.log('========== 增量同步完成 ==========');
}

// 单独同步新闻
export async function syncAllNews() {
  const results = { autohome: 0, dongchedi: 0, yiche: 0 };
  
  results.autohome = await scrapeAutohomeNews();
  await randomDelay();
  results.dongchedi = await scrapeDongCheDiNews();
  await randomDelay();
  results.yiche = await scrapeYicheNews();
  
  return results;
}

// 单独同步车型
export async function syncAllModels() {
  const results = { autohome: 0, dongchedi: 0, yiche: 0 };
  
  results.autohome = await scrapeAutohomeModels();
  await randomDelay();
  results.dongchedi = await scrapeDongCheDiModels();
  await randomDelay();
  results.yiche = await scrapeYicheModels();
  
  return results;
}

// 导出配置
export { antiCrawlConfig, getImageInfo };
