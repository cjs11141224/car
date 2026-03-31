/**
 * 汽车信息平台 - 服务端
 * 支持 Vercel 部署
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 内存数据库
const db = {
  brands: [
    { id: 'byd', name: '比亚迪', nameEn: 'BYD', logo: '', description: '新能源汽车领导者', country: '中国', source: 'default', isActive: true, sortOrder: 1 },
    { id: 'tesla', name: '特斯拉', nameEn: 'Tesla', logo: '', description: '全球电动汽车领导者', country: '美国', source: 'default', isActive: true, sortOrder: 2 },
    { id: 'nio', name: '蔚来', nameEn: 'NIO', logo: '', description: '高端智能电动汽车', country: '中国', source: 'default', isActive: true, sortOrder: 3 },
    { id: 'xpeng', name: '小鹏', nameEn: 'XPeng', logo: '', description: '智能电动汽车', country: '中国', source: 'default', isActive: true, sortOrder: 4 },
    { id: 'li-auto', name: '理想', nameEn: 'Li Auto', logo: '', description: '增程式电动汽车', country: '中国', source: 'default', isActive: true, sortOrder: 5 },
  ],
  models: [
    { id: 'byd_han', brandId: 'byd', name: '比亚迪汉', price: '20.98-33.18万' },
    { id: 'byd_qin', brandId: 'byd', name: '比亚迪秦', price: '9.98-20.99万' },
    { id: 'tesla_model3', brandId: 'tesla', name: '特斯拉Model 3', price: '24.59-33.59万' },
    { id: 'tesla_modely', brandId: 'tesla', name: '特斯拉Model Y', price: '26.39-36.39万' },
    { id: 'nio_et7', brandId: 'nio', name: '蔚来ET7', price: '42.8-51.6万' },
    { id: 'xpeng_p7', brandId: 'xpeng', name: '小鹏P7', price: '20.99-33.99万' },
    { id: 'li_l9', brandId: 'li-auto', name: '理想L9', price: '42.98-45.98万' },
  ],
  news: [
    { id: 'news_1', title: '比亚迪2025年销量突破400万辆', summary: '比亚迪公布2025年全年销量数据，再次蝉联新能源汽车销量冠军', source: '汽车之家', publishedAt: '2026-03-31', isPublished: true },
    { id: 'news_2', title: '特斯拉上海工厂产能提升', summary: '特斯拉上海超级工厂产能持续提升，月产能达到10万辆', source: '懂车帝', publishedAt: '2026-03-31', isPublished: true },
    { id: 'news_3', title: '新能源汽车出海欧洲持续增长', summary: '中国新能源汽车品牌在欧洲市场表现强劲', source: '易车', publishedAt: '2026-03-31', isPublished: true },
    { id: 'news_4', title: '固态电池技术取得突破', summary: '多家车企宣布固态电池技术取得重大突破', source: '汽车之家', publishedAt: '2026-03-31', isPublished: true },
    { id: 'news_5', title: '小鹏汽车获欧盟认证', summary: '小鹏汽车获得欧盟WVTA认证', source: '汽车之家', publishedAt: '2026-03-31', isPublished: true },
  ],
  leads: []
};

const app = express();
app.use(cors());
app.use(express.json());

// 首页 - 返回 HTML
app.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>新能源汽车出海平台</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
        header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 40px 20px; text-align: center; }
        header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .section { background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .section h2 { color: #1a1a2e; margin-bottom: 20px; }
        .brands { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
        .brand-card { background: #f8f9fa; border-radius: 10px; padding: 20px; text-align: center; }
        .brand-card h3 { color: #1a1a2e; }
        .models { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .model-card { border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; }
        .model-card h3 { color: #1a1a2e; }
        .model-card .price { color: #4f46e5; font-size: 1.3rem; font-weight: 600; margin: 10px 0; }
        .news { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .news-card { border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; }
        .news-card h3 { color: #1a1a2e; margin-bottom: 10px; }
        .news-card .source { display: inline-block; background: #f0f0f0; padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; text-align: center; }
        .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px; }
        .stat-card .number { font-size: 2.5rem; font-weight: 700; }
        .loading { text-align: center; padding: 40px; color: #999; }
    </style>
</head>
<body>
    <header>
        <h1>🚗 新能源汽车出海平台</h1>
        <p>中国新能源汽车品牌展示与海外市场信息平台</p>
    </header>
    <div class="container">
        <div class="section">
            <h2>📊 数据统计</h2>
            <div class="stats">
                <div class="stat-card"><div class="number" id="brand-count">-</div><div>品牌数量</div></div>
                <div class="stat-card"><div class="number" id="model-count">-</div><div>车型数量</div></div>
                <div class="stat-card"><div class="number" id="news-count">-</div><div>新闻资讯</div></div>
            </div>
        </div>
        <div class="section">
            <h2>🏭 品牌展示</h2>
            <div class="brands" id="brands"></div>
        </div>
        <div class="section">
            <h2>🚙 热门车型</h2>
            <div class="models" id="models"></div>
        </div>
        <div class="section">
            <h2>📰 最新资讯</h2>
            <div class="news" id="news"></div>
        </div>
    </div>
    <script>
        const API = '';
        fetch(API + '/api/brands').then(r=>r.json()).then(d=>{document.getElementById('brand-count').innerText=d.length;document.getElementById('brands').innerHTML=d.map(b=>'<div class="brand-card"><h3>'+b.name+'</h3><p>'+(b.nameEn||'')+'</p></div>').join('')});
        fetch(API + '/api/models').then(r=>r.json()).then(d=>{document.getElementById('model-count').innerText=d.length;document.getElementById('models').innerHTML=d.map(m=>'<div class="model-card"><h3>'+m.name+'</h3><div class="price">'+(m.price||'暂无报价')+'</div></div>').join('')});
        fetch(API + '/api/news?publishedOnly=true').then(r=>r.json()).then(d=>{document.getElementById('news-count').innerText=d.length;document.getElementById('news').innerHTML=d.map(n=>'<div class="news-card"><h3>'+n.title+'</h3><p>'+(n.summary||'')+'</p><span class="source">'+n.source+'</span></div>').join('')});
    </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// API 路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/brands', (req, res) => res.json(db.brands));
app.get('/api/brands/:id', (req, res) => {
  const brand = db.brands.find(b => b.id === req.params.id);
  brand ? res.json(brand) : res.status(404).json({ error: 'Not found' });
});

app.get('/api/models', (req, res) => {
  const { brandId } = req.query;
  res.json(brandId ? db.models.filter(m => m.brandId === brandId) : db.models);
});
app.get('/api/models/:id', (req, res) => {
  const model = db.models.find(m => m.id === req.params.id);
  model ? res.json(model) : res.status(404).json({ error: 'Not found' });
});

app.get('/api/news', (req, res) => {
  const { publishedOnly } = req.query;
  res.json(publishedOnly === 'true' ? db.news.filter(n => n.isPublished) : db.news);
});
app.get('/api/news/:id', (req, res) => {
  const news = db.news.find(n => n.id === req.params.id);
  news ? res.json(news) : res.status(404).json({ error: 'Not found' });
});

app.get('/api/dashboard/stats', (req, res) => res.json({
  totalBrands: db.brands.length,
  totalModels: db.models.length,
  totalNews: db.news.length,
  totalLeads: db.leads.length
}));

app.post('/api/leads', (req, res) => {
  const lead = { id: 'lead_' + Date.now(), ...req.body };
  db.leads.push(lead);
  res.json(lead);
});
app.get('/api/leads', (req, res) => res.json(db.leads));

export default app;
