import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { API } from "../../services/api";
import UniversalEditor from "../../components/Editor/UniversalEditor";

const TemplateEditor = () => {
  const { id } = useParams(); // 版型ID，如果是new則為新建
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

      // 載入商品資料
      let targetProductId = productId;

      if (id !== 'new') {
        // 編輯現有版型
        const templateData = await API.templates.getById(parseInt(id));
        if (!templateData) {
          setError("找不到此版型");
          return;
        }

        setTemplate(templateData);
        setTemplateName(templateData.name);
        setTemplateDescription(templateData.description);
        setFormTemplateName(templateData.name);
        setFormTemplateDescription(templateData.description);
        targetProductId = templateData.productId;
      }

      // 載入商品資料
      if (targetProductId) {
        const productData = await API.products.getById(parseInt(targetProductId));
        if (!productData) {
          setError("找不到對應的商品");
          return;
        }

        // 檢查是否有設計區設定
        if (!productData.printArea) {
          console.warn("此商品尚未設定設計區範圍，使用預設值");
          productData.printArea = { x: 50, y: 50, width: 200, height: 150 };
        }

        setProduct(productData);
      } else {
        setError("缺少商品ID參數");
      }
    } catch (error) {
      console.error("載入資料失敗:", error);
      setError("載入失敗，請重新嘗試");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, productId]);

  // 儲存版型
  const handleSaveTemplate = async (designData) => {
    try {
      setSaving(true);

      // 優先使用從 UniversalEditor 傳來的最新值
      const finalTemplateName = designData.templateName || formTemplateName || templateName;
      const finalTemplateDescription = designData.templateDescription || formTemplateDescription || templateDescription;

      const templateData = {
        name: finalTemplateName,
        description: finalTemplateDescription,
        productId: product.id,
        productCategory: product.category,
        elements: designData.elements || [],
        backgroundColor: designData.backgroundColor || "#ffffff",
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
      window.location.href = "/admin/templates";
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
      window.location.href = "/admin/templates";
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
  const handleDesignStateChange = (designState) => {
    setCurrentDesignState(designState);
  };

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
    />
  );
};

export default TemplateEditor;