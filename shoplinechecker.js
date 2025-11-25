/**
 * ============================================================================
 * ShoplineChecker.js
 * Frontend Data Exposure Scanner, Safety & Privacy Audit Tool
 * ============================================================================
 *
 * @repository  https://github.com/shopcheck/shopline-checker
 * @version     2.3.0
 * @license     MIT
 * @description 針對 Shopline 店舖的前端資料暴露自我檢查與安全／隱私輔助工具
 *
 * [法律與合規說明 / Legal & Compliance Notice]
 * 使用前請先詳閱以下內容：
 *
 * 1. 使用範圍
 *    - 本工具僅提供給店家／網站持有人，或已取得明確書面授權者，用來對自己的 Shopline 店舖／網站進行前端「自我檢查」。
 *    - 請只在你自己或已獲授權的店舖頁面中，手動執行本腳本；本工具只會讀取目前這個分頁中，瀏覽器已載入的前端資料。
 *    - 不得嘗試透過本工具繞過權限控管、直接存取後台系統、管理介面或內部 API。
 *
 * 2. 禁止行為
 *    - 禁止將本工具用於任何未經授權的安全測試、弱點掃描、滲透、攻擊或大量自動化掃描行為。
 *    - 禁止用於非法資料蒐集、競爭對手情資蒐集，或其他違反法律／服務條款的用途。
 *
 * 3. 資料處理與隱私權
 *    - 本工具採用「本機瀏覽器端分析」方式，不會主動把掃描結果上傳到作者或任何第三方伺服器。
 *    - 工具本身不會替你保存掃描結果；若你選擇匯出 JSON／Markdown 報告，檔案只會產生在你的裝置上，由你自行決定保存、加密或去識別化。
 *    - 報告內容可能包含個人資料、交易資訊或商業機密，請依照當地個資法、隱私權相關法規，以及 GDPR／CCPA 等規範妥善處理。
 *
 * 4. 結果使用說明
 *    - 掃描結果僅作為前端安全與隱私風險的技術參考，屬於「自我檢查」與教學／研究用途，仍需由人工進一步審閱。
 *    - 本報告不構成法律意見、合規建議，也不等同專業資安顧問的正式稽核報告。
 *    - 建議由合格的資訊／資安專業人員，依照實際業務情境評估風險並規劃修正方案。
 *
 * 5. 免責條款
 *    - 你必須自行確保使用本工具的方式，符合你所在地的法律法規，以及目標網站／平台（包含但不限於 SHOPLINE）的服務條款與政策。
 *    - 開發者與專案貢獻者不會對任何因使用、誤用或忽視本說明而造成的法律後果、資料外洩、營業損失或其他損害負責。
 *    - 本工具係依「現狀」（AS IS）提供，不附帶任何明示或默示的擔保或保證。
 *
 * [使用者責任聲明]
 * 一旦執行或持續使用本工具，即表示你已閱讀、理解並同意遵守上述所有條款。
 * ============================================================================
 */

(async function (window) {
  console.clear();

  // ==================== 1. 設定與工具庫 ====================
  const CONFIG = {
    appName: "ShoplineChecker.js",
    repoUrl: "https://github.com/shopcheck/shopline-checker",
    version: "2.3.0",
  };

  const styles = {
    banner:
      "background: linear-gradient(90deg, #2c3e50, #34495e); color: #fff; font-size: 16px; padding: 10px 14px; border-radius: 4px; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.3);",
    sectionTitle:
      "color: #333; background: #f8f9fa; font-size: 13px; font-weight: 800; padding: 6px 10px; border-left: 5px solid #3498db; margin-top: 16px; display: block;",
    riskHigh:
      "background: #e74c3c; color: #fff; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold;",
    riskMedium:
      "background: #f39c12; color: #fff; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold;",
    riskLow:
      "background: #27ae60; color: #fff; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold;",
    success: "color: #27ae60; font-weight: bold;",
    error: "color: #c0392b; font-weight: bold;",
    warning: "color: #d35400; font-weight: bold;",
    info: "color: #2980b9;",
    desc: "color: #7f8c8d; font-style: italic; margin-bottom: 4px;",
  };

  // 輔助工具
  const logSeparator = () =>
    console.log("%c" + "─".repeat(60), "color: #dcdcdc; margin: 8px 0;");
  const colorLog = (text, style) => console.log(`%c${text}`, style);
  const formatMoney = (m) =>
    m?.dollars ? `${m.dollars} ${m.currency_iso || ""}` : "N/A";
  const hasSensitiveKeyword = (key = "") =>
    [
      "token",
      "auth",
      "secret",
      "pass",
      "key",
      "session",
      "user",
      "cart",
      "payment",
      "credit",
    ].some((k) => key.toLowerCase().includes(k));

  // 漏洞報告容器
  const report = {
    meta: {
      tool: CONFIG.appName,
      version: CONFIG.version,
      url: window.location.href,
      time: new Date().toLocaleString("zh-TW"),
      userAgent: navigator.userAgent,
    },
    stats: { HIGH: 0, MEDIUM: 0, LOW: 0 },
    vulnerabilities: [],
    findings: {},
  };

  const addVuln = (id, name, level, desc, suggestion, data) => {
    report.vulnerabilities.push({ id, name, level, desc, suggestion, data });
    report.stats[level] = (report.stats[level] || 0) + 1;
    report.findings[id] = data;
  };

  // ==================== 2. 核心掃描邏輯 ====================

  console.log(
    `%c🛡️ ${CONFIG.appName} v${CONFIG.version} - 前端自查啟動`,
    styles.banner,
  );
  console.log(`%c目標頁面: ${window.location.href.split("?")[0]}`, styles.info);
  console.log(`%c掃描時間: ${report.meta.time}`, styles.desc);
  console.log("");
  console.log(
    "%c⚠️  使用說明與合規提醒",
    "color: #e67e22; font-weight: bold; font-size: 13px;",
  );
  console.log(
    "%c用途說明：請只在你有權管理或已取得書面授權的網站上使用本工具，作為前端自我檢查／教學或研究之用。所有結果都需要人工再確認，不能直接當成法律或合規意見。",
    "color: #7f8c8d; font-size: 11px;",
  );
  console.log(
    "%c隱私提醒：輸出內容可能包含個人資料或商業機密，請依個資法、隱私權相關法規，以及 GDPR／CCPA 等規範來保存與分享。",
    "color: #7f8c8d; font-size: 11px;",
  );
  console.log(
    "%c執行範圍：請只在自己的 Shopline 店舖或已授權的頁面手動執行，請不要拿去掃別人的網站。",
    "color: #7f8c8d; font-size: 11px;",
  );
  console.log(
    "%c資料範圍：腳本只會讀取目前這個分頁上前端就能存取的資料，不會主動呼叫後台介面或執行額外的網路掃描。",
    "color: #7f8c8d; font-size: 11px;",
  );
  console.log(
    "%c資料處理：所有分析都在本機瀏覽器完成，不會自動上傳。若你選擇匯出檔案，請自行決定保存方式，並考慮加密與去識別化。",
    "color: #7f8c8d; font-size: 11px;",
  );
  console.log("");
  logSeparator();

  // --- 2.1 核心設定 (mainConfig) ---
  colorLog("🔍 1. 核心設定稽核 (window.mainConfig)", styles.sectionTitle);

  if (window.mainConfig) {
    const mc = window.mainConfig;

    // 1.1 Session ID
    if (mc.sessionId) {
      console.log("%c[發現] 工作階段識別碼 (Session ID)", styles.warning);
      console.log(`Value: ${mc.sessionId}`);
      addVuln(
        "VUL-001",
        "Session ID 於前端暴露",
        "HIGH",
        "Base64 編碼的 Session ID 暴露於 window.mainConfig.sessionId 中，XSS 攻擊者可直接竊取並接管使用者帳號。",
        "1. 將 Session ID 儲存於 HttpOnly Cookie 中，防止 JavaScript 存取。\n2. 避免在 HTML 原始碼或全域變數中輸出 Session ID。\n3. 實施嚴格的內容安全政策 (CSP) 以降低 XSS 風險。",
        { sessionId: mc.sessionId },
      );
    }

    // 1.2 Current User
    if (mc.currentUser) {
      console.log("%c[發現] 當前使用者資訊 (PII)", styles.warning);
      const userData = {
        ID: mc.currentUser._id,
        Name: mc.currentUser.name,
        Email: mc.currentUser.email,
        Phone: mc.currentUser.phone,
        Role: mc.currentUser.role,
        Status: mc.currentUser.status,
      };
      console.table(userData);
      addVuln(
        "VUL-002",
        "使用者個人識別資訊 (PII) 暴露",
        "MEDIUM",
        "當前登入使用者的詳細資訊（Email/Phone/ID）暴露於 window.mainConfig.currentUser 中，增加個資外洩風險，可能違反 GDPR/CCPA 合規要求。",
        "1. 採用資料最小化原則，前端僅返回必要的使用者欄位。\n2. 對敏感欄位（Email、Phone）進行去識別化或遮罩處理。\n3. 避免將完整使用者物件掛載於 window.mainConfig 全域變數。",
        userData,
      );
    }

    // 1.3 Merchant Data 敏感欄位
    if (mc.merchantData) {
      console.log("%c[審查] Merchant 敏感配置欄位", styles.info);

      // 商戶基本資訊
      console.group("%c📦 商戶基本資訊", "color: #2980b9; font-weight: bold;");
      console.log(`Merchant ID: ${mc.merchantData._id || mc.merchantId || "N/A"}`);
      console.log(`Name: ${mc.merchantData.name || "N/A"}`);
      console.log(`Handle: ${mc.merchantData.handle || "N/A"}`);
      console.log(`Base Currency: ${mc.merchantData.base_currency_code || "N/A"}`);
      console.groupEnd();

      // 支付系統相關
      if (mc.merchantData.sl_payment_merchant_id) {
        console.group(
          "%c⚠️ 支付系統 ID (高風險)",
          "color: #e74c3c; font-weight: bold;",
        );
        console.log(
          `sl_payment_merchant_id: ${mc.merchantData.sl_payment_merchant_id}`,
        );
        console.log(
          "%c風險說明: 內部商戶標識暴露，可能被用於偽造支付請求",
          "color: #c0392b;",
        );
        console.groupEnd();

        addVuln(
          "VUL-003A",
          "Shopline Payment 內部商戶識別碼暴露",
          "HIGH",
          "sl_payment_merchant_id 為內部支付系統的商戶標識，暴露於前端可能被用於偽造支付請求、API 濫用或進行未授權交易。",
          "1. 此識別碼應僅在後端伺服器使用，切勿於前端暴露。\n2. 前端僅保留公開金鑰（Public Key）供客戶端加密使用。\n3. 實施 API 請求簽章驗證機制，防止偽造請求。",
          { merchantId: mc.merchantData.sl_payment_merchant_id },
        );
      }

      // 社交媒體 Token
      if (mc.merchantData.instagram_access_token) {
        console.group(
          "%c⚠️ Instagram Access Token (高風險)",
          "color: #e74c3c; font-weight: bold;",
        );
        console.log(`%cToken (完整):`, "font-weight: bold; color: #e74c3c;");
        console.log(mc.merchantData.instagram_access_token);
        console.log(
          `%c長度: ${mc.merchantData.instagram_access_token.length} 字元`,
          "color: #95a5a6;",
        );
        console.groupEnd();

        addVuln(
          "VUL-003",
          "社群媒體存取權杖 (Access Token) 暴露",
          "HIGH",
          "Instagram Access Token 完整暴露於 window.mainConfig.merchantData.instagram_access_token，攻擊者可利用此權杖進行 API 濫用、竊取社群媒體資料或發布未授權內容。",
          "1. 存取權杖應妥善儲存於後端伺服器，切勿暴露於前端程式碼。\n2. 採用後端代理模式，由伺服器端轉發 Instagram API 請求。\n3. 定期輪換 Access Token 並設定適當的權限範圍 (Scope)。\n4. 實施 Token 使用監控與異常偵測機制。",
          { token: mc.merchantData.instagram_access_token },
        );
      }

      // Beta Feature Flags
      if (
        mc.merchantData.beta_feature_keys &&
        mc.merchantData.beta_feature_keys.length > 0
      ) {
        console.group(
          `%c🧪 Beta Feature Flags (${mc.merchantData.beta_feature_keys.length} 個)`,
          "color: #f39c12; font-weight: bold;",
        );
        console.log("%c完整列表:", "font-weight: bold;");
        mc.merchantData.beta_feature_keys.forEach((flag, idx) => {
          console.log(`  ${(idx + 1).toString().padStart(3, " ")}. ${flag}`);
        });
        console.log(
          "%c說明: Feature Flags 暴露可能讓競爭對手了解未發布功能",
          "color: #d35400; font-style: italic;",
        );
        console.groupEnd();
      }

      // Rollout Keys
      if (
        mc.merchantData.rollout_keys &&
        mc.merchantData.rollout_keys.length > 0
      ) {
        console.groupCollapsed(
          `%c🎯 Rollout Keys (${mc.merchantData.rollout_keys.length} 個) - 點擊展開查看完整列表`,
          "color: #9b59b6; font-weight: bold;",
        );
        console.log(
          `%c⚠️ 注意: 共 ${mc.merchantData.rollout_keys.length} 個項目，已預設折疊以避免畫面雜亂`,
          "color: #e67e22; font-weight: bold; background: #fff3cd; padding: 4px 8px;",
        );
        console.log("%c完整列表:", "font-weight: bold; margin-top: 8px;");
        mc.merchantData.rollout_keys.forEach((key, idx) => {
          console.log(`  ${(idx + 1).toString().padStart(4, " ")}. ${key}`);
        });
        console.groupEnd();
      }

      // 匯總表格
      console.log(
        "%c📊 敏感欄位存在狀態匯總:",
        "color: #34495e; font-weight: bold;",
      );
      const summary = [
        {
          欄位名稱: "sl_payment_merchant_id",
          狀態: mc.merchantData.sl_payment_merchant_id
            ? "❌ 已暴露"
            : "✅ 安全",
          風險等級: "HIGH",
        },
        {
          欄位名稱: "instagram_access_token",
          狀態: mc.merchantData.instagram_access_token
            ? "❌ 已暴露"
            : "✅ 安全",
          風險等級: "HIGH",
        },
        {
          欄位名稱: "beta_feature_keys",
          狀態:
            mc.merchantData.beta_feature_keys?.length > 0
              ? `⚠️ ${mc.merchantData.beta_feature_keys.length} 個`
              : "✅ 安全",
          風險等級: "MEDIUM",
        },
        {
          欄位名稱: "rollout_keys",
          狀態:
            mc.merchantData.rollout_keys?.length > 0
              ? `⚠️ ${mc.merchantData.rollout_keys.length} 個`
              : "✅ 安全",
          風險等級: "MEDIUM",
        },
      ];
      console.table(summary);
    }

    // 1.4 API 與服務金鑰
    console.log("%c[資訊] 關鍵設定與金鑰", styles.info);

    console.group("%c🔑 API 與服務金鑰", "color: #16a085; font-weight: bold;");
    if (mc.recaptchaEnterpriseSiteKey) {
      console.log(
        `reCAPTCHA Enterprise Site Key: ${mc.recaptchaEnterpriseSiteKey}`,
      );
    }
    if (mc.recaptchaSiteKey) {
      console.log(`reCAPTCHA Site Key: ${mc.recaptchaSiteKey}`);
    }
    if (mc.facebookAppId) {
      console.log(`Facebook App ID: ${mc.facebookAppId}`);
    }
    if (mc.paypalCnClientId) {
      console.log(`PayPal CN Client ID: ${mc.paypalCnClientId}`);
    }
    if (mc.criteoAccountId) {
      console.log(`Criteo Account ID: ${mc.criteoAccountId}`);
    }
    if (
      !mc.recaptchaEnterpriseSiteKey &&
      !mc.recaptchaSiteKey &&
      !mc.facebookAppId &&
      !mc.paypalCnClientId
    ) {
      console.log(
        "%c未發現第三方服務金鑰",
        "color: #95a5a6; font-style: italic;",
      );
    }
    console.groupEnd();

    console.group("%c⚙️ 系統配置", "color: #7f8c8d; font-weight: bold;");
    console.log(`Merchant ID: ${mc.merchantId || "N/A"}`);
    console.log(`API Base URL: ${mc.apiBaseUrl || "N/A"}`);
    console.log(`Shopline Payment Env: ${mc.shoplinePaymentV2Env || "N/A"}`);
    console.log(`Request Country: ${mc.requestCountry || "N/A"}`);
    console.log(`Page Type: ${mc.pageType || "N/A"}`);
    console.log(
      `Session ID: ${mc.sessionId ? "❌ 已暴露 (高風險)" : "✅ 未暴露"}`,
    );
    console.groupEnd();
  } else {
    console.log("%c[安全] 未偵測到 window.mainConfig", styles.success);
  }

  // --- 2.2 交易資料 (Order/Cart) ---
  colorLog("🛍️ 2. 交易資料稽核 (Order & Cart)", styles.sectionTitle);

  // 2.2.1 Order Data
  if (window.orderData) {
    console.log(
      "%c[高風險] 偵測到完整訂單資料 (window.orderData)",
      styles.error,
    );
    const od = window.orderData;
    const orderSummary = {
      "Order #": od.order_number,
      Status: od.status,
      Total: formatMoney(od.total),
      "Customer ID": od.customer_id,
      "Currency": od.currency_iso,
    };
    console.table(orderSummary);

    if (od.subtotal_items?.length) {
      console.log("📦 訂單商品明細:");
      const items = od.subtotal_items.map((i, idx) => ({
        "#": idx + 1,
        SKU: i.object_data?.sku,
        Name: i.object_data?.title_translations?.en || i.object_data?.title_translations?.["zh-hant"],
        Qty: i.quantity,
        Price: formatMoney(i.item_price),
      }));
      console.table(items);
    }

    addVuln(
      "VUL-004",
      "訂單詳情資料於前端完整暴露",
      "HIGH",
      "訂單確認頁面將完整訂單資料（含訂單金額、客戶識別碼、商品明細等）暴露於 window.orderData 全域變數中，攻擊者可輕易擷取敏感交易資訊。",
      "1. 訂單成功頁面應僅顯示必要的確認資訊，避免掛載完整訂單物件。\n2. 採用後端渲染 (SSR) 或僅傳遞顯示所需的最小資料集。\n3. 對客戶識別碼進行去識別化處理（如使用遮罩或雜湊）。\n4. 實施內容安全政策 (CSP) 防止惡意腳本讀取敏感資料。",
      orderSummary,
    );
  } else {
    console.log("✓ 未偵測到 window.orderData（可能不在訂單確認頁面）");
  }

  // 2.2.2 Cart Data
  if (window.cartData?.items?.length) {
    console.log(
      "%c[中風險] 偵測到購物車資料 (window.cartData)",
      styles.warning,
    );
    const cd = window.cartData;
    const cartItems = cd.items.map((i, idx) => ({
      "#": idx + 1,
      "Product ID": i.product_id,
      SKU: i.product_sku,
      Qty: i.quantity,
      Price: formatMoney(i.price),
    }));
    console.table(cartItems);

    addVuln(
      "VUL-005",
      "購物車資料於全域變數暴露",
      "MEDIUM",
      "購物車完整資料（含商品資訊、SKU、價格策略）暴露於 window.cartData 全域變數中，競爭對手可輕易爬取定價策略與熱銷商品資訊。",
      "1. 避免將購物車物件掛載於全域變數，改用模組化狀態管理（如 Vuex、Redux）。\n2. 採用閉包 (Closure) 或私有作用域管理購物車狀態。\n3. 實施反爬蟲機制，如請求頻率限制與行為分析。\n4. 對價格敏感資訊進行混淆或動態載入。",
      { itemCount: cd.items.length },
    );
  } else {
    console.log("✓ 未偵測到 window.cartData（可能不在購物車頁面）");
  }

  // 2.2.3 Quick Cart Modal Data
  if (window.QUICK_CART_MODAL_DATA?.product) {
    console.log("%c[中風險] 快速購物車暴露完整產品資料", styles.warning);
    addVuln(
      "VUL-006",
      "快速購物車完整商品資料暴露",
      "MEDIUM",
      "快速購物車彈窗將完整商品物件（含價格、庫存、變體等）暴露於 window.QUICK_CART_MODAL_DATA 全域變數中。",
      "1. 彈窗初始化時僅傳遞顯示所需的最小資料集。\n2. 避免將完整商品物件掛載於全域變數。\n3. 關閉彈窗後應主動清除 QUICK_CART_MODAL_DATA 資料。\n4. 對敏感欄位採用懶載入或後端介面按需返回。",
      { id: window.QUICK_CART_MODAL_DATA.product._id || window.QUICK_CART_MODAL_DATA.product.id },
    );
  }

  // --- 2.3 廣告追蹤 (Pixels) ---
  colorLog("📡 3. 廣告追蹤與隱私合規 (Pixels)", styles.sectionTitle);

  // Facebook Pixel
  const fbQueue = window.fbq?.queue || window._fbq || [];
  if (fbQueue.length > 0) {
    console.log(`📘 Facebook Pixel Events (${fbQueue.length})`);
    const sensitiveFb = fbQueue.filter(
      (e) => e[2] && (e[2].em || e[2].ph || e[2].fn || e[2].external_id),
    );

    const fbEvents = fbQueue.map((e, i) => ({
      "#": i + 1,
      Event: e[0] === "track" ? e[1] : e[0],
      Params: e[2] ? Object.keys(e[2]).join(", ") : "-",
      "PII (Hash)": e[2]?.em || e[2]?.ph ? "YES" : "NO",
    }));
    console.table(fbEvents);

    if (sensitiveFb.length) {
      console.log("%c⚠️ 偵測到 PII (Email/Phone) 傳輸", styles.error);
      addVuln(
        "VUL-008",
        "廣告像素傳輸個人識別資訊 (PII)",
        "HIGH",
        "Facebook Pixel 於前端傳輸雜湊後的使用者電子信箱、手機號碼等個人識別資訊，存在隱私合規風險。",
        "1. 確保已取得使用者明確同意 (Explicit Consent) 後再傳輸 PII，符合 GDPR/CCPA 要求。\n2. 避免於客戶端進行 Email/Phone 雜湊，應於伺服器端進行並使用進階比對 (Advanced Matching)。\n3. 考慮採用伺服器端轉換 API (Conversions API) 取代客戶端像素，降低隱私風險。\n4. 實施隱私權政策與 Cookie 同意管理平台 (CMP)。",
        { count: sensitiveFb.length },
      );
    }
  } else {
    console.log("✓ 未偵測到 Facebook Pixel 佇列");
  }

  // TikTok Pixel
  const ttQueue = window.ttq?.queue || [];
  if (ttQueue.length > 0) {
    console.log(`📱 TikTok Pixel Events (${ttQueue.length})`);
    const ttEvents = ttQueue.map((e, i) => ({
      "#": i + 1,
      Event: e[0] === "track" ? e[1] : e[0],
      Params: e[2] ? Object.keys(e[2]).join(", ") : "-",
    }));
    console.table(ttEvents);
  }

  // Criteo Queue
  const criteoQ = window.criteo_q || [];
  if (criteoQ.length > 0) {
    console.log(`🛍️ Criteo Events (${criteoQ.length})`);
    const emailEvent = criteoQ.find((e) => e.event === "setHashedEmail");
    if (emailEvent) {
      console.log(
        `%c⚠️ Criteo Hashed Email: ${emailEvent.email}`,
        styles.warning,
      );
      addVuln(
        "VUL-009",
        "Criteo 追蹤佇列暴露雜湊電子信箱",
        "MEDIUM",
        "Criteo 追蹤佇列 (window.criteo_q) 於全域陣列中暴露雜湊後的使用者電子信箱，存在隱私外洩風險。",
        "1. 避免於前端進行電子信箱雜湊，應於伺服器端處理。\n2. 追蹤事件發送後應立即清除佇列中的敏感資料，避免長期保留。\n3. 考慮採用 Criteo 伺服器端整合方案取代客戶端像素。\n4. 確保符合隱私權政策與使用者同意管理要求。",
        { email: emailEvent.email },
      );
    }
  }

  // LINE Points Ads
  if (window.freecoins_lpq || window.freecoins_cvq) {
    console.log(
      "%c[高風險] LINE Points 廣告佇列暴露敏感轉化資料",
      styles.error,
    );
    addVuln(
      "VUL-007",
      "LINE Points 廣告追蹤佇列暴露敏感轉換資料",
      "HIGH",
      "LINE Points 廣告追蹤佇列 (window.freecoins_lpq / freecoins_cvq) 包含明文訂單編號、交易金額與商品識別碼等敏感轉換資料。",
      "1. 追蹤佇列應改為閉包內部管理，外部僅暴露 dispatch 介面。\n2. 在 push 事件前對訂單編號與金額進行去識別化或雜湊處理。\n3. 考慮採用伺服器端轉換追蹤 (Server-Side Tracking) 取代客戶端像素。\n4. 確保符合 LINE 隱私政策與當地個資保護法規。",
      { lpq: !!window.freecoins_lpq, cvq: !!window.freecoins_cvq },
    );
  }

  // --- 2.4 Event Trackers ---
  colorLog("📊 4. 事件追蹤器配置 (window.eventTrackers)", styles.sectionTitle);

  if (window.eventTrackers && Array.isArray(window.eventTrackers)) {
    console.log(`%c[發現] 事件追蹤器配置 (${window.eventTrackers.length} 個)`, styles.warning);

    const trackerSummary = window.eventTrackers.map((t, idx) => ({
      "#": idx + 1,
      "Event Key": t.event_key,
      "Event Type": t.event_type || "N/A",
      "Has Config": t.config_data ? "YES" : "NO",
    }));
    console.table(trackerSummary);

    addVuln(
      "VUL-010",
      "廣告追蹤器完整配置暴露",
      "MEDIUM",
      "window.eventTrackers 包含所有廣告追蹤器的配置資訊，可能洩露行銷策略與廣告帳號資訊。",
      "1. 僅暴露前端渲染所需的最小追蹤器配置。\n2. 對追蹤器 ID 進行混淆或改用服務端代理。\n3. 避免在 eventTrackers 中包含敏感的 config_data。",
      { count: window.eventTrackers.length },
    );
  } else {
    console.log("✓ 未偵測到 window.eventTrackers");
  }

  // --- 2.5 框架與注入 (AngularJS) ---
  colorLog("💉 5. 框架注入風險 (AngularJS shop_app)", styles.sectionTitle);

  try {
    // 檢測 AngularJS app
    const ngApp =
      document.querySelector('[ng-app="shop_app"]') ||
      document.querySelector(".page-checkout") ||
      document.querySelector("#checkout-container") ||
      document.body;

    const ngInjector = window.angular?.element(ngApp)?.injector();

    if (ngInjector) {
      console.log(
        "%c[高風險] 偵測到 AngularJS Injector (shop_app)，嘗試提取資料...",
        styles.error,
      );

      // 提取 $rootScope
      try {
        const $rootScope = ngInjector.get("$rootScope");
        console.group(
          "%c📋 $rootScope 暴露資料",
          "color: #e67e22; font-weight: bold;",
        );
        console.log(
          `Main Config: ${$rootScope.mainConfig ? "✓ 存在" : "✗ 不存在"}`,
        );
        console.log(
          `Current User: ${$rootScope.currentUser ? "✓ 存在" : "✗ 不存在"}`,
        );
        console.log(
          `Current Cart: ${$rootScope.currentCart ? "✓ 存在" : "✗ 不存在"}`,
        );
        console.groupEnd();
      } catch (e) {
        console.log("%c無法提取 $rootScope: " + e.message, styles.desc);
      }

      // 提取 app.value() 注入的敏感資料
      const sensitiveServices = [
        "cart",
        "order",
        "riskResponse",
        "stripePublishableKey",
        "payment_method",
        "hop_locations",
        "currentLocale",
        "appExtensionSdkData",
      ];

      console.log(
        "%c[檢測] 嘗試提取 AngularJS 注入的 Value 服務...",
        styles.info,
      );
      const extractedData = {};

      sensitiveServices.forEach((service) => {
        try {
          if (ngInjector.has(service)) {
            const data = ngInjector.get(service);
            if (data !== undefined && data !== null) {
              extractedData[service] = data;

              let level = "LOW";
              let desc = `從 AngularJS Injector 成功提取 ${service}。`;

              if (service === "cart") {
                level = "MEDIUM";
                desc = `購物車資料暴露，包含商品、價格等資訊。`;
                console.log("%c[中風險] Cart 資料:", styles.warning);
                console.dir(data);
              } else if (service === "order") {
                level = "HIGH";
                desc = `訂單資料暴露，包含訂單詳情、支付資訊等。`;
                console.log("%c[高風險] Order 資料:", styles.error);
                console.dir(data);
              } else if (service === "riskResponse") {
                level = "HIGH";
                desc = `Cybersource 風控系統的 orgId 和 sessionId 暴露，可能被用於繞過風控檢測。`;
                console.log("%c[高風險] Risk Response:", styles.error);
                console.dir(data);
              } else if (service === "stripePublishableKey") {
                level = "LOW";
                desc = `Stripe 可發布金鑰 (Publishable Key) 暴露。公開金鑰本身風險較低。`;
                console.log(`%c[低風險] Stripe Key: ${data}`, styles.info);
              } else if (service === "payment_method") {
                level = "MEDIUM";
                desc = `支付方式設定暴露，可能包含支付閘道配置。`;
                console.log("%c[中風險] Payment Method:", styles.warning);
                console.dir(data);
              }

              addVuln(
                `VUL-NG-${service}`,
                `AngularJS Value: ${service}`,
                level,
                desc,
                "1. 禁用 AngularJS Debug Info：$compileProvider.debugInfoEnabled(false)。\n2. 儘量遷移至現代框架（React／Vue）並限制全域暴露。\n3. 對敏感資料採用加密或伺服器端渲染。",
                typeof data === "object" ? Object.keys(data) : data,
              );
            }
          }
        } catch (e) {
          // 服務不存在或無法訪問
        }
      });

      if (Object.keys(extractedData).length > 0) {
        console.log(
          `%c✅ 成功提取 ${Object.keys(extractedData).length} 個 AngularJS 注入服務`,
          styles.success,
        );
      } else {
        console.log(
          "%c未能提取任何 AngularJS 注入資料（可能已禁用 debugInfo）",
          styles.info,
        );
      }
    } else if (window.app) {
      console.log("%c[發現] window.app 存在（AngularJS 應用實例）", styles.warning);
      addVuln(
        "VUL-NG-APP",
        "AngularJS 應用實例全域暴露",
        "MEDIUM",
        "AngularJS 應用實例暴露於 window.app，可能被惡意腳本存取內部狀態。",
        "1. 禁用 AngularJS Debug Info。\n2. 避免將 app 實例掛載於 window 全域物件。",
        { appExists: true },
      );
    } else {
      console.log("✓ 未偵測到可利用的 AngularJS Injector 或 window.app");
    }
  } catch (e) {
    console.log("%cAngularJS 檢測失敗: " + e.message, styles.desc);
  }

  // --- 2.6 One Page Store Checkout 資料掃描 ---
  colorLog(
    "🛒 6. One Page Store Checkout 資料掃描 (sl-cart-init-data)",
    styles.sectionTitle,
  );

  const cartInitScript = document.getElementById("sl-cart-init-data");
  if (cartInitScript) {
    try {
      const cartInitData = JSON.parse(cartInitScript.textContent);
      console.log("%c[高風險] 偵測到 sl-cart-init-data 腳本標籤", styles.error);

      console.group(
        "%c📦 Cart Init Data 內容摘要",
        "color: #e74c3c; font-weight: bold;",
      );
      console.log(`Cart ID: ${cartInitData.cart?.id || "N/A"}`);
      console.log(`Cart Owner ID: ${cartInitData.cart?.owner_id || "N/A"}`);
      console.log(`Cart Owner Type: ${cartInitData.cart?.owner_type || "N/A"}`);
      console.log(
        `Session Data: ${cartInitData.sessionData ? "❌ 已暴露" : "✅ 未暴露"}`,
      );
      console.log(
        `Sentry Config: ${cartInitData.sentryConfig ? "⚠️ 已暴露 (含 DSN)" : "✅ 未暴露"}`,
      );
      console.log(
        `Extra Main Config: ${cartInitData.extraMainConfig ? "⚠️ 已暴露" : "✅ 未暴露"}`,
      );
      console.groupEnd();

      const sensitiveFields = [];
      if (cartInitData.sessionData) sensitiveFields.push("sessionData");
      if (cartInitData.sentryConfig) sensitiveFields.push("sentryConfig");
      if (cartInitData.extraMainConfig) sensitiveFields.push("extraMainConfig");

      if (sensitiveFields.length > 0) {
        addVuln(
          "VUL-015",
          "sl-cart-init-data 包含敏感設定資料",
          "HIGH",
          `結帳頁面的 <script id="sl-cart-init-data"> 包含敏感設定資料，可能被惡意腳本存取。`,
          "1. Session 資料應僅在後端使用，避免注入至前端頁面。\n2. 前端僅接收經過過濾的必要欄位。\n3. 對必須傳遞的敏感欄位進行加密。",
          { sensitiveFields },
        );
      }

      if (cartInitData.cart) {
        addVuln(
          "VUL-016",
          "sl-cart-init-data 購物車資料完整暴露",
          "MEDIUM",
          "sl-cart-init-data 腳本標籤包含購物車的所有商品資訊、價格策略與配送資訊。",
          "1. 實施資料最小化原則，僅返回前端渲染所需的必要欄位。\n2. 對價格敏感資訊進行混淆或動態載入。",
          { cartId: cartInitData.cart.id },
        );
      }
    } catch (e) {
      console.log("%c解析 sl-cart-init-data 失敗: " + e.message, styles.desc);
    }
  } else {
    console.log("✓ 未偵測到 sl-cart-init-data（可能不在 One Page Store 頁面）");
  }

  // --- 2.7 全域 SDK 與 Promise 掃描 ---
  colorLog("🔧 7. 全域 SDK 與 Promise 掃描", styles.sectionTitle);

  // globalSDKObserver
  if (window.globalSDKObserver) {
    console.log("%c[發現] window.globalSDKObserver", styles.warning);
    console.log("  可訂閱 grecaptcha／FB 等 SDK 載入事件");
    addVuln(
      "VUL-SDK-OBSERVER",
      "SDK 觀察者對外暴露",
      "LOW",
      "window.globalSDKObserver 暴露，允許訂閱 SDK 載入事件。",
      "1. 限制 observer 訂閱入口，僅允許受信任腳本註冊。\n2. 事件回呼中避免傳遞完整 SDK 物件。",
      { observerExposed: true },
    );
  }

  // APP_EXTENSION_SDK_ANGULAR_JS_LOADED
  if (window.APP_EXTENSION_SDK_ANGULAR_JS_LOADED) {
    console.log("%c[發現] window.APP_EXTENSION_SDK_ANGULAR_JS_LOADED Promise", styles.info);
    console.log("  允許擴充監聽 AngularJS 初始化完成");
  }

  // shopline SDK
  if (window.shopline) {
    console.log("%c[發現] window.shopline SDK 物件", styles.info);
    addVuln(
      "VUL-SDK-SHOPLINE",
      "Shopline SDK 全域可見",
      "LOW",
      "window.shopline SDK 暴露，可能包含外掛介面和擴充方法。",
      "1. 限制公開 API，僅暴露經過授權的 callback。\n2. 為 SDK 方法增加參數驗證和權限控制。",
      { sdkAvailable: true },
    );
  }

  // scriptQueue
  if (window.scriptQueue) {
    console.log(`%c[發現] window.scriptQueue (${window.scriptQueue.length} 個腳本)`, styles.info);
  }

  // dataLayer（Google Analytics / Google Ads）
  if (window.dataLayer) {
    console.log(`%c[發現] window.dataLayer (${window.dataLayer.length} 個事件)`, styles.info);
    addVuln(
      "VUL-DATALAYER",
      "Google dataLayer 佇列暴露",
      "LOW",
      "window.dataLayer 為 Google Analytics／Ads 的標準資料層，包含頁面瀏覽和轉換事件資料。",
      "1. 確保 dataLayer 中不包含 PII（個人識別資訊）。\n2. 在推送前移除敏感欄位或進行雜湊處理。",
      { eventCount: window.dataLayer.length },
    );
  }

  // --- 2.8 網路安全 (URL/CSRF) ---
  colorLog("🌐 8. 網路安全檢查", styles.sectionTitle);

  // 8.1 CSRF Meta
  const csrfMeta = document.querySelector('meta[name="csrf-token"]');
  if (csrfMeta) {
    const token = csrfMeta.getAttribute("content");
    console.log(`%c[中風險] CSRF Token 暴露在 Meta 標籤`, styles.warning);
    console.log(`%cToken (完整): ${token}`, "font-weight: bold;");
    console.log(`%c長度: ${token.length} 字元`, "color: #95a5a6;");
    addVuln(
      "VUL-011",
      "CSRF Token 前端暴露",
      "MEDIUM",
      "CSRF Token 暴露於 Meta 標籤中，可被 XSS 腳本讀取並用於偽造跨站請求。",
      "1. 確保 CSRF Token 於 HTTP-only Cookie 中傳輸。\n2. 驗證每個 POST／PUT 請求的 Token 有效性。\n3. 實施 SameSite Cookie 屬性（建議設為 Strict 或 Lax）。\n4. 驗證 Origin 與 Referer 標頭以增強防護。",
      { token: token },
    );
  } else {
    console.log("✓ 未偵測到 CSRF Meta Token（可能使用其他防護機制）");
  }

  // 8.2 URL Params
  const urlParams = new URLSearchParams(window.location.search);
  const authToken =
    urlParams.get("authorization_token") ||
    urlParams.get("token") ||
    urlParams.get("access_token");
  if (authToken) {
    console.log(`%c[高風險] URL 參數包含 Token: ${authToken}`, styles.error);
    addVuln(
      "VUL-012",
      "URL 參數傳輸認證 Token",
      "HIGH",
      "認證 Token 透過 URL 參數傳輸，會被記錄於瀏覽器歷史紀錄、伺服器日誌及 Referer 標頭中，存在嚴重安全風險。",
      "1. 改用 HTTP Authorization Header 傳遞認證 Token。\n2. 使用 POST 請求體傳遞敏感認證資訊。\n3. 強制使用 HTTPS 確保傳輸加密。\n4. 實施短期有效的 Token 並搭配 Token 輪換機制。",
      { token: authToken },
    );
  } else {
    console.log("✓ URL 參數未偵測到明文 Token");
  }

  // --- 2.9 本地儲存 (Storage) ---
  colorLog("💾 9. 本地儲存敏感關鍵字掃描", styles.sectionTitle);

  const scanStorage = (store, name) => {
    const findings = [];
    try {
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (hasSensitiveKeyword(k)) {
          let val = store.getItem(k);
          findings.push({
            Key: k,
            Value: val.length > 100 ? val.substring(0, 100) + "..." : val,
            Type: val.startsWith("{") || val.startsWith("[") ? "JSON" : "String",
            Length: val.length,
          });
        }
      }
    } catch (e) {
      // Storage 不可用
    }

    if (findings.length > 0) {
      console.log(`%c⚠️ ${name} 中發現敏感關鍵字:`, styles.warning);
      console.table(findings);
      addVuln(
        `VUL-Storage-${name}`,
        `${name} 儲存敏感資訊`,
        "MEDIUM",
        `${name} 中包含 token／auth／user／payment 等敏感關鍵字，可能儲存明文憑證或使用者資料，易受 XSS 攻擊竊取。`,
        "1. 避免於 localStorage／sessionStorage 儲存認證憑證或敏感資料。\n2. 敏感資料應加密儲存或改用 HTTP-only Cookie。\n3. 實施嚴格的內容安全政策 (CSP) 防止 XSS 攻擊。\n4. 使用者登出時應主動清除所有本地儲存資料。",
        findings,
      );
    } else {
      console.log(`✓ ${name} 未發現明顯敏感關鍵字`);
    }
  };

  scanStorage(localStorage, "localStorage");
  scanStorage(sessionStorage, "sessionStorage");

  // --- 2.10 安全回應標頭 (Async) ---
  colorLog("🛡️ 10. 安全回應標頭 (Async Check)", styles.sectionTitle);
  try {
    const res = await fetch(window.location.href, { method: "HEAD" });
    const headers = {
      "X-Frame-Options": res.headers.get("x-frame-options") || "MISSING",
      "Content-Security-Policy":
        res.headers.get("content-security-policy") || "MISSING",
      "Strict-Transport-Security":
        res.headers.get("strict-transport-security") || "MISSING",
      "X-Content-Type-Options":
        res.headers.get("x-content-type-options") || "MISSING",
      "Access-Control-Allow-Origin":
        res.headers.get("access-control-allow-origin") || "N/A",
    };
    console.table(headers);

    if (
      headers["X-Frame-Options"] === "MISSING" ||
      headers["X-Frame-Options"].toLowerCase() === "allowall"
    ) {
      addVuln(
        "VUL-013",
        "X-Frame-Options 標頭缺失或設定不安全",
        "MEDIUM",
        "X-Frame-Options 標頭缺失或設定為 ALLOWALL，網站易受點擊劫持 (Clickjacking) 攻擊，惡意網站可將頁面嵌入 iframe 進行釣魚或詐騙。",
        "1. 將 X-Frame-Options 設定為 DENY（完全禁止嵌入）或 SAMEORIGIN（僅允許同源嵌入）。\n2. 對需要 iframe 嵌入的特定頁面，使用 Content-Security-Policy 的 frame-ancestors 指令設定精確白名單。\n3. 部署後進行測試確保功能正常運作。",
        headers,
      );
    }
    if (headers["Content-Security-Policy"] === "MISSING") {
      addVuln(
        "VUL-014",
        "Content-Security-Policy 策略缺失",
        "HIGH",
        "Content-Security-Policy (CSP) 標頭缺失，網站無法有效防禦跨站腳本攻擊 (XSS)、資料外洩及惡意腳本注入等安全威脅。",
        "1. 部署嚴格的 CSP 策略（建議從 default-src 'self' 開始）。\n2. 對腳本與樣式來源使用白名單或 nonce／hash 機制。\n3. 為第三方腳本添加子資源完整性驗證 (Subresource Integrity, SRI)。\n4. 使用 CSP Report-Only 模式進行測試後再正式啟用。",
        headers,
      );
    }
    if (headers["Strict-Transport-Security"] === "MISSING") {
      addVuln(
        "VUL-019",
        "Strict-Transport-Security (HSTS) 標頭缺失",
        "MEDIUM",
        "Strict-Transport-Security (HSTS) 標頭缺失，網站未強制使用 HTTPS 連線，使用者可能遭受中間人攻擊 (Man-in-the-Middle) 或 SSL 剝離攻擊。",
        "1. 添加 Strict-Transport-Security 標頭，建議設定為 'max-age=31536000; includeSubDomains; preload'。\n2. 確保網站所有資源（圖片、腳本、樣式）均透過 HTTPS 載入。\n3. 考慮將網域加入 HSTS Preload List 以獲得瀏覽器原生保護。\n4. 部署前先測試以避免將 HTTP 服務意外封鎖。",
        headers,
      );
    }
  } catch (e) {
    console.log("無法獲取回應標頭（可能受 CORS 限制）");
  }

  logSeparator();

  // ==================== 3. 互動 UI 與匯出 ====================

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shoplinechecker-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log("%c✅ JSON 報告已匯出（僅儲存在此裝置）", styles.success);
  };

  const generateMarkdown = () => {
    let md = `# ShoplineChecker 前端安全自查報告 (v${CONFIG.version})\n\n`;
    md += `> 產生時間：${report.meta.time}\n> 頁面：${report.meta.url}\n> User Agent：${report.meta.userAgent}\n\n`;
    md += `## ⚠️ 使用須知\n\n`;
    md += `這份報告是由 ShoplineChecker 根據你目前開啟的頁面，自動產生的前端安全／資料暴露自查結果，僅供你在已獲授權的網站上做內部參考與討論。\n\n`;
    md += `**重要提醒**：\n`;
    md += `- 報告內容可能包含個人資料或商業機密，請妥善保存，並依個資法與相關法規處理。\n`;
    md += `- 所有風險等級僅為技術角度的提示，仍需要由專業人員進一步審查，不構成法律意見或正式顧問建議。\n`;
    md += `- 請勿將本報告用於未經授權的滲透測試、攻擊行為或對第三方網站的掃描。\n`;
    md += `- 建議優先處理高風險項目，並規劃定期的安全檢查流程。\n\n`;
    md += `---\n\n`;
    md += `## 📊 風險概覽\n| 等級 | 數量 |\n|---|---|\n| 🔴 高風險 (HIGH) | ${report.stats.HIGH} |\n| 🟡 中風險 (MEDIUM) | ${report.stats.MEDIUM} |\n| 🟢 低風險 (LOW) | ${report.stats.LOW} |\n\n`;
    md += `**總計**：${report.vulnerabilities.length} 個風險項目\n\n`;
    md += `## 📝 詳細發現\n\n`;

    report.vulnerabilities.sort((a, b) => {
      const w = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return w[b.level] - w[a.level];
    });

    report.vulnerabilities.forEach((v, i) => {
      const icon =
        v.level === "HIGH" ? "🔴" : v.level === "MEDIUM" ? "🟡" : "🟢";
      md += `### ${i + 1}. ${icon} [${v.id}] ${v.name}\n\n`;
      md += `**風險等級**：${v.level}\n\n`;
      md += `**風險描述**：${v.desc}\n\n`;
      md += `**修復建議**：\n> ${v.suggestion.replace(/\n/g, "\n> ")}\n\n`;
      if (v.data && typeof v.data === "object") {
        const jsonData = JSON.stringify(v.data, null, 2);
        md += `**相關資料**：\n\`\`\`json\n${jsonData.substring(0, 1000)}${jsonData.length > 1000 ? "\n..." : ""}\n\`\`\`\n\n`;
      }
      md += `---\n\n`;
    });

    md += `## 🔗 相關資源\n\n`;
    md += `- [ShoplineChecker GitHub](${CONFIG.repoUrl})\n`;
    md += `- [OWASP Top 10](https://owasp.org/www-project-top-ten/)\n`;
    md += `- [GDPR 合規指南](https://gdpr.eu/)\n`;
    md += `- [CCPA 隱私保護](https://oag.ca.gov/privacy/ccpa)\n`;
    md += `- [Web.dev 安全最佳實務](https://web.dev/secure/)\n\n`;
    md += `---\n\n`;
    md += `## 📋 法律與免責聲明\n\n`;
    md += `**請特別注意以下幾點**：\n\n`;
    md += `1. **授權使用**：本工具與本報告僅適用於你自己或已取得合法授權的網站，嚴禁用於未經授權的弱點掃描、滲透測試或攻擊行為。\n\n`;
    md += `2. **資料隱私**：本報告可能包含個人資料與商業機密，使用者有責任依 GDPR、CCPA 以及當地個資法等相關規範妥善處理與保護。\n\n`;
    md += `3. **專業建議**：本報告僅供技術參考，不構成法律意見或專業資訊安全／合規顧問服務。建議由具備資格的專業人員進一步評估並制定修復方案。\n\n`;
    md += `4. **免責條款**：開發者與專案貢獻者不對使用本工具所造成的任何法律後果、資料外洩或損失負責。使用者需自行確保使用行為符合相關法律法規與平台條款。\n\n`;
    md += `5. **保密義務**：本報告僅供授權團隊內部參考，請勿公開散布。如需與第三方分享，請先進行資料遮罩或去識別化處理。\n\n`;
    md += `---\n\n`;
    md += `*本報告由 ${CONFIG.appName} v${CONFIG.version} 自動產生於 ${report.meta.time}*\n\n`;
    md += `*執行與使用本工具，即表示你已閱讀並同意上述使用條款與免責聲明*\n`;

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shoplinechecker-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    console.log("%c✅ Markdown 修復建議文件已匯出（僅儲存在此裝置）", styles.success);
  };

  // 注入 UI
  if (!document.getElementById("sl-checker-ui")) {
    const div = document.createElement("div");
    div.id = "sl-checker-ui";
    div.style.cssText =
      'position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; font-family: "Microsoft JhengHei", "PingFang TC", sans-serif; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); width: 260px; border: 2px solid #3498db; animation: slideIn 0.3s;';

    div.innerHTML = `
      <style>
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        #sl-checker-ui button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
      </style>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:2px solid #3498db; padding-bottom:8px;">
        <span style="font-weight:bold; color:#2c3e50; font-size: 14px;">🛡️ ShoplineChecker</span>
        <span id="sl-close" style="cursor:pointer; font-size:20px; color:#e74c3c; font-weight: bold;">&times;</span>
      </div>
      <div style="margin-bottom:12px; font-size:12px; color:#555; background: #f8f9fa; padding: 8px; border-radius: 4px;">
        <div style="display:flex; justify-content:space-between; margin-bottom: 4px;"><span>🔴 高風險：</span> <b style="color:#e74c3c;">${report.stats.HIGH}</b></div>
        <div style="display:flex; justify-content:space-between; margin-bottom: 4px;"><span>🟡 中風險：</span> <b style="color:#f39c12;">${report.stats.MEDIUM}</b></div>
        <div style="display:flex; justify-content:space-between;"><span>🟢 低風險：</span> <b style="color:#27ae60;">${report.stats.LOW}</b></div>
      </div>
      <button id="sl-btn-json" style="width:100%; padding:10px; margin-bottom:8px; border:none; background:#ecf0f1; color:#2c3e50; border-radius:4px; cursor:pointer; font-weight:600; transition: all 0.2s;">📥 匯出 JSON 報告</button>
      <button id="sl-btn-md" style="width:100%; padding:10px; border:none; background:linear-gradient(90deg, #3498db, #2980b9); color:white; border-radius:4px; cursor:pointer; font-weight:600; transition: all 0.2s;">🔧 產生修復建議 (Markdown)</button>
      <div style="margin-top: 10px; font-size: 10px; color: #95a5a6; text-align: center;">v${CONFIG.version} · 僅供授權自查使用</div>
    `;

    document.body.appendChild(div);

    document.getElementById("sl-close").onclick = () => div.remove();
    document.getElementById("sl-btn-json").onclick = exportJSON;
    document.getElementById("sl-btn-md").onclick = generateMarkdown;
  }

  console.log(
    `%c\n✅ 自查完成！共發現 ${report.vulnerabilities.length} 個風險項目。`,
    styles.success,
  );
  console.log(
    `%c📊 風險分佈：🔴 ${report.stats.HIGH} 高｜🟡 ${report.stats.MEDIUM} 中｜🟢 ${report.stats.LOW} 低`,
    styles.info,
  );
  console.log(
    `%c💡 詳細結果已在上方輸出，也可以用右下角面板匯出 JSON／Markdown 報告。`,
    styles.info,
  );
  console.log(`%c🔗 GitHub：${CONFIG.repoUrl}`, styles.desc);
})(window);
