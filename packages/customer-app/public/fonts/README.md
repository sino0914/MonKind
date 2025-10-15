# 字型檔案說明

## 目錄用途
此目錄用於存放自訂字型檔案，供編輯器使用。

## 支援的字型格式
- `.ttf` (TrueType Font)
- `.otf` (OpenType Font)
- `.woff` (Web Open Font Format)
- `.woff2` (Web Open Font Format 2.0)

## 如何新增自訂字型

### 1. 將字型檔案放入此目錄
將字型檔案複製到 `public/fonts/` 目錄下。

例如：
```
public/fonts/
├── CustomFont.ttf
├── MyFont.woff2
└── SpecialFont.otf
```

### 2. 在 CSS 中定義字型
在 `src/index.css` 或 `src/App.css` 中加入 @font-face 定義：

```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/CustomFont.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'MyFont';
  src: url('/fonts/MyFont.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
}
```

### 3. 在編輯器中加入字型選項
編輯 `src/components/Editor/UniversalEditor.jsx`，在字型選擇器中加入新選項：

```jsx
<select>
  {/* 現有字型 */}
  <option value="Arial">Arial</option>

  {/* 新增自訂字型 */}
  <option value="CustomFont">CustomFont</option>
  <option value="MyFont">MyFont</option>
</select>
```

## 預設字型列表

目前編輯器支援以下系統預設字型：

### 英文字型
- **Arial** - 無襯線字型，清晰易讀
- **Helvetica** - 經典無襯線字型
- **Times New Roman** - 襯線字型，正式文件常用
- **Georgia** - 襯線字型，適合內文
- **Courier New** - 等寬字型，適合程式碼
- **Verdana** - 螢幕顯示專用字型

### 中文字型
- **微軟正黑體** - Windows 系統預設中文字型
- **新細明體** - Windows 系統傳統中文字型
- **標楷體** - 傳統書法風格字型

## 推薦字型資源

### 免費字型網站
- [Google Fonts](https://fonts.google.com/) - 免費開源字型
- [Adobe Fonts](https://fonts.adobe.com/) - Adobe 字型服務
- [DaFont](https://www.dafont.com/) - 免費字型下載
- [思源黑體](https://github.com/adobe-fonts/source-han-sans) - 免費開源中文字型
- [Noto Sans CJK](https://github.com/notofonts/noto-cjk) - Google 免費中文字型

### 中文字型推薦
- **思源黑體** (Source Han Sans) - Adobe 與 Google 合作開發
- **Noto Sans TC** - Google 繁體中文字型
- **jf open 粉圓** - 可愛圓體風格
- **TW-Kai 全字庫楷書** - 教育部楷書字型

## 授權注意事項

⚠️ **重要提醒**：
- 使用商業字型前，請確認授權條款
- 某些字型僅限個人使用
- 網頁使用字型可能需要特殊授權
- 建議使用開源或免費商用字型

## 字型效能優化建議

1. **使用 woff2 格式**：檔案最小，載入最快
2. **字型子集化**：只包含需要的字元，減少檔案大小
3. **延遲載入**：使用 `font-display: swap` 避免文字閃爍

```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/CustomFont.woff2') format('woff2');
  font-display: swap; /* 優化載入體驗 */
}
```

## 疑難排解

### 字型無法顯示？
1. 檢查檔案路徑是否正確
2. 確認 @font-face 語法正確
3. 清除瀏覽器快取重新載入
4. 檢查瀏覽器控制台是否有錯誤訊息

### 字型載入很慢？
1. 優化字型檔案大小（使用 woff2 格式）
2. 考慮使用字型子集化
3. 使用 CDN 加速字型載入

## 範例：新增思源黑體

1. 下載思源黑體：https://github.com/adobe-fonts/source-han-sans
2. 將 `SourceHanSansTC-Regular.otf` 複製到 `public/fonts/`
3. 在 `src/index.css` 加入：

```css
@font-face {
  font-family: '思源黑體';
  src: url('/fonts/SourceHanSansTC-Regular.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}
```

4. 在 UniversalEditor.jsx 加入選項：

```jsx
<option value="思源黑體">思源黑體</option>
```

---

**注意**：本專案預設使用系統字型，不需要額外下載。若要使用自訂字型，請按照上述步驟操作。
