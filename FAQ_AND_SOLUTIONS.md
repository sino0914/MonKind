# 常見問題與解決方案 (FAQ)

記錄常見開發問題、解決步驟、相關檔案和參考資料。持續更新。

## 目錄

- [編輯器相關](#編輯器相關)
- [3D 渲染相關](#3d-渲染相關)
- [API 相關](#api-相關)
- [部署和環境](#部署和環境)
- [效能優化](#效能優化)

---

## 編輯器相關

### Q1: 如何新增自定義元素屬性（例如：透明度）？

**問題描述**: 想要為圖片或文字元素新增 opacity（透明度）屬性

**涉及檔案**:
1. `useEditorState.js` - 更新元素資料結構
2. `DesignElementsLayer.jsx` - 更新編輯器渲染邏輯
3. `ProductPreview.jsx` - 更新預覽渲染邏輯
4. `snapshot3D.js` - 更新 3D 快照生成
5. `snapshot2D.js` - 更新 2D 快照生成
6. `canvasUtils.js` - 更新匯出和列印功能
7. `ImagePanel.jsx` 或 `TextPanel.jsx` - 添加 UI 控制

**解決步驟**:

1. **定義資料結構預設值**
   ```javascript
   // useEditorState.js
   const defaultElement = {
     ...existingProps,
     opacity: 1  // 新增預設值
   };
   ```

2. **更新編輯器渲染**
   ```jsx
   // DesignElementsLayer.jsx
   <div style={{
     ...existingStyles,
     opacity: element.opacity || 1
   }}>
   ```

3. **更新預覽渲染（DOM）**
   ```jsx
   // ProductPreview.jsx (2D 預覽)
   <div style={{
     ...existingStyles,
     opacity: element.opacity || 1
   }}>
   ```

4. **更新預覽渲染（Canvas）**
   ```javascript
   // ProductPreview.jsx (UV 貼圖生成)
   ctx.globalAlpha = element.opacity || 1;
   ctx.drawImage(...);
   ctx.globalAlpha = 1; // 重置
   ```

5. **更新快照生成**
   ```javascript
   // snapshot3D.js 和 snapshot2D.js
   ctx.globalAlpha = element.opacity || 1;
   // ... 繪製元素
   ctx.globalAlpha = 1;
   ```

6. **更新匯出功能**
   ```javascript
   // canvasUtils.js - exportDesignToImage() 和 generatePrintFile()
   ctx.globalAlpha = element.opacity || 1;
   // ... 繪製元素
   ctx.globalAlpha = 1;
   ```

7. **添加 UI 控制**
   ```jsx
   // ImagePanel.jsx
   <label>
     透明度
     <input
       type="range"
       min="0"
       max="100"
       value={(element.opacity || 1) * 100}
       onChange={(e) => updateElement(element.id, {
         opacity: e.target.value / 100
       })}
     />
   </label>
   ```

**測試清單**:
- [ ] 編輯器中即時顯示正確
- [ ] 2D 預覽顯示正確
- [ ] 3D 預覽顯示正確
- [ ] 快照生成正確
- [ ] 匯出圖片正確
- [ ] 列印檔案正確

**參考資料**:
- `RENDERING_FILES_GUIDE.md` - 完整的渲染檔案清單
- `ARCHITECTURE.md` - 編輯器架構說明

---

### Q2: 元素拖曳時無法移動或行為異常

**問題描述**: 拖曳元素時元素跳動、無法移動或移動不流暢

**可能原因**:
1. 元素被鎖定
2. 座標轉換錯誤（視窗縮放時）
3. 拖曳狀態未正確更新
4. 列印區域邊界驗證問題

**解決步驟**:

1. **檢查元素是否被鎖定**
   ```javascript
   // LayerPanel.jsx
   const isLocked = editorState.isLayerLocked(element.id);
   console.log(`元素 ${element.id} 鎖定狀態:`, isLocked);
   ```

2. **檢查座標轉換**
   ```javascript
   // useCanvasInteraction.js
   const { canvasX, canvasY } = screenToCanvasCoords(clientX, clientY, canvasRect);
   console.log('螢幕座標:', { clientX, clientY });
   console.log('畫布座標:', { canvasX, canvasY });
   ```

3. **檢查拖曳狀態**
   ```javascript
   // useEditorState.js
   console.log('拖曳狀態:', {
     draggedElement,
     dragOffset,
     isDragging: isDragging.current
   });
   ```

4. **暫時關閉邊界驗證**
   ```javascript
   // useCanvasInteraction.js
   // 暫時註解掉邊界驗證
   // if (!validatePrintArea(updatedElement, currentProduct.printArea)) {
   //   return;
   // }
   ```

**常見修正**:
- 確保 `endDrag()` 在 `mouseup` 時被調用
- 檢查 `dragOffset` 計算是否正確
- 檢查是否有多個事件監聽器衝突

**相關檔案**:
- `useCanvasInteraction.js:handleMouseDown` - 開始拖曳
- `useCanvasInteraction.js:handleMouseMove` - 執行拖曳
- `useCanvasInteraction.js:handleMouseUp` - 結束拖曳
- `useEditorState.js` - 拖曳狀態管理

---

### Q3: 文字元素寬度計算不正確

**問題描述**: 添加文字元素時，寬度太窄導致文字被截斷

**涉及檔案**:
- `canvasUtils.js:measureTextWidth()` - 測量文字寬度
- `useTextEditor.js` - 添加文字元素

**解決步驟**:

1. **檢查字型載入**
   ```javascript
   // 確保字型已載入
   await document.fonts.ready;
   ```

2. **檢查測量邏輯**
   ```javascript
   // canvasUtils.js
   const measureTextWidth = (text, fontSize, fontFamily, fontWeight, fontStyle) => {
     const canvas = document.createElement("canvas");
     const context = canvas.getContext("2d");
     // 確保字型格式正確
     context.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
     const width = context.measureText(text).width;

     console.log('測量結果:', {
       text,
       fontSize,
       fontFamily,
       measuredWidth: width
     });

     // 添加一些 padding
     return Math.max(20, Math.ceil(width) + 32); // 增加 padding
   };
   ```

3. **動態調整寬度**
   ```javascript
   // useTextEditor.js - 文字變更時自動調整寬度
   const handleTextChange = (id, newText) => {
     const element = elements.find(e => e.id === id);
     const newWidth = measureTextWidth(
       newText,
       element.fontSize,
       element.fontFamily,
       element.fontWeight,
       element.fontStyle
     );

     updateElement(id, {
       text: newText,
       width: newWidth
     });
   };
   ```

**常見問題**:
- 自定義字型未載入完成
- 字型名稱拼寫錯誤
- 未考慮粗體和斜體

---

### Q4: 撤銷/重做功能不正常

**問題描述**: 撤銷後狀態不正確，或無法撤銷

**涉及檔案**:
- `useEditorState.js` - 歷史記錄管理

**解決步驟**:

1. **檢查歷史記錄**
   ```javascript
   console.log('歷史記錄:', {
     history,
     historyIndex,
     canUndo,
     canRedo
   });
   ```

2. **檢查是否在拖曳/縮放時記錄**
   ```javascript
   // useEditorState.js
   // 拖曳和縮放完成時才記錄歷史
   const endDrag = () => {
     if (draggedElement.current) {
       recordHistory(designElements, backgroundColor);
     }
     // ...
   };
   ```

3. **檢查深拷貝**
   ```javascript
   // 確保歷史記錄是深拷貝
   const snapshot = {
     elements: JSON.parse(JSON.stringify(newElements)),
     backgroundColor: newBackgroundColor,
   };
   ```

**常見問題**:
- 每次狀態變更都記錄歷史（應該只在操作完成時記錄）
- 未使用深拷貝導致歷史記錄被修改
- 撤銷時觸發新的歷史記錄

---

## 3D 渲染相關

### Q5: 3D 模型的貼圖顯示不正確

**問題描述**: 3D 預覽中設計元素位置、大小或旋轉不正確

**涉及檔案**:
- `snapshot3D.js:generateUVTexture()` - UV 貼圖生成
- `ProductPreview.jsx` - 3D 預覽
- `GLBViewer.jsx` - 3D 模型查看器

**解決步驟**:

1. **檢查 UV 貼圖生成**
   ```javascript
   // snapshot3D.js
   console.log('UV 貼圖生成:', {
     printArea,
     elementCount: designElements.length,
     canvasSize: `${canvas.width}x${canvas.height}`
   });

   // 將 UV 貼圖輸出到控制台檢查
   console.log('UV 貼圖 URL:', canvas.toDataURL());
   ```

2. **檢查座標轉換**
   ```javascript
   // snapshot3D.js - generateUVTexture()
   designElements.forEach(el => {
     const canvasX = el.x - printArea.x;
     const canvasY = el.y - printArea.y;

     console.log('元素座標轉換:', {
       原始: { x: el.x, y: el.y },
       列印區域偏移: { x: printArea.x, y: printArea.y },
       畫布座標: { canvasX, canvasY }
     });
   });
   ```

3. **檢查 scaleX/scaleY**
   ```javascript
   // 確保 scaleX 和 scaleY 正確應用
   const w = baseW * (el.scaleX || 1);
   const h = baseH * (el.scaleY || 1);

   console.log('元素縮放:', {
     baseSize: { w: baseW, h: baseH },
     scale: { x: el.scaleX, y: el.scaleY },
     finalSize: { w, h }
   });
   ```

4. **檢查旋轉順序**
   ```javascript
   // 確保 transform 順序正確
   ctx.translate(x + w/2, y + h/2);  // 移到中心
   ctx.rotate(rotation * Math.PI / 180);  // 旋轉
   ctx.scale(scaleX, scaleY);  // 縮放
   ctx.drawImage(...);  // 繪製
   ```

5. **比對 ProductPreview**
   ```javascript
   // ProductPreview.jsx 的 UV 貼圖生成應該與 snapshot3D.js 一致
   // 比對兩者的邏輯是否相同
   ```

**測試方法**:
1. 在 2D 預覽中檢查元素顯示是否正確
2. 將 UV 貼圖下載下來檢查
3. 比較 2D 和 3D 預覽的差異

**常見問題**:
- 座標系不一致（2D vs 3D）
- UV 映射配置錯誤
- 圖片未載入完成就生成貼圖

**相關檔案**:
- `snapshot3D.js:94-190` - UV 貼圖生成邏輯
- `ProductPreview.jsx:190-275` - 預覽 UV 貼圖生成
- `RENDERING_FILES_GUIDE.md` - 渲染檔案指南

---

### Q6: GLB 模型無法載入或顯示為黑色

**問題描述**: 3D 模型無法顯示或顯示為全黑

**可能原因**:
1. GLB 檔案路徑錯誤
2. 燈光設定問題
3. 材質問題
4. 相機位置問題

**解決步驟**:

1. **檢查 GLB 路徑**
   ```javascript
   // GLBViewer.jsx
   console.log('載入 GLB:', glbUrl);

   // 檢查檔案是否存在
   fetch(glbUrl)
     .then(res => console.log('GLB 檔案狀態:', res.status))
     .catch(err => console.error('GLB 載入失敗:', err));
   ```

2. **檢查燈光**
   ```javascript
   // GLBViewer.jsx
   // 確保有足夠的燈光
   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
   const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
   scene.add(ambientLight, directionalLight);
   ```

3. **檢查材質**
   ```javascript
   // 載入模型後檢查材質
   gltf.scene.traverse((child) => {
     if (child.isMesh) {
       console.log('網格材質:', child.material);
       // 確保材質有貼圖
       console.log('貼圖:', child.material.map);
     }
   });
   ```

4. **調整相機位置**
   ```javascript
   // 確保相機能看到模型
   camera.position.set(0, 0, 5);
   camera.lookAt(0, 0, 0);
   ```

**常見問題**:
- 忘記添加燈光
- GLB 檔案損壞
- CORS 問題導致無法載入

---

## API 相關

### Q7: API 請求失敗或返回 404

**問題描述**: 調用後端 API 時返回 404 或 500 錯誤

**解決步驟**:

1. **檢查後端是否啟動**
   ```bash
   # 確認後端伺服器運行中
   pnpm dev:admin
   # 或
   cd packages/admin-app/server && node server.js
   ```

2. **檢查 API 端點**
   ```javascript
   // HttpApiService.js
   console.log('API 請求:', {
     method: 'GET',
     url: `${this.baseURL}/api/products`,
     headers: this.headers
   });
   ```

3. **檢查 CORS 設定**
   ```javascript
   // server/server.js
   app.use(cors({
     origin: ['http://localhost:3000', 'http://localhost:3001'],
     credentials: true
   }));
   ```

4. **檢查路由註冊**
   ```javascript
   // server/server.js
   app.use('/api/products', productsRouter);
   app.use('/api/orders', ordersRouter);
   // ... 確保所有路由都已註冊
   ```

5. **查看後端日誌**
   ```bash
   # 查看後端控制台輸出
   # 應該會顯示請求日誌
   ```

**常見問題**:
- 後端未啟動
- 端口衝突（3002 被佔用）
- CORS 設定錯誤
- API 路徑拼寫錯誤

**快速檢查**:
```bash
# 測試 API 是否可訪問
curl http://localhost:3002/api/products
```

**相關檔案**:
- `API_REFERENCE.md` - 完整 API 文檔
- `packages/admin-app/server/server.js` - 後端主檔案

---

### Q8: 圖片上傳失敗

**問題描述**: 上傳圖片時返回錯誤或圖片未儲存

**可能原因**:
1. 檔案大小超過限制
2. 檔案類型不支援
3. 儲存目錄權限問題
4. multipart/form-data 格式錯誤

**解決步驟**:

1. **檢查檔案大小**
   ```javascript
   // routes/upload.js
   limits: {
     fileSize: 200 * 1024 * 1024, // 200MB
   }
   ```

2. **檢查檔案類型**
   ```javascript
   // routes/upload.js
   const allowedTypes = [
     'image/jpeg',
     'image/png',
     'image/webp',
     'image/svg+xml'
   ];
   ```

3. **檢查儲存目錄**
   ```bash
   # 確保目錄存在且有寫入權限
   ls -la packages/admin-app/server/data/uploads/images/
   ```

4. **檢查請求格式**
   ```javascript
   // 確保使用 FormData
   const formData = new FormData();
   formData.append('editorImage', file);
   formData.append('userId', userId);

   fetch('/api/upload/editor-image', {
     method: 'POST',
     body: formData
     // 不要設定 Content-Type，讓瀏覽器自動設定
   });
   ```

**常見錯誤訊息**:
- "文件大小超過限制" → 調整 `fileSize` 限制
- "不支援的文件類型" → 檢查 `allowedTypes` 或 `allowedExtensions`
- "沒有接收到文件" → 檢查 FormData 欄位名稱是否正確

---

## 部署和環境

### Q9: Monorepo 安裝依賴失敗

**問題描述**: 執行 `pnpm install` 時出現錯誤

**解決步驟**:

1. **清除快取**
   ```bash
   pnpm store prune
   rm -rf node_modules
   rm pnpm-lock.yaml
   ```

2. **重新安裝**
   ```bash
   pnpm install
   ```

3. **檢查 Node 版本**
   ```bash
   node -v  # 建議 >= 16.x
   pnpm -v  # 建議 >= 8.x
   ```

4. **檢查 workspace 配置**
   ```yaml
   # pnpm-workspace.yaml
   packages:
     - 'packages/*'
   ```

5. **檢查 package.json**
   ```json
   // 確保 workspace 依賴使用 "workspace:*"
   {
     "dependencies": {
       "shared": "workspace:*"
     }
   }
   ```

**常見問題**:
- Node 版本過舊
- pnpm 版本不相容
- workspace 配置錯誤

**參考資料**:
- `MONOREPO_MIGRATION.md` - Monorepo 遷移指南
- `README.md` - 專案設定說明

---

### Q10: 開發伺服器無法啟動

**問題描述**: 執行 `pnpm dev:admin` 或 `pnpm dev:customer` 時失敗

**解決步驟**:

1. **檢查端口是否被佔用**
   ```bash
   # Windows
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   netstat -ano | findstr :3002

   # Mac/Linux
   lsof -i :3000
   lsof -i :3001
   lsof -i :3002
   ```

2. **終止佔用端口的程序**
   ```bash
   # Windows
   taskkill /PID <PID> /F

   # Mac/Linux
   kill -9 <PID>
   ```

3. **檢查環境變數**
   ```bash
   # 確保 .env 檔案存在
   ls packages/admin-app/.env
   ls packages/customer-app/.env
   ```

4. **查看錯誤訊息**
   ```bash
   # 通常錯誤訊息會指出問題所在
   pnpm dev:admin 2>&1 | tee error.log
   ```

**常見問題**:
- 端口被佔用
- 缺少 .env 檔案
- 依賴未安裝

---

## 效能優化

### Q11: 編輯器渲染卡頓

**問題描述**: 添加多個元素後，編輯器變得卡頓

**優化步驟**:

1. **使用 React.memo 優化組件**
   ```javascript
   // DesignElementsLayer.jsx
   const ElementRenderer = React.memo(({ element }) => {
     // ...
   }, (prevProps, nextProps) => {
     // 只在元素變更時重新渲染
     return prevProps.element === nextProps.element;
   });
   ```

2. **優化事件處理**
   ```javascript
   // 使用 useCallback 避免重新建立函數
   const handleMouseMove = useCallback((e) => {
     // ...
   }, [dependencies]);

   // 使用節流
   const throttledMouseMove = throttle(handleMouseMove, 16); // 60fps
   ```

3. **延遲載入圖片**
   ```javascript
   // 使用 IntersectionObserver 延遲載入
   const [isVisible, setIsVisible] = useState(false);

   useEffect(() => {
     const observer = new IntersectionObserver(([entry]) => {
       setIsVisible(entry.isIntersecting);
     });
     observer.observe(elementRef.current);
     return () => observer.disconnect();
   }, []);
   ```

4. **虛擬化大型列表**
   ```javascript
   // 使用 react-window 或 react-virtualized
   import { FixedSizeList } from 'react-window';

   <FixedSizeList
     height={500}
     itemCount={elements.length}
     itemSize={50}
   >
     {ElementRenderer}
   </FixedSizeList>
   ```

5. **減少不必要的重新渲染**
   ```javascript
   // 使用 React DevTools Profiler 找出效能瓶頸
   // 檢查哪些組件重新渲染次數過多
   ```

**常見問題**:
- 未使用 React.memo
- 事件處理函數每次都重新建立
- 大型列表未虛擬化

---

### Q12: 3D 預覽載入緩慢

**問題描述**: 3D 模型載入時間過長

**優化步驟**:

1. **壓縮 GLB 檔案**
   ```bash
   # 使用 gltf-pipeline 壓縮
   npm install -g gltf-pipeline
   gltf-pipeline -i model.glb -o model-compressed.glb -d
   ```

2. **使用 Draco 壓縮**
   ```bash
   gltf-pipeline -i model.glb -o model-draco.glb --draco.compressionLevel=10
   ```

3. **延遲載入 3D 模型**
   ```javascript
   // 只在切換到 3D 預覽時才載入
   const [show3D, setShow3D] = useState(false);

   return (
     <div>
       <button onClick={() => setShow3D(true)}>顯示 3D 預覽</button>
       {show3D && <GLBViewer glbUrl={glbUrl} />}
     </div>
   );
   ```

4. **添加載入進度**
   ```javascript
   // GLBViewer.jsx
   const loader = new GLTFLoader();
   loader.load(
     glbUrl,
     (gltf) => { /* onLoad */ },
     (progress) => {
       const percent = (progress.loaded / progress.total) * 100;
       console.log(`載入進度: ${percent}%`);
     },
     (error) => { /* onError */ }
   );
   ```

5. **快取 UV 貼圖**
   ```javascript
   // 避免重複生成相同的 UV 貼圖
   const uvTextureCache = useRef(new Map());

   const getUVTexture = async (designElements) => {
     const key = JSON.stringify(designElements);
     if (uvTextureCache.current.has(key)) {
       return uvTextureCache.current.get(key);
     }
     const texture = await generateUVTexture(designElements);
     uvTextureCache.current.set(key, texture);
     return texture;
   };
   ```

**常見問題**:
- GLB 檔案過大（未壓縮）
- 每次都重新生成 UV 貼圖
- 未顯示載入進度讓使用者不知道發生什麼事

---

## 除錯技巧

### 一般除錯流程

1. **檢查瀏覽器控制台**
   - 查看是否有錯誤訊息
   - 查看 Network 標籤檢查 API 請求

2. **使用 React DevTools**
   - 檢查組件 props 和 state
   - 使用 Profiler 找出效能瓶頸

3. **添加 console.log**
   - 在關鍵位置添加 log
   - 使用有意義的 log 訊息

4. **使用 Chrome DevTools**
   - 使用 Debugger 設定中斷點
   - 使用 Elements 標籤檢查 DOM 和樣式

5. **比對正常情況**
   - 比較正常和異常狀態的差異
   - 檢查資料結構是否正確

---

## 貢獻

如果你解決了新的問題，請將解決方案添加到此文檔：

1. 描述問題
2. 列出涉及的檔案
3. 提供詳細的解決步驟
4. 添加相關的程式碼範例
5. 列出常見錯誤和解決方法

---

**最後更新**: 2025-01-12
**版本**: 1.0
**維護者**: MonKind 開發團隊

**持續更新**: 此文檔將持續更新常見問題和解決方案
