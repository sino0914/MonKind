# 模块解析错误修复 - 背景图映射功能

## 问题描述

编译时出现以下错误：

```
ERROR in ./src/pages/Products/ProductMaintenance.jsx 17:0-119
Module not found: Error: Package path ./components/ProductMaintenance/components/BackgroundImageUploader 
is not exported from package @monkind/shared

ERROR in ./src/pages/Products/ProductMaintenance.jsx 18:0-117
Module not found: Error: Package path ./components/ProductMaintenance/components/BleedAreaMappingEditor 
is not exported from package @monkind/shared
```

## 原因分析

新创建的组件没有在以下位置导出：

1. **ProductMaintenance/index.js** - 该模块的导出文件
2. **shared/package.json** - 包的导出配置

## 解决方案

### 1. 更新 ProductMaintenance/index.js

添加新组件和Hook的导出：

```javascript
// Hooks
export { default as useBleedAreaMapping } from './hooks/useBleedAreaMapping';

// Components
export { default as BackgroundImageUploader } from './components/BackgroundImageUploader';
export { default as BleedAreaMappingEditor } from './components/BleedAreaMappingEditor';

// Utils
export * from './utils/bleedAreaMappingUtils';
```

### 2. 更新 shared/package.json

在 `exports` 字段中添加新的导出路径：

```json
"./components/ProductMaintenance/components/BackgroundImageUploader": "./components/ProductMaintenance/components/BackgroundImageUploader.jsx",
"./components/ProductMaintenance/components/BleedAreaMappingEditor": "./components/ProductMaintenance/components/BleedAreaMappingEditor.jsx",
"./components/ProductMaintenance/hooks/useBleedAreaMapping": "./components/ProductMaintenance/hooks/useBleedAreaMapping.js",
"./components/ProductMaintenance/utils/bleedAreaMappingUtils": "./components/ProductMaintenance/utils/bleedAreaMappingUtils.js"
```

## 验证

✅ 项目成功编译 - 构建完成，无模块解析错误

```
Compiled with warnings.
File sizes after gzip:
  463.75 kB  build/static/js/main.e479a4ba.js
```

## 文件修改

- `/packages/shared/components/ProductMaintenance/index.js` - 添加导出
- `/packages/shared/package.json` - 配置导出路径

---

**修复时间**: 2025-11-26
**提交**: 1d7dcb7
