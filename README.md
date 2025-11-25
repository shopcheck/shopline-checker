# ShoplineChecker.js

> **給 Shopline 店家用的前端資料暴露自查＋安全／隱私輔助小工具**  
> Frontend Data Exposure Self-Check, Safety & Privacy Helper for Shopline Stores (Unofficial)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-2.3.0-green.svg)](https://github.com/nickyoung92/ShoplineChecker)

![ShoplineChecker](./Shopline-Checker-ScreenShot.png)

---

## ⚠️ 法律與合規說明（Legal & Compliance Notice）

在使用這個工具之前，**請先把下面幾點看完**：

- 本工具只適合用在 **你自己或已經拿到明確書面授權** 的 Shopline 店舖／網站上，  
  作為「前端資料暴露自我檢查」以及**安全／隱私相關教學或研究用途**。
- 嚴禁把本工具拿去做任何 **未經授權** 的安全測試、弱點掃描、滲透、攻擊或大量自動化掃描行為。
- 工具只在你的瀏覽器本機跑，分析的是「目前這個頁面已經載入的前端資料」，  
  **不會主動把掃描結果上傳到作者或任何第三方伺服器**。
- 使用本工具代表你已經確認自己對目標站點有足夠授權，  
  並會自行確保使用方式符合你所在地的法律規範，以及 Shopline 等相關平台的服務條款。
- 掃描結果只是技術面上的提示，**不等於法律意見，也不是正式的法遵或資安顧問報告**。  
  如果要做正式的合規判斷或出具意見書，請找專業律師或合規顧問。

> ShoplineChecker 是第三方社群專案，**不是 SHOPLINE 官方工具，也沒有任何官方背書或授權**。  
> 「SHOPLINE」等相關商標權利，均屬於各自的權利人。

---

## 🧭 工具簡介（Overview）

**ShoplineChecker.js** 是一支跑在瀏覽器裡的小腳本，給 **Shopline 店家、前端工程師以及資安相關人員** 用來對「已授權的站點」做前端層級的**自我檢查（self-check）**。

它會在 **瀏覽器本機** 針對目前開啟的頁面，協助你檢查：

- 有沒有在 `window` 上掛一堆不該長期暴露的敏感資料（例如 session ID、使用者 ID、訂單金額…）
- 廣告追蹤與事件上報裡，會不會把使用者識別資訊傳得太開（隱私／法遵風險）
- 網站有沒有缺少一些常見的安全標頭（像 CSP / X-Frame-Options / HSTS 等）

並幫你產出結構化的修正建議報告，方便開發／資安或法遵團隊後續追蹤。

> ⚠️ 這個工具**不會**幫你發什麼奇怪的惡意請求、也不會做 port scan 或暴力破解，  
> 更不會試圖繞過登入系統，只是就「前端已經看得到的東西」做靜態分析而已。

---

## ✨ 功能特性（Features）

### 🔍 核心設定自查（mainConfig）

- 解析 `window.mainConfig`，協助你找出可能不必要暴露的設定，例如：
  - `sessionId`、`Access Token`、API base URL 等
- 看看 `merchantData` 裡有沒有特別敏感的欄位，例如：
  - `sl_payment_merchant_id`、`instagram_access_token` 這種比較「高風險」的設定
- 掃 `beta_feature_keys`／`rollout_keys` 等 feature flags，避免內部還沒公開的功能被看光光

> 這邊的檢查只是提醒：「這些東西真的要在前端公開嗎？」  
> 真正是不是風險，還是要由你們團隊自己判斷。

### 🛍️ 交易資料暴露檢視（Order / Cart）

- 檢查訂單確認頁的 `window.orderData`：包含訂單金額、客戶 ID、商品明細…等
- 檢查購物車頁的 `window.cartData`：SKU、定價策略、數量與金額等
- 偵測快速購物車 `window.QUICK_CART_MODAL_DATA` 是否把完整商品物件全部丟出來
- 檢查 One Page Store `sl-cart-init-data` script 裡面是否塞了過多敏感資料

### 📡 廣告追蹤與隱私輔助

- 掃描 Facebook Pixel queue，提醒你是否有傳雜湊後 Email／Phone 等 PII
- 掃描 TikTok Pixel、Criteo 等追蹤 queue 裡有沒有疑似敏感欄位
- 偵測 LINE Points (`freecoins_lpq` / `freecoins_cvq`) 是否暴露訂單編號、金額等轉換資訊
- 分析 `window.eventTrackers`，瞭解廣告追蹤器設定是否集中暴露

> 工具只會「讀」你前端已排好的事件與設定，  
> **不會自己幫你送新事件，也不會改動任何追蹤邏輯**。

### 💉 框架注入風險偵測（AngularJS）

- 偵測 AngularJS `shop_app` injector 是否存在
- 嘗試讀取 `$rootScope`、`cart`、`order`、`riskResponse` 等服務，提示是否暴露太多敏感狀態
- 檢查 `window.app` 是否直接把 AngularJS app 實例掛在全域

### 🔧 全域 SDK ＆ Data Layer 檢查

- 偵測 `window.shopline` SDK 是否存在，以及 `window.globalSDKObserver` 是否對外開放
- 掃描 `window.dataLayer`（GA/GTM 的 data layer），檢查裡面存了多少事件與欄位

### 🔐 本地儲存（Storage）檢查

- 檢查 `localStorage`／`sessionStorage` 裡，有沒有 key 名稱含：
  - `token`、`auth`、`secret`、`payment`、`user` 等敏感關鍵字
- 協助你辨識「是不是有人把東西長期丟在 localStorage」，作為調整策略（改用 HttpOnly cookie 等）的參考

### 🛡️ 基礎網路安全設定自查

- 看有沒有把 CSRF Token 直接塞在 meta 標籤裡
- 看 URL query 裡有沒有出現 `authorization_token`／`access_token` 等 Token
- 簡單 HEAD 一次目前頁面，檢查 HTTP Response Header 裡常見安全標頭：
  - `X-Frame-Options`
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `X-Content-Type-Options` 等

### 📄 報告輸出（僅在本機）

- **匯出 JSON**：產生一份前端掃描結果快照，方便內部工具或資安同仁分析
- **產生 Markdown 修正建議**：輸出技術文件，內容包含：
  - 風險項目 ID
  - 風險描述與背景
  - 修正方向、優先順序與相關影響

---

## 🚀 使用方式（Usage）

> 設計理念是「直接在瀏覽器 Console 跑」，  
> 不用裝外掛，也不用把資料丟給任何後端服務。

### 基本步驟

1. **打開授權的目標頁面**

   在瀏覽器裡打開你 **自己或已經拿到書面授權** 的 Shopline 店舖頁面。  
   建議測試幾種常見頁面：訂單確認頁／購物車頁／會員中心／One Page Store 等。

2. **開啟瀏覽器開發者工具**

   - Windows / Linux：`F12` 或 `Ctrl + Shift + I`
   - macOS：`Cmd + Option + I`

3. **切到 Console 分頁**

4. **執行腳本**

   打開這個 repo 裡的 [shoplinechecker.js](shoplinechecker.js)，  
   複製全部程式碼，貼到 Console 裡按 Enter 執行。

5. **看結果＆匯出報告**

   - Console 會列出各種分組結果＋風險等級
   - 頁面右下角會出現一個小面板，你可以：
     - 匯出 JSON 報告
     - 產生 Markdown 修正建議文件

> 所有分析、報告產生都在你自己的瀏覽器完成。  
> 除非你自己把檔案傳出去，**工具本身不會幫你上傳任何內容**。

### 推薦測試頁面

| 頁面類型 | 可以看到什麼 |
|---------|--------------|
| 首頁 | `mainConfig`、`eventTrackers`、`criteo_q` |
| 購物車頁 | `cartData`、相關廣告事件 |
| 結帳頁 | AngularJS injector、支付相關設定 |
| 訂單確認頁 | `orderData`、轉換追蹤資料 |
| One Page Store | `sl-cart-init-data`、`sessionData` |
| 會員中心 | `currentUser` 相關欄位（若前端有掛） |

---

## 📊 風險等級說明（Risk Levels）

工具會把發現的項目分三種等級，方便你排優先順序：

| 等級 | 說明 | 範例 |
|------|------|------|
| 🔴 **HIGH** | 建議優先處理，風險較高 | Session ID 暴露、長效 Token 暴露、Instagram Token 外流、CSP 缺失、有 PII 的追蹤事件 |
| 🟡 **MEDIUM** | 具有實質風險，建議中短期納入規劃 | 購物車完整暴露、CSRF Token 暴露、Feature Flags 洩漏 |
| 🟢 **LOW** | 比較偏 Best Practice，長期可以慢慢調整 | 公開的 Merchant ID、較不敏感的 SDK 全域暴露 |

> 等級只是技術面「嚴重度」的參考，  
> 真正的業務影響還是要看你的產品形態、法遵要求跟風險承受度。

---

## ⚖️ 法律與合規細節（Legal & Compliance Details）

### 使用範圍

- 只適用於：
  - 你的自家 Shopline 店舖／網站，或
  - 已經拿到業主「明確書面授權」要你協助檢查的站點
- 請不要在未經授權的網站、競品網站或任何不確定合法性的目標上使用。

### 明確禁止的行為

- 使用本工具從事下列用途都是 **不OK** 的：
  - 未授權的弱點掃描、滲透測試、DoS／壓力測試
  - 企圖繞過登入、權限控管或取得不該看的資料
  - 大量對陌生站點掃描、收集競爭情報或其他違法行為
  - 任何違反相關法律、平台服務條款或契約約定的用途

### 資料處理與隱私權

- 工具只在「瀏覽器端」跑，不會內建任何上傳掃描結果的程式碼。
- 如果你選擇匯出 JSON／Markdown 報告：
  - 檔案會直接出現在你的裝置，由你自己決定要怎麼存放與分享
  - 如涉及個資／敏感交易資訊，請依個資法、隱私權政策與內部規範處理
  - 建議在對外分享之前先做遮罩或去識別化

### 免責聲明

- 專案採用 MIT License 發佈，以「現狀（AS IS）」提供，不保證適用於任何特定目的。
- 使用過程中若因為操作方式違規、誤用、或他人違法行為導致任何損失、爭議或法律責任，  
  **由使用者自行負責**，與專案作者及貢獻者無關。
- 掃描結果只是技術型輔助資訊，不代表法律意見或合規判斷。

---

## 🔗 相關資源（References）

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GDPR 官方資訊](https://gdpr.eu/)
- [加州消費者隱私法 CCPA](https://oag.ca.gov/privacy/ccpa)
- [MDN — Web 安全最佳實務](https://developer.mozilla.org/en-US/docs/Web/Security)
- [MDN — Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

## 🤝 貢獻方式（Contributing）

歡迎發 PR 或開 Issue，像是：

- 回報誤報／漏報
- 增加新的敏感欄位規則或平台情境
- 調整輸出格式、讓報告更好讀
- 幫忙優化文案、合規提示或 README

> 請不要提交任何「攻擊性功能」相關程式碼，  
> 例如自動注入 payload、暴力破解、port scan 那類東西。

---

## 📄 授權（License）

本專案以 [MIT License](LICENSE) 授權開源。
