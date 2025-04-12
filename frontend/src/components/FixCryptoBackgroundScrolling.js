/**
 * 加密货币背景滚动修复脚本
 * 用于恢复应用了加密货币背景后页面的滚动功能
 * 
 * 使用说明：
 * 在需要修复滚动问题的HTML页面底部添加:
 * <script type="module" src="components/FixCryptoBackgroundScrolling.js"></script>
 */

// 检查并移除影响滚动的内容容器
function fixScrolling() {
    // 检查页面上是否有内容容器
    const contentContainer = document.querySelector('.content-container');
    if (!contentContainer) return;
    
    console.log('找到内容容器，正在修复滚动问题...');
    
    // 获取内容容器中的所有子元素
    const children = Array.from(contentContainer.children);
    
    // 将子元素移回body
    children.forEach(child => {
        document.body.appendChild(child);
    });
    
    // 删除空的内容容器
    contentContainer.remove();
    
    // 确保body可以滚动
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    
    console.log('滚动问题修复完成');
}

// 页面加载完成后执行修复
document.addEventListener('DOMContentLoaded', fixScrolling);

// 尝试立即执行一次，处理已完成加载的页面
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    fixScrolling();
} 