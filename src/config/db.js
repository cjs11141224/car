/**
 * 简化版数据库 - 内存存储
 * 适合 Vercel 无服务器环境
 */

const defaultData = {
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
  ],
  news: [
    { id: 'news_1', title: '比亚迪2025年销量突破400万辆', summary: '比亚迪公布2025年全年销量数据，再次蝉联新能源汽车销量冠军', content: '比亚迪2025年全年销量突破400万辆，同比增长超过30%。其中新能源车型占比超过95%。', coverImage: '', tags: ['比亚迪', '销量'], source: '汽车之家', sourceUrl: '', publishedAt: new Date().toISOString().split('T')[0], isPublished: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'news_2', title: '特斯拉上海工厂产能提升', summary: '特斯拉上海超级工厂产能持续提升，月产能达到10万辆', content: '特斯拉上海超级工厂传来好消息，产能持续攀升，月产能已突破10万辆。', coverImage: '', tags: ['特斯拉', '产能'], source: '懂车帝', sourceUrl: '', publishedAt: new Date().toISOString().split('T')[0], isPublished: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'news_3', title: '新能源汽车出海欧洲持续增长', summary: '中国新能源汽车品牌在欧洲市场表现强劲，出口量持续攀升', content: '2025年中国新能源汽车出口欧洲持续增长，比亚迪、蔚来、小鹏等品牌表现亮眼。', coverImage: '', tags: ['出海', '欧洲'], source: '易车', sourceUrl: '', publishedAt: new Date().toISOString().split('T')[0], isPublished: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'news_4', title: '固态电池技术取得突破', summary: '多家车企宣布固态电池技术取得重大突破，续航将突破1000公里', content: '固态电池技术传来好消息，多家车企宣布技术突破，未来续航将突破1000公里。', coverImage: '', tags: ['技术', '电池'], source: '汽车之家', sourceUrl: '', publishedAt: new Date().toISOString().split('T')[0], isPublished: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  leads: [],
  users: [],
  syncLogs: []
};

// 内存数据库
let db = {
  data: { ...defaultData },
  read: async function() {},
  write: async function() {}
};

export default db;

export function resetDb() {
  db.data = JSON.parse(JSON.stringify(defaultData));
}
