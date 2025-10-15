# @monkind/shared

MonKind 電商平台的共用組件、服務和工具庫。

## 包含內容

### 組件 (Components)

- **GLBViewer**: 3D 模型預覽組件
- **UVMapper**: UV 映射配置組件
- **Editor**: 統一編輯器組件 (UniversalEditor, MainContentArea, LeftSidebar)
- **Preview**: 預覽相關組件 (ProductPreview, TemplateThumbnail)

### 服務 (Services)

- **api**: API 統一接口服務

### 工具 (Utils)

- **ProductDataManager**: 產品資料管理工具

## 使用方式

```javascript
// 導入組件
import GLBViewer from '@monkind/shared/components/GLBViewer';
import { UniversalEditor } from '@monkind/shared/components/Editor';
import { ProductPreview } from '@monkind/shared/components/Preview';

// 導入服務
import { API } from '@monkind/shared/services/api';

// 導入工具
import { ProductDataManager } from '@monkind/shared/utils';
```

## 依賴

此套件使用 peer dependencies，需要在使用專案中安裝：

- React ^18.0.0 或 ^19.0.0
- React DOM ^18.0.0 或 ^19.0.0
