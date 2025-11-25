import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GLBViewer from "@monkind/shared/components/GLBViewer";
import UVMapper from "@monkind/shared/components/UVMapper";
import Layout from "../../components/Layout";
import {
  useProductMaintenance,
  adminConfig,
  NotificationMessage,
  DesignAreaPreview,
  BleedAreaSettings,
} from "@monkind/shared/components/ProductMaintenance";

/**
 * Admin Product Maintenance Page
 * 使用共享的 ProductMaintenance 組件和 hooks
 */
const ProductMaintenance = () => {
  const navigate = useNavigate();

  // 使用共享的 hook，傳入 admin 配置
  const pm = useProductMaintenance(adminConfig);

  // 軸心輔助線顯示狀態
  const [showPivotHelper, setShowPivotHelper] = useState(false);

  // 載入狀態
  if (pm.loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入商品資料中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // 錯誤狀態
  if (pm.error) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">載入失敗</p>
              <p>{pm.error}</p>
            </div>
            <button
              onClick={pm.loadProducts}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              重新載入
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // 沒有商品
  if (!pm.selectedProduct) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-600 mb-4">沒有找到商品資料</p>
            <button
              onClick={pm.loadProducts}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              重新載入
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 -m-6 p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">商品維護</h1>
          <p className="text-gray-500 text-sm">管理商品資訊與設計區範圍</p>
        </div>

        {/* Error Display */}
        {pm.error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <div className="flex items-center justify-between">
              <div>
                <strong className="font-bold">錯誤：</strong>
                <span className="block sm:inline">{pm.error}</span>
              </div>
              <button
                onClick={() => pm.setError(null)}
                className="text-red-700 hover:text-red-900"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* 商品選擇下拉式選單 + 新增按鈕 */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選擇商品
              </label>
              <select
                value={pm.selectedProduct?.id || ''}
                onChange={(e) => {
                  const product = pm.products.find(p => p.id === parseInt(e.target.value));
                  if (product) pm.handleProductSelect(product);
                }}
                className="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                {pm.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title} ({product.type || "2D"}) - NT$ {product.price} {product.isActive === false ? '(已停用)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-7">
              <button
                onClick={() => pm.setShowAddModal(true)}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
              >
                ➕ 新增商品
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Main Content Area - 全寬顯示 */}
          <div className="col-span-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左側：設計區編輯器 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-base font-semibold text-gray-900">
                        設計區編輯器
                      </h3>
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          pm.selectedProduct.type === "3D"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {pm.selectedProduct.type || "2D"}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {/* 類型切換按鈕 */}
                      <button
                        onClick={() => pm.handleProductTypeChange(pm.selectedProduct.type === "3D" ? "2D" : "3D")}
                        disabled={pm.saving}
                        className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        切換至 {pm.selectedProduct.type === "3D" ? "2D" : "3D"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {/* 底圖實際尺寸設定 */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">
                        底圖實際尺寸 (mm)
                      </h4>
                      <span className="text-xs text-gray-500">
                        用於計算 300dpi 列印尺寸
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600">寬度</label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={pm.getPhysicalSize(pm.selectedProduct).widthMm}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 1;
                            pm.handleUpdatePhysicalSize({
                              ...pm.getPhysicalSize(pm.selectedProduct),
                              widthMm: value,
                            });
                          }}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                        />
                        <span className="text-xs text-gray-500">mm</span>
                      </div>
                      <span className="text-gray-400">×</span>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600">高度</label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={pm.getPhysicalSize(pm.selectedProduct).heightMm}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 1;
                            pm.handleUpdatePhysicalSize({
                              ...pm.getPhysicalSize(pm.selectedProduct),
                              heightMm: value,
                            });
                          }}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                        />
                        <span className="text-xs text-gray-500">mm</span>
                      </div>
                    </div>
                  </div>

                  <DesignAreaPreview
                    mockupImage={pm.selectedProduct.mockupImage}
                    printArea={pm.tempPrintArea}
                    bleedArea={pm.tempBleedArea}
                    onPrintAreaChange={(newArea) => {
                      pm.setTempPrintArea(newArea);
                    }}
                    isDragging={pm.isDragging}
                    showBleedArea={adminConfig.features.bleedArea}
                    physicalSize={pm.getPhysicalSize(pm.selectedProduct)}
                  />

                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => pm.resetPrintArea(pm.selectedProduct.printArea)}
                      className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      重置
                    </button>
                    <button
                      onClick={pm.handleSavePrintArea}
                      disabled={pm.saving}
                      className={`px-4 py-2 text-sm text-white rounded-md transition-colors ${
                        pm.saving
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {pm.saving ? "儲存中..." : "儲存設計區域"}
                    </button>
                  </div>
                </div>
              </div>

              {/* 右側：出血區域設定 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-5 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900">
                    出血區域設定
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    用於印刷時的安全邊界
                  </p>
                </div>

                <div className="p-5">
                  <BleedAreaSettings
                    bleedArea={pm.tempBleedArea}
                    bleedMode={pm.bleedMode}
                    onEnableBleed={pm.enableBleedArea}
                    onDisableBleed={pm.disableBleedArea}
                    onModeChange={pm.toggleBleedMode}
                    onValueChange={pm.updateBleedArea}
                    disabled={pm.saving}
                  />
                </div>
              </div>

              {/* 3D 模型管理 */}
              {pm.selectedProduct.type === "3D" && (
                <div className="col-span-1 lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-5 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">
                      3D 模型管理
                    </h3>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* GLB 預覽 */}
                      <div>
                        {pm.selectedProduct.model3D?.glbUrl ? (
                          <>
                            <GLBViewer
                              glbUrl={pm.selectedProduct.model3D.glbUrl}
                              uvMapping={pm.selectedProduct.model3D.uvMapping}
                              onUVUpdate={pm.handleUpdateUVMapping}
                              pivot={pm.selectedProduct.model3D?.pivot}
                              showPivotHelper={showPivotHelper}
                              className="h-64"
                            />
                            <button
                              onClick={pm.handleRemoveGLB}
                              disabled={pm.saving}
                              className="mt-4 w-full px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              移除 3D 模型
                            </button>
                          </>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <p className="text-gray-500 mb-4">尚未上傳 3D 模型</p>
                            <input
                              type="file"
                              accept=".glb,.gltf"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) pm.handleUploadGLB(file);
                              }}
                              className="hidden"
                              id="glb-upload"
                            />
                            <label
                              htmlFor="glb-upload"
                              className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
                            >
                              上傳 GLB 模型
                            </label>
                          </div>
                        )}
                      </div>

                      {/* UV Mapper */}
                      <div>
                        {pm.selectedProduct.model3D?.glbUrl && (
                          <UVMapper
                            glbUrl={pm.selectedProduct.model3D.glbUrl}
                            currentUV={pm.selectedProduct.model3D.uvMapping}
                            onUVChange={pm.handleUpdateUVMapping}
                            testImage={pm.uvTestImage}
                          />
                        )}
                      </div>
                    </div>

                    {/* 旋轉軸心設定 */}
                    {pm.selectedProduct.model3D?.glbUrl && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">
                              旋轉軸心設定
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              設定 3D 模型旋轉時的中心點（-1 到 1 為相對於模型邊界）
                            </p>
                          </div>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showPivotHelper}
                              onChange={(e) => setShowPivotHelper(e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">顯示輔助線</span>
                          </label>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          {/* X 軸 */}
                          <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                              <span className="w-3 h-3 rounded-full bg-red-500"></span>
                              <span>X 軸</span>
                            </label>
                            <input
                              type="range"
                              min="-1"
                              max="1"
                              step="0.05"
                              value={pm.selectedProduct.model3D?.pivot?.x || 0}
                              onChange={(e) => {
                                const newPivot = {
                                  ...pm.selectedProduct.model3D?.pivot,
                                  x: parseFloat(e.target.value),
                                };
                                pm.handleUpdatePivot(newPivot);
                              }}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>-1</span>
                              <span className="font-medium text-gray-700">
                                {(pm.selectedProduct.model3D?.pivot?.x || 0).toFixed(2)}
                              </span>
                              <span>1</span>
                            </div>
                          </div>

                          {/* Y 軸 */}
                          <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                              <span className="w-3 h-3 rounded-full bg-green-500"></span>
                              <span>Y 軸</span>
                            </label>
                            <input
                              type="range"
                              min="-1"
                              max="1"
                              step="0.05"
                              value={pm.selectedProduct.model3D?.pivot?.y || 0}
                              onChange={(e) => {
                                const newPivot = {
                                  ...pm.selectedProduct.model3D?.pivot,
                                  y: parseFloat(e.target.value),
                                };
                                pm.handleUpdatePivot(newPivot);
                              }}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>-1</span>
                              <span className="font-medium text-gray-700">
                                {(pm.selectedProduct.model3D?.pivot?.y || 0).toFixed(2)}
                              </span>
                              <span>1</span>
                            </div>
                          </div>

                          {/* Z 軸 */}
                          <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                              <span>Z 軸</span>
                            </label>
                            <input
                              type="range"
                              min="-1"
                              max="1"
                              step="0.05"
                              value={pm.selectedProduct.model3D?.pivot?.z || 0}
                              onChange={(e) => {
                                const newPivot = {
                                  ...pm.selectedProduct.model3D?.pivot,
                                  z: parseFloat(e.target.value),
                                };
                                pm.handleUpdatePivot(newPivot);
                              }}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>-1</span>
                              <span className="font-medium text-gray-700">
                                {(pm.selectedProduct.model3D?.pivot?.z || 0).toFixed(2)}
                              </span>
                              <span>1</span>
                            </div>
                          </div>
                        </div>

                        {/* 重置按鈕 */}
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => pm.handleUpdatePivot({ x: 0, y: 0, z: 0 })}
                            className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                          >
                            重置軸心
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 新增商品 Modal */}
        {pm.showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    新增商品
                  </h3>
                  <button
                    onClick={() => pm.setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      商品名稱 *
                    </label>
                    <input
                      type="text"
                      value={pm.newProduct.title}
                      onChange={(e) =>
                        pm.setNewProduct((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="輸入商品名稱"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      類別
                    </label>
                    <select
                      value={pm.newProduct.category}
                      onChange={(e) =>
                        pm.setNewProduct((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="mug">馬克杯</option>
                      <option value="tshirt">T恤</option>
                      <option value="bag">袋子</option>
                      <option value="bottle">水瓶</option>
                      <option value="pillow">抱枕</option>
                      <option value="notebook">筆記本</option>
                      <option value="phone_case">手機殼</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      價格 (NT$)
                    </label>
                    <input
                      type="number"
                      value={pm.newProduct.price}
                      onChange={(e) =>
                        pm.setNewProduct((prev) => ({
                          ...prev,
                          price: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => pm.setShowAddModal(false)}
                    className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={pm.handleAddProduct}
                    disabled={pm.saving || !pm.newProduct.title.trim()}
                    className={`px-4 py-2 text-sm text-white rounded-md transition-colors ${
                      pm.saving || !pm.newProduct.title.trim()
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {pm.saving ? "新增中..." : "新增商品"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 懸浮提示訊息 */}
        <NotificationMessage notification={pm.notification} />
      </div>
    </Layout>
  );
};

export default ProductMaintenance;
