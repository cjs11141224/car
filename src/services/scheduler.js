/**
 * 定时任务调度器 - 优化版
 * 支持多频率更新
 */

import cron from 'node-cron';
import { 
  runFullSync, 
  runIncrementalSync,
  syncAllNews,
  syncAllModels,
  scrapeAutohomeNews,
  scrapeDongCheDiNews,
  scrapeYicheNews 
} from './scraper.js';

// 定时任务实例
const jobs = {};

export function initScheduler() {
  console.log('🕐 初始化定时任务调度器...');
  
  // ===== 新闻同步任务 =====
  
  // 汽车之家新闻：每2小时
  jobs.autohomeNews = cron.schedule('0 */2 * * *', async () => {
    console.log('⏰ 触发: 汽车之家新闻同步');
    try {
      await scrapeAutohomeNews();
    } catch (error) {
      console.error('汽车之家新闻同步失败:', error);
    }
  }, {
    timezone: 'Asia/Shanghai'
  });
  console.log('✅ 汽车之家新闻: 每2小时');
  
  // 懂车帝新闻：每3小时
  jobs.dongchediNews = cron.schedule('0 */3 * * *', async () => {
    console.log('⏰ 触发: 懂车帝新闻同步');
    try {
      await scrapeDongCheDiNews();
    } catch (error) {
      console.error('懂车帝新闻同步失败:', error);
    }
  }, {
    timezone: 'Asia/Shanghai'
  });
  console.log('✅ 懂车帝新闻: 每3小时');
  
  // 易车新闻：每4小时
  jobs.yicheNews = cron.schedule('0 */4 * * *', async () => {
    console.log('⏰ 触发: 易车新闻同步');
    try {
      await scrapeYicheNews();
    } catch (error) {
      console.error('易车新闻同步失败:', error);
    }
  }, {
    timezone: 'Asia/Shanghai'
  });
  console.log('✅ 易车新闻: 每4小时');
  
  // ===== 车型同步任务 =====
  
  // 车型数据：每天凌晨3点（避开高峰期）
  jobs.modelsSync = cron.schedule('0 3 * * *', async () => {
    console.log('⏰ 触发: 车型数据同步');
    try {
      const results = await syncAllModels();
      console.log('车型同步结果:', results);
    } catch (error) {
      console.error('车型同步失败:', error);
    }
  }, {
    timezone: 'Asia/Shanghai'
  });
  console.log('✅ 车型数据: 每天凌晨3点');
  
  // ===== 完整同步任务 =====
  
  // 完整同步：每天中午12点
  jobs.fullSync = cron.schedule('0 12 * * *', async () => {
    console.log('⏰ 触发: 完整数据同步');
    try {
      await runFullSync();
    } catch (error) {
      console.error('完整同步失败:', error);
    }
  }, {
    timezone: 'Asia/Shanghai'
  });
  console.log('✅ 完整同步: 每天中午12点');
  
  // ===== 数据校验任务 =====
  
  // 数据校验：每天凌晨4点
  jobs.validation = cron.schedule('0 4 * * *', async () => {
    console.log('⏰ 触发: 数据校验');
    try {
      await validateData();
    } catch (error) {
      console.error('数据校验失败:', error);
    }
  }, {
    timezone: 'Asia/Shanghai'
  });
  console.log('✅ 数据校验: 每天凌晨4点');
  
  console.log('🎉 所有定时任务已启动!');
  console.log('=======================');
  
  // 启动时执行一次初始同步
  console.log('🚀 执行初始数据同步...');
  runFullSync().catch(console.error);
  
  return jobs;
}

// 数据校验函数
async function validateData() {
  console.log('开始数据校验...');
  
  try {
    const db = (await import('../config/db.js')).default;
    await db.read();
    
    let newsValidCount = 0;
    let newsInvalidCount = 0;
    let modelsValidCount = 0;
    let modelsInvalidCount = 0;
    
    // 校验新闻
    for (const news of db.data.news) {
      const isValid = news.title && news.title.length > 5 && news.source;
      if (isValid) {
        newsValidCount++;
      } else {
        newsInvalidCount++;
        console.log(`无效新闻: ${news.id}`);
      }
    }
    
    // 校验车型
    for (const model of db.data.models) {
      const isValid = model.name && model.brandId;
      if (isValid) {
        modelsValidCount++;
      } else {
        modelsInvalidCount++;
        console.log(`无效车型: ${model.id}`);
      }
    }
    
    console.log(`数据校验完成: 新闻(${newsValidCount}有效/${newsInvalidCount}无效), 车型(${modelsValidCount}有效/${modelsInvalidCount}无效)`);
    
    // 记录校验日志
    db.data.syncLogs.push({
      id: `validation_${Date.now()}`,
      source: 'system',
      type: 'validation',
      status: 'success',
      itemsCount: newsValidCount + modelsValidCount,
      errorMessage: newsInvalidCount > 0 || modelsInvalidCount > 0 ? `无效数据: 新闻${newsInvalidCount}, 车型${modelsInvalidCount}` : '',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    });
    await db.write();
    
  } catch (error) {
    console.error('数据校验出错:', error);
  }
}

// 停止所有定时任务
export function stopScheduler() {
  console.log('🛑 停止所有定时任务...');
  Object.values(jobs).forEach(job => job.stop());
  console.log('✅ 所有定时任务已停止');
}
