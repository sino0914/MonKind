import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { API } from "@monkind/shared/services/api";
import { UniversalEditor } from "@monkind/shared/components/Editor";

const TemplateEditor = () => {
  const { templateId } = useParams(); // 版型ID，如果是new則為新建
  const id = templateId; // 保持向下兼容
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');

  const [product, setProduct] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // 版型資訊狀態
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");

  // 內部表單狀態（用於即時顯示）
  const [formTemplateName, setFormTemplateName] = useState("");
  const [formTemplateDescription, setFormTemplateDescription] = useState("");

  // 追蹤目前的設計狀態
  const [currentDesignState, setCurrentDesignState] = useState({
    elements: [],
    backgroundColor: "#ffffff"
  });

  // 載入商品和版型資料
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 TemplateEditor - 開始載入資料');
      console.log('   - ID參數:', id);
      console.log('   - ProductID參數:', productId);

      // 載入商品資料
      let targetProductId = productId;

      if (id !== 'new') {
        // 編輯現有版型
        console.log('✏️ 編輯現有版型，ID:', id);
        const templateData = await API.templates.getById(parseInt(id));
        if (!templateData) {
          console.error('❌ 找不到版型，ID:', id);
          setError("找不到此版型");
          return;
        }

        console.log('✅ 版型載入成功:', templateData);
        setTemplate(templateData);
        setTemplateName(templateData.name);
        setTemplateDescription(templateData.description);
        setFormTemplateName(templateData.name);
        setFormTemplateDescription(templateData.description);
        targetProductId = templateData.productId;
      } else {
        console.log('🆕 建立新版型');
        if (!productId) {
          console.error('❌ 新建版型缺少ProductID參數');
          setError("缺少商品ID參數，無法建立新版型");
          return;
        }
      }

      // 載入商品資料
      if (targetProductId) {
        console.log('📦 載入商品資料，ID:', targetProductId);
        const productData = await API.products.getById(parseInt(targetProductId));
        if (!productData) {
          console.error('❌ 找不到商品，ID:', targetProductId);
          setError("找不到對應的商品");
          return;
        }

        console.log('✅ 商品載入成功:', productData);

        // 檢查是否有設計區設定
        if (!productData.printArea) {
          console.warn("⚠️ 此商品尚未設定設計區範圍，使用預設值");
          productData.printArea = {
            x: 50,
            y: 50,
            width: 200,
            height: 150,
            offsetX: 100,
            offsetY: 75
          };
        }

        setProduct(productData);
        console.log('✅ TemplateEditor - 資料載入完成');
      } else {
        console.error('❌ 缺少商品ID參數');
        setError("缺少商品ID參數");
      }
    } catch (error) {
      console.error("❌ TemplateEditor - 載入資料失敗:", error);
      setError(`載入失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, productId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 儲存版型
  const handleSaveTemplate = async (designData) => {
    try {
      setSaving(true);

      // 優先使用從 UniversalEditor 傳來的最新值
      const finalTemplateName = designData.templateName || formTemplateName || templateName;
      const finalTemplateDescription = designData.templateDescription || formTemplateDescription || templateDescription;

      // 根據商品類型生成快照
      let previewImage = null;
      console.log('🎨 開始生成版型快照，商品類型:', product.type);

      try {
        if (product.type === '3D') {
          // 生成 3D 快照
          const { generate3DSnapshot } = await import('@monkind/shared/components/Editor/utils');
          const snapshotBase64 = await generate3DSnapshot(
            product,
            designData.elements,
            designData.backgroundColor,
            400,
            400
          );
          console.log('✅ 3D 快照生成成功');

          // 上傳到伺服器
          try {
            const uploadResult = await API.upload.snapshot(snapshotBase64, product.id);
            previewImage = uploadResult.url;
            console.log('✅ 快照已上傳到伺服器:', uploadResult.url);
          } catch (uploadError) {
            console.error('❌ 上傳快照失敗，使用 base64 儲存:', uploadError);
            previewImage = snapshotBase64; // 失敗時回退到 base64
          }
        } else {
          // 生成 2D 快照
          const { generate2DSnapshot } = await import('@monkind/shared/components/Editor/utils');
          const snapshotBase64 = await generate2DSnapshot(
            product,
            designData.elements,
            designData.backgroundColor,
            400,
            400
          );
          console.log('✅ 2D 快照生成成功');

          // 上傳到伺服器
          try {
            const uploadResult = await API.upload.snapshot(snapshotBase64, product.id);
            previewImage = uploadResult.url;
            console.log('✅ 快照已上傳到伺服器:', uploadResult.url);
          } catch (uploadError) {
            console.error('❌ 上傳快照失敗，使用 base64 儲存:', uploadError);
            previewImage = snapshotBase64; // 失敗時回退到 base64
          }
        }
      } catch (snapshotError) {
        console.error('❌ 生成快照失敗:', snapshotError);
        // 繼續儲存版型，但沒有預覽圖
      }

      const templateData = {
        name: finalTemplateName,
        description: finalTemplateDescription,
        productId: product.id,
        productCategory: product.category,
        elements: designData.elements || [],
        backgroundColor: designData.backgroundColor || "#ffffff",
        previewImage: previewImage, // 新增快照欄位
        isActive: true
      };

      if (id === 'new') {
        // 新建版型
        await API.templates.create(templateData);
        alert("版型建立成功！");
      } else {
        // 更新版型
        await API.templates.update(parseInt(id), templateData);
        alert("版型更新成功！");
      }

      // 返回版型管理頁面
      navigate("/templates");
    } catch (error) {
      console.error("儲存版型失敗:", error);
      alert("儲存失敗，請重新嘗試");
    } finally {
      setSaving(false);
    }
  };

  // 取消編輯
  const handleCancel = () => {
    if (window.confirm("確定要取消編輯嗎？未儲存的變更將會遺失。")) {
      navigate("/templates");
    }
  };

  // 版型資訊表單 - 簡化版，主要輸入框已移至工具列
  const templateInfoForm = (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {id === 'new' ? '新建版型' : '編輯版型'}
        </h2>
        <p className="text-sm text-gray-600">
          在上方工具列輸入版型名稱和描述，然後開始設計您的版型
        </p>
      </div>
    </div>
  );

  // 處理設計狀態變化
  const handleDesignStateChange = useCallback((designState) => {
    setCurrentDesignState(designState);
  }, []);

  // 使用 useMemo 穩定初始元素引用,避免無限循環
  const memoizedInitialElements = useMemo(() => {
    return template?.elements || [];
  }, [template?.elements]);

  const memoizedInitialBackgroundColor = useMemo(() => {
    return template?.backgroundColor || '#ffffff';
  }, [template?.backgroundColor]);

  // 建立版型工具列按鈕
  const templateToolbarRight = (
    <div className="flex items-center space-x-3">
      {/* 版型名稱輸入框 */}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={formTemplateName}
          onChange={(e) => setFormTemplateName(e.target.value)}
          onBlur={(e) => setTemplateName(e.target.value)}
          placeholder="輸入版型名稱"
          className="px-3 py-1 border border-gray-300 rounded text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={saving}
        />
      </div>

      {/* 版型描述輸入框 */}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={formTemplateDescription}
          onChange={(e) => setFormTemplateDescription(e.target.value)}
          onBlur={(e) => setTemplateDescription(e.target.value)}
          placeholder="輸入版型描述（選填）"
          className="px-3 py-1 border border-gray-300 rounded text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={saving}
        />
      </div>

      {/* 分隔線 */}
      <div className="h-6 w-px bg-gray-300"></div>

      {/* 保存按鈕 */}
      <button
        onClick={() => {
          // 驗證版型名稱
          if (!templateName || !templateName.trim()) {
            alert('請輸入版型名稱');
            return;
          }

          // 使用最新的設計狀態保存版型
          handleSaveTemplate({
            elements: currentDesignState.elements,
            backgroundColor: currentDesignState.backgroundColor,
            templateName: templateName,
            templateDescription: templateDescription || ''
          });
        }}
        className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        disabled={saving}
      >
        {saving ? '保存中...' : '💾 保存版型'}
      </button>
    </div>
  );

  return (
    <UniversalEditor
      mode="template"
      product={product}
      template={template}
      loading={loading}
      error={error}
      onNavigateBack={handleCancel}
      onDesignStateChange={handleDesignStateChange}
      showTemplateTools={false}
      headerContent={templateInfoForm}
      title={`版型編輯器`}
      templateDescription={templateDescription}
      topToolbarRight={templateToolbarRight}
      // 傳入現有版型的設計資料 (使用 memoized 值避免無限循環)
      initialElements={memoizedInitialElements}
      initialBackgroundColor={memoizedInitialBackgroundColor}
    />
  );
};

export default TemplateEditor;