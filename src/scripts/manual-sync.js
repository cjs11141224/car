/**
 * 手动同步脚本
 * 用于手动触发数据同步
 */

import { syncAllNews, syncAllModels, runFullSync } from '../src/services/scraper.js';

async function main() {
  console.log('🚀 开始手动数据同步...');
  
  try {
    const mode = process.argv[2];
    
    if (mode === 'news') {
      console.log('📰 仅同步新闻...');
      const results = await syncAllNews();
      console.log('新闻同步完成:', results);
    } else if (mode === 'models') {
      console.log('🚗 仅同步车型...');
      const results = await syncAllModels();
      console.log('车型同步完成:', results);
    } else {
      console.log('🔄 完整同步...');
      const results = await runFullSync();
      console.log('完整同步完成:', results);
    }
    
    console.log('✅ 同步任务完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 同步失败:', error);
    process.exit(1);
  }
}

main();
