import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { API } from '../../services/api';
import Mug3D from '../../components/3D/Mug3D';

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredTool, setHoveredTool] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [designElements, setDesignElements] = useState([]);
  const [draggedElement, setDraggedElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedElement, setSelectedElement] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);

  // 圖片相關狀態
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // 文字編輯相關狀態
  const [editingText, setEditingText] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [showTextToolbar, setShowTextToolbar] = useState(false);

  const tools = [
    { id: 'template', icon: '📐', label: '版型', description: '選擇設計模板' },
    { id: 'elements', icon: '✨', label: '元素', description: '添加裝飾元素' },
    { id: 'text', icon: '➕', label: '文字', description: '添加文字內容' },
    { id: 'image', icon: '🖼️', label: '照片', description: '上傳圖片' },
    { id: 'background', icon: '🎨', label: '底色', description: '設定背景顏色' },
    { id: 'layers', icon: '📑', label: '圖層', description: '管理圖層順序' }
  ];

  // 載入商品資料
  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('載入編輯器商品 ID:', id);
      const foundProduct = await API.products.getById(parseInt(id));

      // 檢查商品是否存在
      if (!foundProduct) {
        setError('找不到此商品');
        return;
      }

      // 檢查商品是否啟用
      if (foundProduct.isActive === false) {
        setError('此商品目前無法使用');
        return;
      }

      console.log('編輯器載入的商品:', foundProduct);

      // 檢查是否有設計區設定
      if (!foundProduct.printArea) {
        console.warn('此商品尚未設定設計區範圍，使用預設值');
        foundProduct.printArea = { x: 50, y: 50, width: 200, height: 150 };
      }

      setProduct(foundProduct);
    } catch (error) {
      console.error('載入商品失敗:', error);

      if (error.message.includes('找不到')) {
        setError('商品不存在或已被移除');
      } else {
        setError('載入商品失敗，請重新嘗試');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadProduct();
      loadUploadedImages();
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 載入已上傳的圖片
  const loadUploadedImages = () => {
    try {
      const savedImages = localStorage.getItem('editor_uploaded_images');
      if (savedImages) {
        setUploadedImages(JSON.parse(savedImages));
      }
    } catch (error) {
      console.error('載入已上傳圖片失敗:', error);
    }
  };

  // 保存已上傳的圖片到 localStorage
  const saveUploadedImages = (images) => {
    try {
      localStorage.setItem('editor_uploaded_images', JSON.stringify(images));
      setUploadedImages(images);
    } catch (error) {
      console.error('保存圖片失敗:', error);
    }
  };

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
      fontFamily: 'Arial',
      fontWeight: 'normal',
      fontStyle: 'normal'
    };
    setDesignElements([...designElements, newTextElement]);
  };

  // 圖片壓縮函數
  const compressImage = (file, maxWidth = 600, maxHeight = 600, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // 計算新的尺寸，保持比例
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 繪製並壓縮圖片
        ctx.drawImage(img, 0, 0, width, height);

        // 轉換為 Base64
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // 處理圖片上傳
  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    setIsUploading(true);

    try {
      const newImages = [];
      for (const file of files) {
        // 檢查檔案類型
        if (!file.type.startsWith('image/')) {
          continue;
        }

        // 壓縮圖片
        let imageUrl;
        if (file.size > 500 * 1024) { // 大於 500KB 就壓縮
          imageUrl = await compressImage(file, 800, 800, 0.8);
        } else {
          imageUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }

        const imageData = {
          id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: imageUrl,
          name: file.name,
          uploadDate: new Date().toISOString(),
          originalSize: file.size
        };

        newImages.push(imageData);
      }

      // 保存到已上傳圖片列表
      const updatedImages = [...uploadedImages, ...newImages];
      saveUploadedImages(updatedImages);

      // 清除 input
      event.target.value = '';
    } catch (error) {
      console.error('圖片上傳失敗:', error);
      alert('圖片上傳失敗，請重試');
    } finally {
      setIsUploading(false);
    }
  };

  // 添加圖片到畫布
  const handleAddImageToCanvas = (imageData) => {
    const newImageElement = {
      id: `canvas-image-${Date.now()}`,
      type: 'image',
      imageId: imageData.id,
      url: imageData.url,
      x: product.printArea ? product.printArea.x + product.printArea.width / 2 : 200,
      y: product.printArea ? product.printArea.y + product.printArea.height / 2 : 200,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1
    };
    setDesignElements([...designElements, newImageElement]);
  };

  // 刪除已上傳的圖片
  const handleDeleteUploadedImage = (imageId) => {
    // 先檢查是否有設計元素在使用這張圖片
    const isUsed = designElements.some(el => el.type === 'image' && el.imageId === imageId);

    if (isUsed) {
      if (!window.confirm('這張圖片正在畫布中使用，確定要刪除嗎？這會同時移除畫布中的圖片。')) {
        return;
      }
      // 從設計元素中移除使用這張圖片的元素
      setDesignElements(prev => prev.filter(el => !(el.type === 'image' && el.imageId === imageId)));
    }

    // 從已上傳圖片中移除
    const updatedImages = uploadedImages.filter(img => img.id !== imageId);
    saveUploadedImages(updatedImages);
  };

  // 選擇元素
  const handleSelectElement = (element) => {
    setSelectedElement(element);
    // 如果是文字元素，顯示文字工具列
    if (element.type === 'text') {
      setShowTextToolbar(true);
    } else {
      setShowTextToolbar(false);
      setEditingText(null);
    }
  };

  // 刪除畫布上的元素
  const handleDeleteElement = (elementId) => {
    setDesignElements(prev => prev.filter(el => el.id !== elementId));
    setSelectedElement(null);
    setShowTextToolbar(false);
    setEditingText(null);
  };

  // 開始編輯文字
  const handleStartTextEdit = (element) => {
    setEditingText(element.id);
    setEditingContent(element.content);
  };

  // 完成文字編輯
  const handleFinishTextEdit = () => {
    if (editingText) {
      setDesignElements(prev =>
        prev.map(el =>
          el.id === editingText
            ? { ...el, content: editingContent }
            : el
        )
      );
    }
    setEditingText(null);
    setEditingContent('');
  };

  // 切換粗體
  const handleToggleBold = () => {
    if (selectedElement && selectedElement.type === 'text') {
      const newWeight = selectedElement.fontWeight === 'bold' ? 'normal' : 'bold';
      setDesignElements(prev =>
        prev.map(el =>
          el.id === selectedElement.id
            ? { ...el, fontWeight: newWeight }
            : el
        )
      );
      setSelectedElement(prev => ({ ...prev, fontWeight: newWeight }));
    }
  };

  // 切換斜體
  const handleToggleItalic = () => {
    if (selectedElement && selectedElement.type === 'text') {
      const newStyle = selectedElement.fontStyle === 'italic' ? 'normal' : 'italic';
      setDesignElements(prev =>
        prev.map(el =>
          el.id === selectedElement.id
            ? { ...el, fontStyle: newStyle }
            : el
        )
      );
      setSelectedElement(prev => ({ ...prev, fontStyle: newStyle }));
    }
  };

  // 調整字體大小
  const handleFontSizeChange = (change) => {
    if (selectedElement && selectedElement.type === 'text') {
      const newSize = Math.max(8, Math.min(72, selectedElement.fontSize + change));
      setDesignElements(prev =>
        prev.map(el =>
          el.id === selectedElement.id
            ? { ...el, fontSize: newSize }
            : el
        )
      );
      setSelectedElement(prev => ({ ...prev, fontSize: newSize }));
    }
  };

  const handleMouseDown = (e, element, handle = null) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedElement(element);

    if (handle) {
      // 如果點擊的是縮放控制點
      setResizeHandle(handle);
      setDraggedElement(null);
    } else {
      // 正常拖拽
      setDraggedElement(element.id);
      setResizeHandle(null);

      const rect = e.currentTarget.getBoundingClientRect();

      setDragOffset({
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2
      });
    }
  };

  const handleMouseMove = (e) => {
    if ((!draggedElement && !resizeHandle) || !product.printArea) return;

    const canvasRect = e.currentTarget.getBoundingClientRect();
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;

    if (draggedElement) {
      // 拖拽移動
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
    } else if (resizeHandle && selectedElement) {
      // 縮放和旋轉處理
      const currentX = ((e.clientX - canvasRect.left) / canvasWidth) * 400;
      const currentY = ((e.clientY - canvasRect.top) / canvasHeight) * 400;

      setDesignElements(elements =>
        elements.map(el => {
          if (el.id === selectedElement.id) {
            if (resizeHandle === 'rotate') {
              // 旋轉處理
              const centerX = el.x;
              const centerY = el.y;
              const angle = Math.atan2(currentY - centerY, currentX - centerX);
              const degrees = (angle * 180) / Math.PI + 90; // 調整角度
              return { ...el, rotation: degrees };
            } else {
              // 圖片縮放處理
              let newWidth = el.width;
              let newHeight = el.height;
              let newX = el.x;
              let newY = el.y;

              const aspectRatio = el.width / el.height;
              const minSize = 20;

              if (resizeHandle === 'se') {
                // 右下角縮放
                const deltaX = currentX - el.x;
                const deltaY = currentY - el.y;
                if (Math.abs(deltaX) > Math.abs(deltaY * aspectRatio)) {
                  newWidth = Math.max(minSize, Math.abs(deltaX) * 2);
                  newHeight = newWidth / aspectRatio;
                } else {
                  newHeight = Math.max(minSize, Math.abs(deltaY) * 2);
                  newWidth = newHeight * aspectRatio;
                }
              } else if (resizeHandle === 'nw') {
                // 左上角縮放
                const deltaX = el.x - currentX;
                const deltaY = el.y - currentY;
                if (Math.abs(deltaX) > Math.abs(deltaY * aspectRatio)) {
                  newWidth = Math.max(minSize, Math.abs(deltaX) * 2);
                  newHeight = newWidth / aspectRatio;
                } else {
                  newHeight = Math.max(minSize, Math.abs(deltaY) * 2);
                  newWidth = newHeight * aspectRatio;
                }
              } else if (resizeHandle === 'ne') {
                // 右上角縮放
                const deltaX = currentX - el.x;
                const deltaY = el.y - currentY;
                if (Math.abs(deltaX) > Math.abs(deltaY * aspectRatio)) {
                  newWidth = Math.max(minSize, Math.abs(deltaX) * 2);
                  newHeight = newWidth / aspectRatio;
                } else {
                  newHeight = Math.max(minSize, Math.abs(deltaY) * 2);
                  newWidth = newHeight * aspectRatio;
                }
              } else if (resizeHandle === 'sw') {
                // 左下角縮放
                const deltaX = el.x - currentX;
                const deltaY = currentY - el.y;
                if (Math.abs(deltaX) > Math.abs(deltaY * aspectRatio)) {
                  newWidth = Math.max(minSize, Math.abs(deltaX) * 2);
                  newHeight = newWidth / aspectRatio;
                } else {
                  newHeight = Math.max(minSize, Math.abs(deltaY) * 2);
                  newWidth = newHeight * aspectRatio;
                }
              }

              // 限制在設計區域內
              const halfWidth = newWidth / 2;
              const halfHeight = newHeight / 2;
              const minX = product.printArea.x + halfWidth;
              const maxX = product.printArea.x + product.printArea.width - halfWidth;
              const minY = product.printArea.y + halfHeight;
              const maxY = product.printArea.y + product.printArea.height - halfHeight;

              newX = Math.max(minX, Math.min(maxX, el.x));
              newY = Math.max(minY, Math.min(maxY, el.y));

              // 如果超出邊界，調整尺寸
              if (newX - halfWidth < product.printArea.x) {
                newWidth = (newX - product.printArea.x) * 2;
                newHeight = newWidth / aspectRatio;
              }
              if (newX + halfWidth > product.printArea.x + product.printArea.width) {
                newWidth = (product.printArea.x + product.printArea.width - newX) * 2;
                newHeight = newWidth / aspectRatio;
              }
              if (newY - halfHeight < product.printArea.y) {
                newHeight = (newY - product.printArea.y) * 2;
                newWidth = newHeight * aspectRatio;
              }
              if (newY + halfHeight > product.printArea.y + product.printArea.height) {
                newHeight = (product.printArea.y + product.printArea.height - newY) * 2;
                newWidth = newHeight * aspectRatio;
              }

              return { ...el, width: newWidth, height: newHeight, x: newX, y: newY };
            }
          }
          return el;
        })
      );
    }
  };

  const handleMouseUp = () => {
    setDraggedElement(null);
    setResizeHandle(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // 點擊畫布空白處取消選擇
  const handleCanvasClick = (e) => {
    if (e.target.classList.contains('canvas-container') ||
        e.target.classList.contains('w-96') ||
        e.target.classList.contains('h-96')) {
      setSelectedElement(null);
      setShowTextToolbar(false);
      setEditingText(null);
    }
  };

  // 載入狀態
  if (loading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入編輯器中...</p>
          <p className="text-sm text-gray-500 mt-2">正在載入商品資料與設計區域</p>
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">無法開啟編輯器</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => navigate('/products')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              回到商品頁
            </button>
            <button
              onClick={loadProduct}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              重新載入
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 商品不存在
  if (!product) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">商品不存在</h3>
          <p className="text-gray-600 mb-4">找不到此商品或商品已被移除</p>
          <button
            onClick={() => navigate('/products')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            回到商品頁
          </button>
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
                            <div className="space-y-4">
                              {/* 圖片上傳區 */}
                              <div>
                                <input
                                  type="file"
                                  id="imageUpload"
                                  multiple
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  className="hidden"
                                />
                                <label
                                  htmlFor="imageUpload"
                                  className={`w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors text-center cursor-pointer block ${
                                    isUploading ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  {isUploading ? (
                                    <div className="flex items-center justify-center">
                                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                                      上傳中...
                                    </div>
                                  ) : (
                                    <>
                                      📁 點擊上傳圖片
                                      <div className="text-xs text-gray-500 mt-1">支援 JPG、PNG 格式</div>
                                    </>
                                  )}
                                </label>
                              </div>

                              {/* 已上傳圖片庫 */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-medium text-gray-700">圖片庫</h4>
                                  <span className="text-xs text-gray-500">{uploadedImages.length} 張圖片</span>
                                </div>

                                {uploadedImages.length > 0 ? (
                                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                                    {uploadedImages.map((image) => (
                                      <div key={image.id} className="relative group">
                                        <button
                                          onClick={() => handleAddImageToCanvas(image)}
                                          className="aspect-square bg-gray-100 rounded border hover:border-blue-400 transition-colors overflow-hidden w-full"
                                          title={`點擊添加到畫布 - ${image.name}`}
                                        >
                                          <img
                                            src={image.url}
                                            alt={image.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </button>

                                        {/* 刪除按鈕 */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteUploadedImage(image.id);
                                          }}
                                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="刪除圖片"
                                        >
                                          ×
                                        </button>

                                        {/* 圖片名稱 */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                          {image.name}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-6 text-gray-500 text-sm">
                                    <div className="text-2xl mb-2">📷</div>
                                    還沒有上傳圖片
                                    <br />
                                    點擊上方按鈕開始上傳
                                  </div>
                                )}
                              </div>

                              {/* 使用說明 */}
                              <div className="bg-blue-50 rounded-lg p-3">
                                <h5 className="text-sm font-medium text-blue-900 mb-1">💡 使用說明</h5>
                                <ul className="text-xs text-blue-800 space-y-1">
                                  <li>• 點擊圖片庫中的圖片添加到畫布</li>
                                  <li>• 在畫布上可拖曳調整位置和大小</li>
                                  <li>• 滑鼠右鍵可刪除畫布上的圖片</li>
                                </ul>
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
                  className="w-96 h-96 border-2 border-gray-200 rounded-lg relative overflow-hidden bg-white canvas-container"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onClick={handleCanvasClick}
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
                    <>
                      {/* 設計區標籤 - 位於設計區上方 */}
                      <div
                        className="absolute bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-sm z-10"
                        style={{
                          left: `${(product.printArea.x / 400) * 100}%`,
                          top: `${(product.printArea.y / 400) * 100 - 2}%`, // 移到設計區上方
                          transform: 'translateY(-100%)'
                        }}
                      >
                        設計區 {product.printArea.width}×{product.printArea.height}px
                      </div>

                      {/* 設計區框線 */}
                      <div
                        className="absolute border-2 border-blue-500 border-dashed bg-blue-50 bg-opacity-20"
                        style={{
                          left: `${(product.printArea.x / 400) * 100}%`,
                          top: `${(product.printArea.y / 400) * 100}%`,
                          width: `${(product.printArea.width / 400) * 100}%`,
                          height: `${(product.printArea.height / 400) * 100}%`,
                        }}
                      />
                    </>
                  )}

                  {/* Design Elements Layer */}
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                    {/* 這裡將來會放置 Konva Canvas 或設計元素 */}
                    <div className="w-full h-full relative">
                      {/* Design Elements */}
                      {designElements.map((element) => {
                        if (element.type === 'text') {
                          const isEditing = editingText === element.id;
                          return (
                            <div key={element.id}>
                              {/* 文字工具列 */}
                              {showTextToolbar && selectedElement && selectedElement.id === element.id && (
                                <div
                                  className="absolute bg-gray-800 text-white rounded-md shadow-lg flex items-center space-x-1 p-1 pointer-events-auto"
                                  style={{
                                    left: `${(element.x / 400) * 100}%`,
                                    top: `${(element.y / 400) * 100}%`,
                                    transform: 'translate(-50%, calc(-100% - 40px))',
                                    zIndex: 1000
                                  }}
                                >
                                  {/* 編輯文字按鈕 */}
                                  <button
                                    onClick={() => handleStartTextEdit(element)}
                                    className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
                                    title="編輯文字"
                                  >
                                    ✏️
                                  </button>

                                  {/* 粗體按鈕 */}
                                  <button
                                    onClick={handleToggleBold}
                                    className={`px-2 py-1 text-xs rounded font-bold ${
                                      element.fontWeight === 'bold'
                                        ? 'bg-yellow-600 text-white'
                                        : 'bg-gray-600 hover:bg-gray-500'
                                    }`}
                                    title="粗體"
                                  >
                                    B
                                  </button>

                                  {/* 斜體按鈕 */}
                                  <button
                                    onClick={handleToggleItalic}
                                    className={`px-2 py-1 text-xs rounded italic ${
                                      element.fontStyle === 'italic'
                                        ? 'bg-yellow-600 text-white'
                                        : 'bg-gray-600 hover:bg-gray-500'
                                    }`}
                                    title="斜體"
                                  >
                                    I
                                  </button>

                                  {/* 分隔線 */}
                                  <div className="w-px h-4 bg-gray-500" />

                                  {/* 字體大小調整 */}
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => handleFontSizeChange(-2)}
                                      className="px-1 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded"
                                      title="縮小字體"
                                    >
                                      A-
                                    </button>
                                    <span className="text-xs px-1 min-w-6 text-center">
                                      {element.fontSize}
                                    </span>
                                    <button
                                      onClick={() => handleFontSizeChange(2)}
                                      className="px-1 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded"
                                      title="放大字體"
                                    >
                                      A+
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* 文字元素 */}
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  onBlur={handleFinishTextEdit}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleFinishTextEdit();
                                    }
                                    if (e.key === 'Escape') {
                                      setEditingText(null);
                                      setEditingContent('');
                                    }
                                  }}
                                  autoFocus
                                  className="absolute bg-white border-2 border-blue-500 p-1 pointer-events-auto z-40"
                                  style={{
                                    left: `${(element.x / 400) * 100}%`,
                                    top: `${(element.y / 400) * 100}%`,
                                    transform: 'translate(-50%, -50%)',
                                    fontSize: `${element.fontSize * (384 / 400)}px`,
                                    color: element.color,
                                    fontFamily: element.fontFamily,
                                    fontWeight: element.fontWeight || 'normal',
                                    fontStyle: element.fontStyle || 'normal',
                                    minWidth: '100px'
                                  }}
                                />
                              ) : (
                                <div
                                  className={`absolute bg-white bg-opacity-90 border border-blue-400 p-1 pointer-events-auto select-none ${
                                    draggedElement === element.id ? 'cursor-grabbing z-50' : 'cursor-grab hover:bg-opacity-100'
                                  }`}
                                  style={{
                                    left: `${(element.x / 400) * 100}%`,
                                    top: `${(element.y / 400) * 100}%`,
                                    transform: 'translate(-50%, -50%)',
                                    fontSize: `${element.fontSize * (384 / 400)}px`,
                                    color: element.color,
                                    fontFamily: element.fontFamily,
                                    fontWeight: element.fontWeight || 'normal',
                                    fontStyle: element.fontStyle || 'normal',
                                    userSelect: 'none',
                                    whiteSpace: 'nowrap'
                                  }}
                                  onMouseDown={(e) => handleMouseDown(e, element)}
                                  onClick={() => handleSelectElement(element)}
                                >
                                  {element.content}
                                </div>
                              )}
                            </div>
                          );
                        } else if (element.type === 'image') {
                          const isSelected = selectedElement && selectedElement.id === element.id;
                          return (
                            <div
                              key={element.id}
                              className={`absolute pointer-events-auto select-none ${
                                draggedElement === element.id ? 'cursor-grabbing z-50' : 'cursor-grab'
                              }`}
                              style={{
                                left: `${(element.x / 400) * 100}%`,
                                top: `${(element.y / 400) * 100}%`,
                                width: `${(element.width / 400) * 100}%`,
                                height: `${(element.height / 400) * 100}%`,
                                transform: 'translate(-50%, -50%)',
                                transformOrigin: 'center',
                                opacity: element.opacity || 1
                              }}
                              onMouseDown={(e) => handleMouseDown(e, element)}
                              onClick={() => handleSelectElement(element)}
                            >
                              {/* 圖片內容 */}
                              <img
                                src={element.url}
                                alt="設計圖片"
                                className="w-full h-full object-contain pointer-events-none"
                                style={{
                                  transform: `rotate(${element.rotation || 0}deg)`
                                }}
                                draggable={false}
                              />

                              {/* 選中狀態的邊框和控制點 */}
                              {isSelected && (
                                <>
                                  {/* 選中邊框 */}
                                  <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />

                                  {/* 縮放控制點 */}
                                  <div
                                    className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nw-resize pointer-events-auto"
                                    style={{ top: '-6px', left: '-6px' }}
                                    onMouseDown={(e) => handleMouseDown(e, element, 'nw')}
                                  />
                                  <div
                                    className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-ne-resize pointer-events-auto"
                                    style={{ top: '-6px', right: '-6px' }}
                                    onMouseDown={(e) => handleMouseDown(e, element, 'ne')}
                                  />
                                  <div
                                    className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-sw-resize pointer-events-auto"
                                    style={{ bottom: '-6px', left: '-6px' }}
                                    onMouseDown={(e) => handleMouseDown(e, element, 'sw')}
                                  />
                                  <div
                                    className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-se-resize pointer-events-auto"
                                    style={{ bottom: '-6px', right: '-6px' }}
                                    onMouseDown={(e) => handleMouseDown(e, element, 'se')}
                                  />

                                  {/* 旋轉控制點 */}
                                  <div
                                    className="absolute w-3 h-3 bg-green-500 border border-white rounded-full cursor-grab pointer-events-auto"
                                    style={{ top: '-20px', left: '50%', transform: 'translateX(-50%)' }}
                                    onMouseDown={(e) => handleMouseDown(e, element, 'rotate')}
                                    title="拖曳旋轉"
                                  />

                                  {/* 刪除按鈕 */}
                                  <button
                                    className="absolute w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center pointer-events-auto hover:bg-red-600 transition-colors"
                                    style={{ top: '-12px', right: '-12px' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteElement(element.id);
                                    }}
                                    title="刪除圖片"
                                  >
                                    ×
                                  </button>
                                </>
                              )}
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
                  {product.category === 'mug' ? (
                    /* 3D 馬克杯預覽 */
                    <div className="aspect-square bg-white rounded border-2 border-gray-200 relative overflow-hidden">
                      <Mug3D designElements={designElements} product={product} />
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                        🖱️ 拖曳旋轉 • 滾輪縮放
                      </div>
                    </div>
                  ) : (
                    /* 2D 預覽 (T恤等其他產品) */
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
                                  fontWeight: element.fontWeight || 'normal',
                                  fontStyle: element.fontStyle || 'normal',
                                  whiteSpace: 'nowrap', // 防止換行
                                  overflow: 'visible', // 讓文字能顯示但被父容器裁切
                                }}
                              >
                                {element.content}
                              </div>
                            );
                          } else if (element.type === 'image') {
                            // 計算圖片在設計區域內的相對位置
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
                                  width: `${(element.width / areaWidth) * 100}%`, // 移除額外縮放，與設計區保持一致
                                  height: `${(element.height / areaHeight) * 100}%`,
                                  transform: 'translate(-50%, -50%)',
                                  opacity: element.opacity || 1,
                                }}
                              >
                                <img
                                  src={element.url}
                                  alt="預覽圖片"
                                  className="w-full h-full object-contain"
                                  style={{
                                    transform: `rotate(${element.rotation || 0}deg)`
                                  }}
                                />
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
                                    fontFamily: element.fontFamily,
                                    fontWeight: element.fontWeight || 'normal',
                                    fontStyle: element.fontStyle || 'normal'
                                  }}
                                >
                                  {element.content}
                                </div>
                              );
                            } else if (element.type === 'image') {
                              return (
                                <div
                                  key={`preview-fallback-${element.id}`}
                                  className="absolute pointer-events-none"
                                  style={{
                                    left: `${(element.x / 400) * 100}%`,
                                    top: `${(element.y / 400) * 100}%`,
                                    width: `${(element.width / 400) * 100}%`, // 移除額外縮放，與設計區保持一致
                                    height: `${(element.height / 400) * 100}%`,
                                    transform: 'translate(-50%, -50%)',
                                    opacity: element.opacity || 1,
                                  }}
                                >
                                  <img
                                    src={element.url}
                                    alt="預覽圖片"
                                    className="w-full h-full object-contain"
                                    style={{
                                      transform: `rotate(${element.rotation || 0}deg)`
                                    }}
                                  />
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 text-center">
                    {product.category === 'mug' ? (
                      <div>
                        <p className="text-xs text-gray-600">3D 即時預覽 - 可旋轉查看效果</p>
                        <p className="text-xs text-gray-500 mt-1">設計會環繞在馬克杯表面</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-gray-600">設計會自動裁切至印刷區域</p>
                        {product.printArea && (
                          <p className="text-xs text-gray-500 mt-1">
                            印刷區域: {product.printArea.width} × {product.printArea.height} px
                          </p>
                        )}
                      </div>
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