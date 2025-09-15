import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import productsData from '../../data/products.json';

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [hoveredTool, setHoveredTool] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [designElements, setDesignElements] = useState([]);
  const [draggedElement, setDraggedElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const tools = [
    { id: 'template', icon: '📐', label: '版型', description: '選擇設計模板' },
    { id: 'elements', icon: '✨', label: '元素', description: '添加裝飾元素' },
    { id: 'text', icon: '➕', label: '文字', description: '添加文字內容' },
    { id: 'image', icon: '🖼️', label: '照片', description: '上傳圖片' },
    { id: 'background', icon: '🎨', label: '底色', description: '設定背景顏色' },
    { id: 'layers', icon: '📑', label: '圖層', description: '管理圖層順序' }
  ];

  useEffect(() => {
    const foundProduct = productsData.find(p => p.id === parseInt(id));
    setProduct(foundProduct);
  }, [id]);

  const handleSaveDraft = () => {
    const draft = {
      productId: id,
      timestamp: new Date().toISOString(),
      elements: [] // 這裡會存放畫布上的元素
    };
    localStorage.setItem(`draft_${id}`, JSON.stringify(draft));
    alert('草稿已儲存！');
  };

  const handleAddToCart = () => {
    if (product) {
      const customProduct = {
        ...product,
        id: `custom_${Date.now()}`,
        title: `客製化 ${product.title}`,
        price: product.price + 50, // 客製化加價
        isCustom: true
      };
      addToCart(customProduct);
      alert('客製化商品已加入購物車！');
    }
  };

  const handleAddText = () => {
    const newTextElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: '新增文字',
      // 使用Canvas絕對座標 (相對於400x400的畫布)
      x: product.printArea ? product.printArea.x + product.printArea.width / 2 : 200,
      y: product.printArea ? product.printArea.y + product.printArea.height / 2 : 200,
      fontSize: 24,
      color: '#000000',
      fontFamily: 'Arial'
    };
    setDesignElements([...designElements, newTextElement]);
  };

  const handleMouseDown = (e, element) => {
    e.preventDefault();
    setDraggedElement(element.id);

    const rect = e.currentTarget.getBoundingClientRect();
    const canvasRect = e.currentTarget.closest('.w-96').getBoundingClientRect();

    setDragOffset({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2
    });
  };

  const handleMouseMove = (e) => {
    if (!draggedElement || !product.printArea) return;

    const canvasRect = e.currentTarget.getBoundingClientRect();
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;

    // 計算相對於Canvas的位置
    const relativeX = e.clientX - canvasRect.left - dragOffset.x;
    const relativeY = e.clientY - canvasRect.top - dragOffset.y;

    // 轉換為400x400座標系統
    const canvasX = (relativeX / canvasWidth) * 400;
    const canvasY = (relativeY / canvasHeight) * 400;

    // 限制在設計區域內
    const minX = product.printArea.x;
    const maxX = product.printArea.x + product.printArea.width;
    const minY = product.printArea.y;
    const maxY = product.printArea.y + product.printArea.height;

    const constrainedX = Math.max(minX, Math.min(maxX, canvasX));
    const constrainedY = Math.max(minY, Math.min(maxY, canvasY));

    setDesignElements(elements =>
      elements.map(el =>
        el.id === draggedElement
          ? { ...el, x: constrainedX, y: constrainedY }
          : el
      )
    );
  };

  const handleMouseUp = () => {
    setDraggedElement(null);
    setDragOffset({ x: 0, y: 0 });
  };

  if (!product) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入編輯器中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <h1 className="text-lg font-semibold text-gray-900">
            編輯器 - {product.title}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
            <span className="mr-1">↶</span> 撤銷
          </button>
          <button className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
            <span className="mr-1">↷</span> 重做
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            💾 儲存
          </button>
          <button
            onClick={handleAddToCart}
            className="px-4 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            🛒 加入購物車
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Sidebar - Collapsible Tools */}
        <div className="bg-white border-r border-gray-200 transition-all duration-300 ease-in-out">
          <div className="flex">
            {/* Tool Icons */}
            <div className="w-16 bg-gray-50 border-r border-gray-200">
              <div className="p-2 space-y-1">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onMouseEnter={() => setHoveredTool(tool.id)}
                    onMouseLeave={() => setHoveredTool(null)}
                    onClick={() => setSelectedTool(selectedTool === tool.id ? null : tool.id)}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl transition-all duration-200 ${
                      selectedTool === tool.id
                        ? 'bg-blue-500 text-white shadow-md'
                        : hoveredTool === tool.id
                        ? 'bg-gray-200'
                        : 'hover:bg-gray-100'
                    }`}
                    title={tool.label}
                  >
                    {tool.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Expanded Tool Panel */}
            <div className={`bg-white transition-all duration-300 ease-in-out overflow-hidden ${
              hoveredTool || selectedTool ? 'w-72' : 'w-0'
            }`}>
              {(hoveredTool || selectedTool) && (
                <div className="p-4 w-72">
                  {(() => {
                    const currentTool = tools.find(t => t.id === (selectedTool || hoveredTool));
                    return (
                      <div>
                        <div className="flex items-center mb-4">
                          <span className="text-2xl mr-3">{currentTool?.icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900">{currentTool?.label}</h3>
                            <p className="text-sm text-gray-600">{currentTool?.description}</p>
                          </div>
                        </div>

                        {/* Tool-specific content */}
                        <div className="space-y-3">
                          {currentTool?.id === 'template' && (
                            <div className="grid grid-cols-2 gap-2">
                              {[1, 2, 3, 4].map(i => (
                                <button key={i} className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors flex items-center justify-center text-gray-500">
                                  模板 {i}
                                </button>
                              ))}
                            </div>
                          )}

                          {currentTool?.id === 'text' && (
                            <div className="space-y-2">
                              <button
                                onClick={handleAddText}
                                className="w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                ➕ 添加標題
                              </button>
                              <button
                                onClick={handleAddText}
                                className="w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                ➕ 添加副標題
                              </button>
                              <button
                                onClick={handleAddText}
                                className="w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                ➕ 添加內文
                              </button>
                            </div>
                          )}

                          {currentTool?.id === 'image' && (
                            <div className="space-y-2">
                              <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors text-center">
                                📁 上傳圖片
                              </button>
                              <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                  <button key={i} className="aspect-square bg-gray-100 rounded border hover:border-blue-400 transition-colors">
                                    圖 {i}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {currentTool?.id === 'background' && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">背景顏色</label>
                                <input type="color" className="w-full h-10 rounded border" defaultValue="#ffffff" />
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                {['#ffffff', '#f3f4f6', '#fef3c7', '#dbeafe', '#fce7f3', '#f3e8ff'].map(color => (
                                  <button
                                    key={color}
                                    className="w-12 h-12 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {currentTool?.id === 'layers' && (
                            <div className="space-y-2">
                              <div className="text-sm text-gray-600 mb-2">圖層列表</div>
                              {['背景', '文字層 1', '圖片層 1'].map((layer, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="text-sm">{layer}</span>
                                  <div className="flex space-x-1">
                                    <button className="text-xs px-2 py-1 bg-white rounded">👁️</button>
                                    <button className="text-xs px-2 py-1 bg-white rounded">🗑️</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Canvas Area */}
          <div className="flex-1 bg-gray-50 p-8">
            <div className="h-full flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-xl p-8">
                <div
                  className="w-96 h-96 border-2 border-gray-200 rounded-lg relative overflow-hidden bg-white"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Product Mockup Image */}
                  {product.mockupImage ? (
                    <img
                      src={product.mockupImage}
                      alt={`${product.title} 底圖`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}

                  {/* Fallback content */}
                  <div className="absolute inset-0 bg-gray-100 border border-dashed border-gray-400 rounded flex items-center justify-center" style={{ display: product.mockupImage ? 'none' : 'flex' }}>
                    <div className="text-center">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-16 h-16 mx-auto mb-2 opacity-30"
                      />
                      <p className="text-gray-600 text-sm">商品底圖載入中...</p>
                      <p className="text-gray-500 text-xs">點擊工具開始設計</p>
                    </div>
                  </div>

                  {/* Print Area Overlay (只在有printArea資料時顯示) */}
                  {product.printArea && (
                    <div
                      className="absolute border-2 border-blue-500 border-dashed bg-blue-50 bg-opacity-20"
                      style={{
                        left: `${(product.printArea.x / 400) * 100}%`,
                        top: `${(product.printArea.y / 400) * 100}%`,
                        width: `${(product.printArea.width / 400) * 100}%`,
                        height: `${(product.printArea.height / 400) * 100}%`,
                      }}
                    >
                      <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                        設計區
                      </div>
                    </div>
                  )}

                  {/* Design Elements Layer */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* 這裡將來會放置 Konva Canvas 或設計元素 */}
                    <div className="w-full h-full relative">
                      {/* Design Elements */}
                      {designElements.map((element) => {
                        if (element.type === 'text') {
                          return (
                            <div
                              key={element.id}
                              className={`absolute bg-white bg-opacity-90 border border-blue-400 p-1 pointer-events-auto select-none ${
                                draggedElement === element.id ? 'cursor-grabbing z-50' : 'cursor-grab hover:bg-opacity-100'
                              }`}
                              style={{
                                left: `${(element.x / 400) * 100}%`, // 基於400x400 Canvas座標
                                top: `${(element.y / 400) * 100}%`,
                                transform: 'translate(-50%, -50%)',
                                fontSize: `${element.fontSize * (384 / 400)}px`, // 384是畫布實際寬度
                                color: element.color,
                                fontFamily: element.fontFamily,
                                userSelect: 'none'
                              }}
                              onMouseDown={(e) => handleMouseDown(e, element)}
                            >
                              {element.content}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm font-medium text-gray-700">{product.title}</p>
                  <p className="text-xs text-gray-500">
                    可印刷區域: {product.printArea ? `${product.printArea.width} x ${product.printArea.height} px` : '準備中...'}
                  </p>
                  <div className="mt-2 flex justify-center space-x-4 text-xs text-gray-500">
                    <span>🎯 點擊工具開始設計</span>
                    <span>📏 虛線框為可印刷區域</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Properties & Preview */}
          <div className="w-80 bg-white border-l border-gray-200">
            <div className="h-full flex flex-col">
              {/* Properties Panel */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">屬性設定</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      文字顏色
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        className="w-8 h-8 rounded border border-gray-300"
                        defaultValue="#000000"
                      />
                      <input
                        type="text"
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded"
                        defaultValue="#000000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      字體大小: <span className="font-normal">16px</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="72"
                      defaultValue="16"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      透明度: <span className="font-normal">100%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="100"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      字體家族
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option>Arial</option>
                      <option>微軟正黑體</option>
                      <option>新細明體</option>
                      <option>標楷體</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="flex-1 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">即時預覽</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="aspect-square bg-white rounded border-2 border-gray-200 relative overflow-hidden">
                    {/* Product Mockup as Background */}
                    {product.mockupImage ? (
                      <img
                        src={product.mockupImage}
                        alt={`${product.title} 預覽`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Design Elements with Clipping */}
                    <div
                      className="absolute overflow-hidden"
                      style={{
                        left: `${product.printArea ? (product.printArea.x / 400) * 100 : 0}%`,
                        top: `${product.printArea ? (product.printArea.y / 400) * 100 : 0}%`,
                        width: `${product.printArea ? (product.printArea.width / 400) * 100 : 100}%`,
                        height: `${product.printArea ? (product.printArea.height / 400) * 100 : 100}%`,
                      }}
                    >
                      {/* Design Elements in Preview */}
                      {designElements.map((element) => {
                        if (element.type === 'text') {
                          // 計算文字在設計區域內的相對位置
                          const relativeX = product.printArea ? element.x - product.printArea.x : element.x;
                          const relativeY = product.printArea ? element.y - product.printArea.y : element.y;
                          const areaWidth = product.printArea ? product.printArea.width : 400;
                          const areaHeight = product.printArea ? product.printArea.height : 400;

                          return (
                            <div
                              key={`preview-${element.id}`}
                              className="absolute pointer-events-none"
                              style={{
                                left: `${(relativeX / areaWidth) * 100}%`,
                                top: `${(relativeY / areaHeight) * 100}%`,
                                transform: 'translate(-50%, -50%)',
                                fontSize: `${element.fontSize * 0.6}px`, // 預覽區域縮放
                                color: element.color,
                                fontFamily: element.fontFamily,
                                whiteSpace: 'nowrap', // 防止換行
                                overflow: 'visible', // 讓文字能顯示但被父容器裁切
                              }}
                            >
                              {element.content}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>

                    {/* No Print Area Fallback */}
                    {!product.printArea && designElements.length > 0 && (
                      <div className="absolute inset-0">
                        {designElements.map((element) => {
                          if (element.type === 'text') {
                            return (
                              <div
                                key={`preview-fallback-${element.id}`}
                                className="absolute pointer-events-none"
                                style={{
                                  left: `${(element.x / 400) * 100}%`,
                                  top: `${(element.y / 400) * 100}%`,
                                  transform: 'translate(-50%, -50%)',
                                  fontSize: `${element.fontSize * 0.6}px`,
                                  color: element.color,
                                  fontFamily: element.fontFamily
                                }}
                              >
                                {element.content}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-600">設計會自動裁切至印刷區域</p>
                    {product.printArea && (
                      <p className="text-xs text-gray-500 mt-1">
                        印刷區域: {product.printArea.width} × {product.printArea.height} px
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;