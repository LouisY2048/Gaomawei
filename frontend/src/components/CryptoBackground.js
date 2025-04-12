/**
 * 加密货币背景初始化函数
 * 为页面添加动态加密货币背景效果
 */
function initCryptoBackground() {
    // 创建背景元素
    const backgroundElements = document.createElement('div');
    backgroundElements.className = 'crypto-background-elements';
    backgroundElements.style.position = 'fixed';
    backgroundElements.style.top = '0';
    backgroundElements.style.left = '0';
    backgroundElements.style.width = '100%';
    backgroundElements.style.height = '100%';
    backgroundElements.style.zIndex = '-1';
    backgroundElements.style.pointerEvents = 'none';
    backgroundElements.innerHTML = `
        <div class="grid"></div>
        <div class="crypto-symbols" id="crypto-symbols"></div>
        <div class="data-stream" id="data-streams"></div>
        <div class="spotlight"></div>
        <div class="bitcoin-logo"></div>
    `;
    
    // 将背景元素添加到 body
    document.body.prepend(backgroundElements);
    
    // 为 body 添加加密货币主题类
    document.body.classList.add('crypto-theme');
    
    // 不再创建容器，保持原有DOM结构以确保滚动正常
    // 仅确保页面内容能够正常堆叠在背景之上
    document.body.style.position = 'relative';
    document.body.style.zIndex = '1';
    
    // 添加加密货币符号
    const symbols = ['₿', 'Ξ', 'Ł', 'Ƀ', 'Ⱥ', 'Ɇ', '₮', '₳', 'Ɏ', 'Ȅ'];
    const symbolsContainer = document.getElementById('crypto-symbols');
    
    for (let i = 0; i < 20; i++) {
        const symbol = document.createElement('div');
        symbol.className = 'symbol';
        symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        symbol.style.left = Math.random() * 100 + '%';
        symbol.style.animationDelay = Math.random() * 15 + 's';
        symbolsContainer.appendChild(symbol);
    }

    // 添加数据流
    const streamsContainer = document.getElementById('data-streams');
    
    for (let i = 0; i < 10; i++) {
        const stream = document.createElement('div');
        stream.className = 'stream';
        stream.style.left = Math.random() * 100 + '%';
        stream.style.animationDelay = Math.random() * 5 + 's';
        streamsContainer.appendChild(stream);
    }
}

// 导出初始化函数
export default initCryptoBackground; 