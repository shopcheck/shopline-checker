/**
 * ============================================================================
 * ShoplineChecker.js - V2.1 Ultimate Detail (Traditional Chinese)
 * Frontend Data Exposure Scanner, Safety & Privacy Audit Tool
 * ============================================================================
 * 
 * @repository  https://github.com/shoplinechecker/shoplinechecker.js
 * @version     2.1.0
 * @license     MIT
 * @description 針對 Shopline 店舖的深度前端安全稽核工具。
 *              整合設定分析、AngularJS 注入劫持檢測、Pixel 隱私合規掃描、
 *              LINE/Criteo/TikTok 佇列嗅探及 CSRF/XSS 防護檢查。
 * 
 * [免責聲明 / Disclaimer]
 * 1. 本工具僅限用於您擁有合法權限（如自有店舖或獲得明確書面授權）的目標網站。
 * 2. 禁止將本工具用於未經授權的滲透測試、攻擊行為或非法數據採集。
 * 3. 開發者不對因使用本工具產生的任何法律後果或損失承擔責任。
 * ============================================================================
 */

(async function(window) {
    console.clear();

    // ==================== 1. 樣式與工具庫 ====================
    const CONFIG = {
        appName: 'ShoplineChecker.js',
        repoUrl: 'https://github.com/shoplinechecker/shoplinechecker.js',
        version: '2.1.0'
    };

    const styles = {
        banner: 'background: #2c3e50; color: #fff; font-size: 16px; padding: 10px 14px; border-radius: 4px; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.2);',
        sectionTitle: 'color: #333; background: #f8f9fa; font-size: 13px; font-weight: 800; padding: 6px 10px; border-left: 5px solid #3498db; margin-top: 16px; display: block;',
        riskHigh: 'background: #e74c3c; color: #fff; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold;',
        riskMedium: 'background: #f39c12; color: #fff; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold;',
        riskLow: 'background: #27ae60; color: #fff; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold;',
        success: 'color: #27ae60; font-weight: bold;',
        error: 'color: #c0392b; font-weight: bold;',
        warning: 'color: #d35400; font-weight: bold;',
        info: 'color: #2980b9;',
        desc: 'color: #7f8c8d; font-style: italic; margin-bottom: 4px;'
    };

    // 輔助工具
    const logSeparator = () => console.log('%c' + '─'.repeat(60), 'color: #dcdcdc; margin: 8px 0;');
    const colorLog = (text, style) => console.log(`%c${text}`, style);
    const formatMoney = (m) => m?.dollars ? `${m.dollars} ${m.currency_iso || ''}` : 'N/A';
    const hasSensitiveKeyword = (key = '') => ['token', 'auth', 'secret', 'pass', 'key', 'session', 'user', 'cart'].some(k => key.toLowerCase().includes(k));

    // 漏洞報告容器
    const report = {
        meta: { 
            tool: CONFIG.appName,
            version: CONFIG.version,
            url: window.location.href, 
            time: new Date().toLocaleString('zh-TW'),
            userAgent: navigator.userAgent
        },
        stats: { HIGH: 0, MEDIUM: 0, LOW: 0 },
        vulnerabilities: [],
        findings: {}
    };

    const addVuln = (id, name, level, desc, suggestion, data) => {
        report.vulnerabilities.push({ id, name, level, desc, suggestion, data });
        report.stats[level] = (report.stats[level] || 0) + 1;
        report.findings[id] = data;
    };

    // ==================== 2. 核心掃描邏輯 ====================

    console.log(`%c🛡️ ${CONFIG.appName} v${CONFIG.version} - 安全稽核啟動`, styles.banner);
    console.log(`%c目標頁面: ${window.location.href.split('?')[0]}`, styles.info);
    console.log(`%c掃描時間: ${report.meta.time}`, styles.desc);
    logSeparator();

    // --- 2.1 核心設定 (mainConfig) ---
    colorLog('🔍 1. 核心設定稽核 (window.mainConfig)', styles.sectionTitle);
    
    if (window.mainConfig) {
        const mc = window.mainConfig;
        
        // 1.1 Session ID
        if (mc.sessionId) {
            console.log('%c[發現] 工作階段識別碼 (Session ID)', styles.warning);
            console.log(`Value: ${mc.sessionId}`);
            addVuln('VUL-001', 'Session ID 前端暴露', 'HIGH', 
                'Base64 編碼的 Session ID 暴露在 window.mainConfig 中，XSS 攻擊者可直接竊取並接管使用者帳戶。', 
                '1. 將 Session ID 儲存在 HttpOnly Cookie 中。\n2. 避免在 HTML 原始碼中輸出 Session ID。', 
                { sessionId: mc.sessionId }
            );
        }

        // 1.2 Current User
        if (mc.currentUser) {
            console.log('%c[發現] 當前使用者資訊 (PII)', styles.warning);
            const userData = {
                'ID': mc.currentUser._id,
                'Name': mc.currentUser.name,
                'Email': mc.currentUser.email,
                'Phone': mc.currentUser.phone,
                'Role': mc.currentUser.role
            };
            console.table(userData);
            addVuln('VUL-002', '使用者 PII 資訊暴露', 'MEDIUM', 
                '當前登入使用者的詳細資訊（Email/Phone/ID）暴露在前端，增加資料外洩風險。', 
                '最小化前端返回的使用者欄位，對敏感欄位進行去識別化處理。', 
                userData
            );
        }

        // 1.3 Config Keys
        console.log('%c[資訊] 關鍵設定與金鑰', styles.info);
        const configKeys = {
            'Merchant ID': mc.merchantId,
            'API Base': mc.apiBaseUrl,
            'Recaptcha Ent': mc.recaptchaEnterpriseSiteKey,
            'Recaptcha Site': mc.recaptchaSiteKey,
            'Facebook App': mc.facebookAppId,
            'PayPal Client': mc.paypalCnClientId,
            'Instagram Token': mc.merchantData?.instagram_access_token || 'Safe (Not Found)'
        };
        console.table(configKeys);

        if (mc.merchantData?.instagram_access_token) {
            addVuln('VUL-003', '社群媒體 Access Token 暴露', 'HIGH', 
                'Instagram Access Token 直接暴露，可能導致 API 濫用。', 
                'Token 應儲存在後端，通過後端代理轉發 API 請求。', 
                { token: 'Exposed' }
            );
        }
    } else {
        console.log('%c[安全] 未偵測到 window.mainConfig', styles.success);
    }

    // --- 2.2 交易數據 (Order/Cart) ---
    colorLog('🛍️ 2. 交易數據稽核 (Order & Cart)', styles.sectionTitle);

    // 2.2.1 Order Data
    if (window.orderData) {
        console.log('%c[高風險] 偵測到完整訂單數據 (window.orderData)', styles.error);
        const od = window.orderData;
        const orderSummary = {
            'Order #': od.order_number,
            'Status': od.status,
            'Total': formatMoney(od.total),
            'Customer ID': od.customer_id,
            'Email': od.customer_email // if exists
        };
        console.table(orderSummary);

        if (od.subtotal_items?.length) {
            console.log('📦 訂單商品明細:');
            const items = od.subtotal_items.map((i, idx) => ({
                '#': idx + 1,
                'SKU': i.object_data?.sku,
                'Name': i.name,
                'Qty': i.quantity,
                'Price': formatMoney(i.item_price)
            }));
            console.table(items);
        }

        addVuln('VUL-004', '訂單詳情頁數據暴露', 'HIGH', 
            '訂單成功頁暴露了完整的訂單金額、客戶 ID 及商品明細。', 
            '訂單成功頁應僅展示去識別化後的必要資訊，避免掛載完整物件。', 
            orderSummary
        );
    } else {
        console.log('✓ 未偵測到 orderData');
    }

    // 2.2.2 Cart Data
    if (window.cartData?.items?.length) {
        console.log('%c[中風險] 偵測到購物車數據 (window.cartData)', styles.warning);
        const cd = window.cartData;
        const cartItems = cd.items.map((i, idx) => ({
            '#': idx + 1,
            'Product ID': i.product_id,
            'SKU': i.product_sku,
            'Qty': i.quantity,
            'Price': formatMoney(i.price)
        }));
        console.table(cartItems);
        
        addVuln('VUL-005', '購物車數據全域暴露', 'MEDIUM', 
            '購物車商品、SKU 和價格策略暴露在全域變數中，競爭對手可輕易爬取。', 
            '限制全域存取購物車物件，使用閉包 (Closure) 管理狀態。', 
            { itemCount: cd.items.length }
        );
    } else {
        console.log('✓ 未偵測到 cartData');
    }

    // 2.2.3 Quick Cart & Freecoins
    if (window.QUICK_CART_MODAL_DATA?.product) {
        console.log('%c[中風險] 快速購物車暴露完整產品數據', styles.warning);
        addVuln('VUL-006', 'Quick Cart 數據暴露', 'MEDIUM', '彈窗包含完整產品 JSON。', '僅返回最小資料集。', { id: window.QUICK_CART_MODAL_DATA.product.id });
    }
    if (window.freecoins_lpq || window.freecoins_cvq) {
        console.log('%c[高風險] LINE Points 廣告佇列暴露敏感轉化數據', styles.error);
        addVuln('VUL-007', 'LINE Points 佇列外洩', 'HIGH', '包含明文訂單編號與金額。', 'Push 前進行去識別化。', { detected: true });
    }

    // --- 2.3 廣告追蹤 (Pixels) ---
    colorLog('📡 3. 廣告追蹤與隱私合規 (Pixels)', styles.sectionTitle);
    
    const fbQueue = window.fbq?.queue || window._fbq || [];
    const ttQueue = window.ttq?.queue || [];
    const criteoQ = window.criteo_q || [];

    if (fbQueue.length > 0) {
        console.log(`📘 Facebook Pixel Events (${fbQueue.length})`);
        const sensitiveFb = fbQueue.filter(e => e[2] && (e[2].em || e[2].ph || e[2].fn));
        
        const fbEvents = fbQueue.map((e, i) => ({
            '#': i+1,
            'Event': e[0] === 'track' ? e[1] : e[0],
            'Params': e[2] ? Object.keys(e[2]).join(', ') : '-',
            'PII (Hash)': (e[2]?.em || e[2]?.ph) ? 'YES' : 'NO'
        }));
        console.table(fbEvents);

        if (sensitiveFb.length) {
            console.log('%c⚠️ 偵測到 PII (Email/Phone) 傳輸', styles.error);
            addVuln('VUL-008', 'Pixel 傳輸 PII 數據', 'HIGH', 
                '前端 Pixel 傳輸了雜湊 (Hash) 後的使用者電子信箱/手機號碼。', 
                '確保符合 GDPR/CCPA 要求，獲得使用者同意 (Consent)。', 
                { count: sensitiveFb.length }
            );
        }
    }

    if (criteoQ.length > 0) {
        console.log(`🛍️ Criteo Events (${criteoQ.length})`);
        const emailEvent = criteoQ.find(e => e.event === 'setHashedEmail');
        if (emailEvent) {
            console.log(`%c⚠️ Criteo Hashed Email: ${emailEvent.email}`, styles.warning);
            addVuln('VUL-009', 'Criteo 信箱雜湊暴露', 'MEDIUM', '全域陣列暴露雜湊電子信箱。', '避免長期保留敏感事件。', { email: emailEvent.email });
        }
    }

    // --- 2.4 框架與注入 (AngularJS) ---
    colorLog('💉 4. 框架注入風險 (AngularJS)', styles.sectionTitle);
    
    const ngInjector = window.angular?.element(document.body)?.injector();
    if (ngInjector) {
        console.log('%c[高風險] 偵測到 AngularJS Injector，嘗試提取 $rootScope...', styles.error);
        try {
            const $rootScope = ngInjector.get('$rootScope');
            const exposedData = {
                'Main Config': $rootScope.mainConfig ? 'Yes' : 'No',
                'Current User': $rootScope.currentUser ? 'Yes' : 'No',
                'Current Cart': $rootScope.currentCart ? 'Yes' : 'No'
            };
            console.table(exposedData);
            
            addVuln('VUL-010', 'AngularJS 依賴注入劫持', 'HIGH', 
                '攻擊者可透過 injector 存取 $rootScope 中的所有業務數據。', 
                '1. 禁用 Debug Info: $compileProvider.debugInfoEnabled(false)。\n2. 遷移至 React/Vue 並限制全域暴露。', 
                exposedData
            );
        } catch(e) {
            console.log('提取失敗: ' + e.message);
        }
    } else {
        console.log('✓ 未偵測到可利用的 AngularJS Injector');
    }

    // --- 2.5 網路安全 (URL/CSRF) ---
    colorLog('🌐 5. 網路安全檢查', styles.sectionTitle);

    // 5.1 CSRF Meta
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    if (csrfMeta) {
        const token = csrfMeta.getAttribute('content');
        console.log(`%c[中風險] CSRF Token 暴露在 Meta 標籤: ${token.substring(0,10)}...`, styles.warning);
        addVuln('VUL-011', 'CSRF Token 前端暴露', 'MEDIUM', 
            '可被 XSS 腳本讀取並偽造請求。', 
            '結合 SameSite Cookie 策略並驗證 Origin/Referer。', 
            { tokenPartial: token.substring(0, 10) }
        );
    }

    // 5.2 URL Params
    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get('authorization_token') || urlParams.get('token');
    if (authToken) {
        console.log(`%c[高風險] URL 參數包含 Token: ${authToken}`, styles.error);
        addVuln('VUL-012', 'URL 傳輸認證 Token', 'HIGH', 
            'Token 會被記錄在瀏覽器歷史和日誌中。', 
            '改用 HTTP Header 傳遞 Token。', 
            { token: authToken }
        );
    } else {
        console.log('✓ URL 參數未偵測到明文 Token');
    }

    // --- 2.6 本地儲存 (Storage) ---
    colorLog('💾 6. 本地儲存敏感關鍵字掃描', styles.sectionTitle);
    
    const scanStorage = (store, name) => {
        const findings = [];
        try {
            for (let i = 0; i < store.length; i++) {
                const k = store.key(i);
                if (hasSensitiveKeyword(k)) {
                    let val = store.getItem(k);
                    findings.push({
                        'Key': k,
                        'Value (Truncated)': val.length > 40 ? val.substring(0, 40) + '...' : val,
                        'Type': val.startsWith('{') ? 'JSON' : 'String'
                    });
                }
            }
        } catch(e) {}
        
        if (findings.length > 0) {
            console.log(`%c⚠️ ${name} 中發現敏感關鍵字:`, styles.warning);
            console.table(findings);
            addVuln(`VUL-Storage-${name}`, `${name} 敏感資訊`, 'MEDIUM', 
                '包含 token/auth/user 等關鍵字，可能儲存明文憑證。', 
                '敏感數據加密儲存，登出時清除。', 
                findings
            );
        } else {
            console.log(`✓ ${name} 未發現明顯敏感關鍵字`);
        }
    };

    scanStorage(localStorage, 'localStorage');
    scanStorage(sessionStorage, 'sessionStorage');

    // --- 2.7 安全回應標頭 (Async) ---
    colorLog('🛡️ 7. 安全回應標頭 (Async Check)', styles.sectionTitle);
    try {
        const res = await fetch(window.location.href, { method: 'HEAD' });
        const headers = {
            'X-Frame-Options': res.headers.get('x-frame-options') || 'MISSING',
            'Content-Security-Policy': res.headers.get('content-security-policy') || 'MISSING',
            'Access-Control-Allow-Origin': res.headers.get('access-control-allow-origin') || 'N/A'
        };
        console.table(headers);

        if (headers['X-Frame-Options'] === 'MISSING' || headers['X-Frame-Options'] === 'ALLOWALL') {
            addVuln('VUL-013', 'X-Frame-Options 缺失/不安全', 'MEDIUM', '易受點擊劫持 (Clickjacking) 攻擊。', '設定 DENY 或 SAMEORIGIN。', headers);
        }
        if (headers['Content-Security-Policy'] === 'MISSING') {
            addVuln('VUL-014', 'CSP 策略缺失', 'HIGH', '無法防禦 XSS 和數據外洩。', '部署嚴格的 CSP 策略。', headers);
        }
    } catch(e) {
        console.log('無法獲取回應標頭 (可能受 CORS 限制)');
    }

    logSeparator();

    // ==================== 3. 互動 UI 與匯出 ====================

    const exportJSON = () => {
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shoplinechecker-report-${Date.now()}.json`;
        a.click();
        console.log('%c✅ JSON 報告已匯出', styles.success);
    };

    const generateMarkdown = () => {
        let md = `# ShoplineChecker 安全稽核報告\n\n`;
        md += `> 產生時間: ${report.meta.time}\n> 頁面: ${report.meta.url}\n\n`;
        md += `## 📊 風險概覽\n| 等級 | 數量 |\n|---|---|\n| 🔴 高風險 | ${report.stats.HIGH} |\n| 🟡 中風險 | ${report.stats.MEDIUM} |\n| 🟢 低風險 | ${report.stats.LOW} |\n\n`;
        md += `## 📝 詳細發現\n\n`;
        
        report.vulnerabilities.sort((a, b) => {
            const w = {HIGH: 3, MEDIUM: 2, LOW: 1};
            return w[b.level] - w[a.level];
        });

        report.vulnerabilities.forEach((v, i) => {
            const icon = v.level === 'HIGH' ? '🔴' : (v.level === 'MEDIUM' ? '🟡' : '🟢');
            md += `### ${i+1}. ${icon} ${v.name}\n\n`;
            md += `**風險描述**: ${v.desc}\n\n`;
            md += `**修復建議**: \n> ${v.suggestion.replace(/\n/g, '\n> ')}\n\n`;
            if (v.data) md += `\`\`\`json\n${JSON.stringify(v.data, null, 2).slice(0, 500)}\n\`\`\`\n\n---\n\n`;
        });

        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shoplinechecker-fixs-${Date.now()}.md`;
        a.click();
        console.log('%c✅ 修復建議文檔已匯出', styles.success);
    };

    // 注入 UI
    if (!document.getElementById('sl-checker-ui')) {
        const div = document.createElement('div');
        div.id = 'sl-checker-ui';
        div.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; font-family: "Microsoft JhengHei", sans-serif; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.15); width: 240px; border: 1px solid #eee; animation: slideIn 0.3s;';
        
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:8px;">
                <span style="font-weight:bold; color:#2c3e50;">🛡️ ShoplineChecker</span>
                <span id="sl-close" style="cursor:pointer; font-size:18px;">&times;</span>
            </div>
            <div style="margin-bottom:12px; font-size:12px; color:#555;">
                <div style="display:flex; justify-content:space-between;"><span>🔴 高風險:</span> <b>${report.stats.HIGH}</b></div>
                <div style="display:flex; justify-content:space-between;"><span>🟡 中風險:</span> <b>${report.stats.MEDIUM}</b></div>
            </div>
            <button id="sl-btn-json" style="width:100%; padding:8px; margin-bottom:8px; border:none; background:#ecf0f1; color:#2c3e50; border-radius:4px; cursor:pointer; font-weight:600;">📥 匯出 JSON</button>
            <button id="sl-btn-md" style="width:100%; padding:8px; border:none; background:linear-gradient(90deg, #3498db, #2980b9); color:white; border-radius:4px; cursor:pointer; font-weight:600;">🔧 產生修復建議</button>
        `;
        
        document.body.appendChild(div);
        
        document.getElementById('sl-close').onclick = () => div.remove();
        document.getElementById('sl-btn-json').onclick = exportJSON;
        document.getElementById('sl-btn-md').onclick = generateMarkdown;
    }

    console.log(`%c\n✅ 掃描完成！共發現 ${report.vulnerabilities.length} 個風險點。`, styles.success);
    console.log(`%c💡 詳細報告已在上方列印，或使用右下角面板匯出。`, styles.info);

})(window);
