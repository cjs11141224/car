/**
 * 汽车信息平台 - 服务端入口
 * 支持 Vercel 无服务器部署
 */

import express from 'express';
import cors from 'cors';

// 内存数据库（适合无服务器环境）
const db = {
  brands: [
    { id: 'byd', name: '比亚迪', nameEn: 'BYD', logo: '', description: '新能源汽车领导者', country: '中国', source: 'default', isActive: true, sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'tesla', name: '特斯拉', nameEn: 'Tesla', logo: '', description: '全球电动汽车领导者', country: '美国', source: 'default', isActive: true, sortOrder: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'nio', name: '蔚来', nameEn: 'NIO', logo: '', description: '高端智能电动汽车', country: '中国', source: 'default', isActive: true, sortOrder: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'xpeng', name: '小鹏', nameEn: 'XPeng', logo: '', description: '智能电动汽车', country: '中国', source: 'default', isActive: true, sortOrder: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'li-auto', name: '理想', nameEn: 'Li Auto', logo: '', description: '增程式电动汽车', country: '中国', source: 'default', isActive: true, sortOrder: 5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  models: [
    { id: 'byd_han', brandId: 'byd', name: '比亚迪汉', price: '20.98-33.18万', image: '', specs: {}, source: 'default', sourceUrl: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'byd_qin', brandId: 'byd', name: '比亚迪秦', price: '9.98-20.99万', image: '', specs: {}, source: 'default', sourceUrl: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'tesla_model3', brandId: 'tesla', name: '特斯拉Model 3', price: '24.59-33.59万', image: '', specs: {}, source: 'default', sourceUrl: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'tesla_modely', brandId: 'tesla', name: '特斯拉Model Y', price: '26.39-36.39万', image: '', specs: {}, source: 'default', sourceUrl: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'nio_et7', brandId: 'nio', name: '蔚来ET7', price: '42.8-51.6万', image: '', specs: {}, source: 'default', sourceUrl: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'xpeng_p7', brandId: 'xpeng', name: '小鹏P7', price: '20.99-33.99万', image: '', specs: {}, source: 'default', sourceUrl: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'li_l9', brandId: 'li-auto', name: '理想L9', price: '42.98-45.98万', image: '', specs: {}, source: 'default', sourceUrl: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  news: [
    { id: 'news_1', title: '比亚迪2025年销量突破400万辆', summary: '比亚迪公布2025年全年销量数据，再次蝉联新能源汽车销量冠军', content: '比亚迪2025年全年销量突破400万辆，同比增长超过30%。其中新能源车型占比超过95%。', coverImage: '', tags: ['比亚迪', '销量'], source: '汽车之家', sourceUrl: '', publishedAt: new Date().toISOString().split('T')[0], isPublished: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'news_2', title: '特斯拉上海工厂产能提升', summary: '特斯拉上海超级工厂产能持续提升，月产能达到10万辆', content: '特斯拉上海超级工厂传来好消息，产能持续攀升，月产能已突破10万辆。', coverImage: '', tags: ['特斯拉', '产能'], source: '懂车帝', sourceUrl: '', publishedAt: new Date().toISOString().split('T')[0], isPublished: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'news_3', title: '新能源汽车出海欧洲持续增长', summary: '中国新能源汽车品牌在欧洲市场表现强劲，出口量持续攀升', content: '2025年中国新能源汽车出口欧洲持续增长，比亚迪、蔚来、小鹏等品牌表现亮眼。', coverImage: '', tags: ['出海', '欧洲'], source: '易车', sourceUrl: '', publishedAt: new Date().toISOString().split('T')[0], isPublished: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'news_4', title: '固态电池技术取得突破', summary: '多家车企宣布固态电池技术取得重大突破，续航将突破1000公里', content: '固态电池技术传来好消息，多家车企宣布技术突破，未来续航将突破1000公里。', coverImage: '', tags: ['技术', '电池'], source: '汽车之家', sourceUrl: '', publishedAt: new Date().toISOString().split('T')[0], isPublished: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'news_5', title: '小鹏汽车获欧盟认证', summary: '小鹏汽车获得欧盟WVTA认证，加速进入欧洲市场', content: '小鹏汽车官方宣布，旗下多款车型获得欧盟WVTA认证，为进入欧洲市场扫清障碍。', coverImage: '', tags: ['小鹏', '认证'], source: '汽车之家', sourceUrl: '', publishedAt: new Date().toISOString().split('T')[0], isPublished: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  leads: [],
  syncLogs: []
};

const app = express();

app.use(cors());
app.use(express.json());

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 获取所有品牌
app.get('/api/brands', (req, res) => {
  res.json(db.brands);
});

// 获取单个品牌
app.get('/api/brands/:id', (req, res) => {
  const brand = db.brands.find(b => b.id === req.params.id);
  if (brand) {
    res.json(brand);
  } else {
    res.status(404).json({ error: 'Brand not found' });
  }
});

// 获取所有车型
app.get('/api/models', (req, res) => {
  const { brandId } = req.query;
  if (brandId) {
    res.json(db.models.filter(m => m.brandId === brandId));
  } else {
    res.json(db.models);
  }
});

// 获取单个车型
app.get('/api/models/:id', (req, res) => {
  const model = db.models.find(m => m.id === req.params.id);
  if (model) {
    res.json(model);
  } else {
    res.status(404).json({ error: 'Model not found' });
  }
});

// 获取所有新闻
app.get('/api/news', (req, res) => {
  const { publishedOnly } = req.query;
  if (publishedOnly === 'true') {
    res.json(db.news.filter(n => n.isPublished));
  } else {
    res.json(db.news);
  }
});

// 获取单个新闻
app.get('/api/news/:id', (req, res) => {
  const news = db.news.find(n => n.id === req.params.id);
  if (news) {
    res.json(news);
  } else {
    res.status(404).json({ error: 'News not found' });
  }
});

// 获取统计
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalBrands: db.brands.length,
    totalModels: db.models.length,
    totalNews: db.news.length,
    totalLeads: db.leads.length,
    lastSync: new Date().toISOString()
  });
});

// 线索管理
app.get('/api/leads', (req, res) => {
  res.json(db.leads);
});

app.post('/api/leads', (req, res) => {
  const lead = {
    id: 'lead_' + Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  db.leads.push(lead);
  res.json(lead);
});

// Vercel 处理器
export default app;
