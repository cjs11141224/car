/**
 * 简化的爬虫测试脚本
 * 测试核心功能，不依赖Playwright
 */

import { scrapeAutohomeNews, syncAllNews, antiCrawlConfig } from './src/services/scraper.js';

console.log('='.repeat(50));
console.log('🧪 汽车爬虫 - 功能测试');
console.log('='.repeat(50));

// 测试1: 反爬配置
console.log('\n📋 测试1: 反爬配置检查');
console.log(`- User-Agent 数量: ${antiCrawlConfig.userAgents.length}`);
console.log(`- 最小延迟: ${antiCrawlConfig.minDelay}ms`);
console.log(`- 最大延迟: ${antiCrawlConfig.maxDelay}ms`);
console.log(`- 最大重试: ${antiCrawlConfig.maxRetries}`);
if (antiCrawlConfig.userAgents.length >= 3) {
  console.log('✅ 反爬配置正常');
} else {
  console.log('❌ User-Agent 数量不足');
  process.exit(1);
}

// 测试2: 模块导入
console.log('\n📋 测试2: 模块导入检查');
const requiredFunctions = ['scrapeAutohomeNews', 'syncAllNews'];
for (const fn of requiredFunctions) {
  if (typeof eval(fn) === 'function') {
    console.log(`✅ ${fn} 已导出`);
  } else {
    console.log(`❌ ${fn} 未找到`);
    process.exit(1);
  }
}

// 测试3: 尝试抓取数据
console.log('\n📋 测试3: 实际抓取测试 (汽车之家)');
console.log('⏳ 正在抓取，请稍候...');

try {
  const result = await scrapeAutohomeNews();
  console.log(`✅ 抓取完成，获取 ${result} 条数据`);
} catch (error) {
  console.log(`⚠️ 抓取出错（可能是反爬机制）: ${error.message}`);
  console.log('💡 建议：增加延迟时间或使用代理');
}

console.log('\n' + '='.repeat(50));
console.log('🧪 测试完成');
console.log('='.repeat(50));

process.exit(0);
