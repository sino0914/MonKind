import React, { useRef, useEffect, useState } from 'react';
import DesignElementsLayer from './DesignElementsLayer';
import { calculateBleedBounds } from '../../../utils/bleedAreaUtils';
import { CANVAS_SIZE } from '../constants/editorConfig';

/**
 * 畫布區域組件
 * 負責渲染畫布的所有視覺元素：底圖、背景、設計區邊框、設計元素層
 * 支援縮放和平移功能
 */
const CanvasArea = ({
  // 商品相關
  currentProduct,
  processedMockupImage,

  // 設計元素
  designElements,
  backgroundColor,
  hiddenLayers,
  lockedLayers,

  // 選擇和編輯狀態
  selectedElement,
  editingText,
  editingContent,
  setEditingContent,
  draggedElement,

  // 圖片替換相關
  isReplacingImage,
  replacingImageId,
  getDisplayUrl,
  onReplaceClick,
  isHoveringImage,

  // 事件處理函數
  handleMouseMove,
  handleMouseUp,
  handleCanvasClick,
  handleMouseDown,
  handleSelectElement,
  handleFinishTextEdit,
  handleStartTextEdit,
  handleDeleteElement,
  handleDragOver,
  handleDrop,

  // 測量函數
  measureTextWidth,
  editingInputWidth,

  // 圖片載入錯誤管理
  markImageAsError,
  clearImageError,

  // 剪裁相關
  croppingElement,
  maskRect,
  onUpdateMaskRect,
  onUpdateElement,
  onApplyCrop,
  onCancelCrop,
  onResetCrop,

  // 自由變形相關
  isFreeTransform,
  onToggleFreeTransform,

  // 形狀調整相關
  adjustingElement,
  shapeAdjustOffset,
  onUpdateShapeOffset,
  onApplyShapeAdjust,
  onCancelShapeAdjust,
  onResetShapeOffset,

  // 視窗控制
  viewport = null,
}) => {
  // 畫布容器的 ref
  const canvasContainerRef = useRef(null);

  // 追蹤畫布縮放因子
  const [canvasScale, setCanvasScale] = useState(1);

  // 測量畫布實際尺寸並計算縮放因子
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const updateScale = () => {
      const actualWidth = container.offsetWidth;
      const newScale = actualWidth / CANVAS_SIZE;
      setCanvasScale(newScale);
    };

    // 初始化測量
    updateScale();

    // 監聽容器尺寸變化
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []); // 移除 canvasScale 依賴，避免重複建立 observer

  // 使用原生事件監聽器來阻止滾輪事件冒泡
  useEffect(() => {
    const canvasElement = canvasContainerRef.current;
    if (!canvasElement || !viewport) return;

    const handleWheel = (e) => {
      // 阻止預設行為和事件冒泡
      e.preventDefault();
      e.stopPropagation();

      // 調用 viewport 的處理函數
      viewport.handleWheel(e);
    };

    // 使用 passive: false 來允許 preventDefault
    canvasElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvasElement.removeEventListener('wheel', handleWheel);
    };
  }, [viewport]);

  // 合併滑鼠移動事件
  const combinedMouseMove = (e) => {
    if (viewport?.isPanning) {
      viewport.handleMouseMove(e);
    } else {
      handleMouseMove(e);
    }
  };

  // 合併滑鼠放開事件
  const combinedMouseUp = (e) => {
    handleMouseUp(e);
    if (viewport) {
      viewport.handleMouseUp(e);
    }
  };

  // 合併滑鼠按下事件
  const combinedMouseDown = (e) => {
    // 如果是中鍵，啟動畫布平移
    if (viewport && e.button === 1) {
      e.preventDefault();
      viewport.handleMouseDown(e);
      return;
    }
    // 其他按鍵（如左鍵）讓事件繼續傳播，由元素處理
  };

  // 合併滑鼠離開事件
  const combinedMouseLeave = (e) => {
    handleMouseUp(e);
    if (viewport) {
      viewport.handleMouseLeave(e);
    }
  };
  return (
    <div
      ref={canvasContainerRef}
      className="border-2 border-gray-200 rounded-lg relative bg-white canvas-container"
      style={{
        overflow: "hidden",
        cursor: viewport?.isPanning ? 'grabbing' : (isHoveringImage ? 'none' : 'auto'),
        flexShrink: 0,
        width: 'min(100%, 600px)',
        aspectRatio: '1 / 1',
        height: 'auto',
      }}
      onMouseDown={combinedMouseDown}
      onMouseMove={combinedMouseMove}
      onMouseUp={combinedMouseUp}
      onMouseLeave={combinedMouseLeave}
      onClick={handleCanvasClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="absolute"
        style={{
          transformOrigin: 'center center',
          transform: viewport
            ? `scale(${viewport.zoom}) translate(${viewport.pan.x}px, ${viewport.pan.y}px)`
            : 'none',
          transition: viewport?.isPanning ? 'none' : 'transform 0.1s ease-out',
          width: '100%',
          height: '100%',
          left: '0',
          top: '0',
        }}
      >
      {/* 產品背景 - 3D和2D產品使用不同顯示方式 */}
      {currentProduct.type === "3D" ? (
        /* 3D產品：只在設計區域顯示底圖 */
        <>
          {/* 3D產品的畫布背景 - 淺色背景用於對比 */}
          <div className="absolute inset-0 bg-gray-50"></div>

          {/* 在設計區域內顯示底圖 */}
          {currentProduct.mockupImage && currentProduct.printArea && (
            <div
              className="absolute overflow-hidden"
              style={{
                left: `${(currentProduct.printArea.x / 400) * 100}%`,
                top: `${(currentProduct.printArea.y / 400) * 100}%`,
                width: `${(currentProduct.printArea.width / 400) * 100}%`,
                height: `${(currentProduct.printArea.height / 400) * 100}%`,
                zIndex: 0,
              }}
            >
              <img
                src={processedMockupImage || currentProduct.mockupImage}
                alt={`${currentProduct.title} 設計區底圖`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("3D產品底圖載入失敗");
                  e.target.style.display = "none";
                }}
              />
            </div>
          )}
        </>
      ) : (
        /* 2D產品：傳統顯示方式 - 整個畫布顯示完整底圖 */
        <>
          {currentProduct.mockupImage ? (
            <img
              src={processedMockupImage || currentProduct.mockupImage}
              alt={`${currentProduct.title} 底圖`}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}

          {/* 2D產品的Fallback內容 */}
          <div
            className="absolute inset-0 bg-gray-100 border border-dashed border-gray-400 rounded flex items-center justify-center"
            style={{
              display: currentProduct.mockupImage ? "none" : "flex",
            }}
          >
            <div className="text-center">
              <img
                src={currentProduct.image}
                alt={currentProduct.title}
                className="w-16 h-16 mx-auto mb-2 opacity-30"
              />
              <p className="text-gray-600 text-sm">商品底圖載入中...</p>
              <p className="text-gray-500 text-xs">點擊工具開始設計</p>
            </div>
          </div>
        </>
      )}

      {/* 3D產品的Fallback內容 */}
      {currentProduct.type === "3D" && !currentProduct.mockupImage && (
        <div
          className="absolute bg-gray-100 border border-dashed border-gray-400 rounded flex items-center justify-center"
          style={{
            left: `${((currentProduct.printArea?.x || 50) / 400) * 100}%`,
            top: `${((currentProduct.printArea?.y || 50) / 400) * 100}%`,
            width: `${((currentProduct.printArea?.width || 200) / 400) * 100}%`,
            height: `${((currentProduct.printArea?.height || 150) / 400) * 100}%`,
            zIndex: 0,
          }}
        >
          <div className="text-center">
            <p className="text-gray-600 text-xs">設計區域</p>
            <p className="text-gray-500 text-xs">請先在後台設定底圖</p>
          </div>
        </div>
      )}

      {/* Print Area Overlay */}
      {currentProduct.printArea && (
        <>
          <div
            className="absolute bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-sm z-10"
            style={{
              left: `${(currentProduct.printArea.x / 400) * 100}%`,
              top: `${(currentProduct.printArea.y / 400) * 100 - 2}%`,
              transform: "translateY(-100%)",
            }}
          >
            設計區 {currentProduct.printArea.width}×
            {currentProduct.printArea.height}px
          </div>

          {/* 設計區域背景色 - 與即時預覽區保持一致 */}
          {/* 背景色層 - 填充到出血區域 */}
          {(() => {
            // 如果有出血區域，使用出血區域範圍；否則使用設計區域
            const backgroundBounds = currentProduct.bleedArea
              ? calculateBleedBounds(currentProduct.printArea, currentProduct.bleedArea)
              : currentProduct.printArea;

            return (
              <>
                {/* 對於2D產品或沒有出血區域的產品，顯示背景色 */}
                {currentProduct.type !== "3D" && (
                  <div
                    className="absolute"
                    style={{
                      left: `${(backgroundBounds.x / 400) * 100}%`,
                      top: `${(backgroundBounds.y / 400) * 100}%`,
                      width: `${(backgroundBounds.width / 400) * 100}%`,
                      height: `${(backgroundBounds.height / 400) * 100}%`,
                      backgroundColor: backgroundColor,
                      zIndex: 1,
                    }}
                  />
                )}

                {/* 3D產品的背景色層，顯示在底圖之上 */}
                {currentProduct.type === "3D" &&
                  backgroundColor &&
                  backgroundColor !== "#ffffff" && (
                    <div
                      className="absolute"
                      style={{
                        left: `${(backgroundBounds.x / 400) * 100}%`,
                        top: `${(backgroundBounds.y / 400) * 100}%`,
                        width: `${(backgroundBounds.width / 400) * 100}%`,
                        height: `${(backgroundBounds.height / 400) * 100}%`,
                        backgroundColor: backgroundColor,
                        opacity: 0.8,
                        zIndex: 1,
                      }}
                    />
                  )}
              </>
            );
          })()}

          {/* 設計區域邊框 */}
          <div
            className="absolute border-2 border-blue-500 border-dashed bg-transparent"
            style={{
              left: `${(currentProduct.printArea.x / 400) * 100}%`,
              top: `${(currentProduct.printArea.y / 400) * 100}%`,
              width: `${(currentProduct.printArea.width / 400) * 100}%`,
              height: `${(currentProduct.printArea.height / 400) * 100}%`,
              zIndex: 2,
            }}
          />

          {/* 出血區域視覺提示 */}
          {currentProduct.bleedArea && (() => {
            const bleedBounds = calculateBleedBounds(currentProduct.printArea, currentProduct.bleedArea);
            return (
              <>
                {/* 出血區域半透明背景 */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${(bleedBounds.x / 400) * 100}%`,
                    top: `${(bleedBounds.y / 400) * 100}%`,
                    width: `${(bleedBounds.width / 400) * 100}%`,
                    height: `${(bleedBounds.height / 400) * 100}%`,
                    backgroundColor: 'rgba(255, 200, 200, 0.1)',
                    zIndex: 3,
                  }}
                />

                {/* 出血區域虛線邊框 */}
                <div
                  className="absolute border-2 border-red-500 border-dashed pointer-events-none"
                  style={{
                    left: `${(bleedBounds.x / 400) * 100}%`,
                    top: `${(bleedBounds.y / 400) * 100}%`,
                    width: `${(bleedBounds.width / 400) * 100}%`,
                    height: `${(bleedBounds.height / 400) * 100}%`,
                    zIndex: 4,
                  }}
                />

                {/* 出血區域標籤 */}
                <div
                  className="absolute text-xs text-red-500 bg-white px-1 py-0.5 rounded pointer-events-none shadow-sm"
                  style={{
                    left: `${(bleedBounds.x / 400) * 100}%`,
                    top: `${((bleedBounds.y - 20) / 400) * 100}%`,
                    zIndex: 5,
                  }}
                >
                  出血區域 {Math.round(bleedBounds.width)}×{Math.round(bleedBounds.height)}px
                </div>
              </>
            );
          })()}

          {/* Design Elements Layer - 不受設計區裁切，正常渲染 */}
          <DesignElementsLayer
            currentProduct={currentProduct}
            designElements={designElements}
            hiddenLayers={hiddenLayers}
            lockedLayers={lockedLayers}
            selectedElement={selectedElement}
            editingText={editingText}
            editingContent={editingContent}
            setEditingContent={setEditingContent}
            draggedElement={draggedElement}
            isReplacingImage={isReplacingImage}
            replacingImageId={replacingImageId}
            getDisplayUrl={getDisplayUrl}
            markImageAsError={markImageAsError}
            clearImageError={clearImageError}
            croppingElement={croppingElement}
            maskRect={maskRect}
            onUpdateMaskRect={onUpdateMaskRect}
            onUpdateElement={onUpdateElement}
            onApplyCrop={onApplyCrop}
            onCancelCrop={onCancelCrop}
            onResetCrop={onResetCrop}
            isFreeTransform={isFreeTransform}
            onToggleFreeTransform={onToggleFreeTransform}
            adjustingElement={adjustingElement}
            shapeAdjustOffset={shapeAdjustOffset}
            onUpdateShapeOffset={onUpdateShapeOffset}
            onApplyShapeAdjust={onApplyShapeAdjust}
            onCancelShapeAdjust={onCancelShapeAdjust}
            onResetShapeOffset={onResetShapeOffset}
            handleMouseDown={handleMouseDown}
            handleSelectElement={handleSelectElement}
            handleFinishTextEdit={handleFinishTextEdit}
            handleStartTextEdit={handleStartTextEdit}
            handleDeleteElement={handleDeleteElement}
            measureTextWidth={measureTextWidth}
            editingInputWidth={editingInputWidth}
            canvasScale={canvasScale}
          />
        </>
      )}
      </div>
    </div>
  );
};

export default CanvasArea;
