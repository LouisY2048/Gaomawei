/**
 * 加密货币背景应用工具脚本
 * 
 * 使用说明：
 * 1. 在 HTML 文件的 <head> 中添加：
 *    <link rel="stylesheet" href="components/CryptoBackground.css">
 * 
 * 2. 在 <body> 结束前添加：
 *    <script type="module" src="components/ApplyCryptoBackgroundToPage.js"></script>
 */

import initCryptoBackground from './CryptoBackground.js';

// 页面加载完成后自动初始化加密货币背景
document.addEventListener('DOMContentLoaded', function() {
    console.log('正在应用加密货币背景');
    initCryptoBackground();
    
    // 确保页面可以滚动
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
}); 