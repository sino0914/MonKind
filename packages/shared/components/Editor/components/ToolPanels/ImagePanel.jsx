import React from "react";
import PropTypes from "prop-types";

/**
 * 圖片面板組件
 * 提供圖片上傳和管理功能
 */
const ImagePanel = ({
  uploadedImages,
  isUploading,
  handleImageUpload,
  handleAddImageToCanvas,
  handleDeleteUploadedImage,
  handleDragStart,
  handleDragEnd,
  isReplacingImage,
  uploadErrors = [],
  clearUploadErrors,
}) => {
  return (
    <div className="space-y-4">
      {/* 替換模式提示 */}
      {isReplacingImage && (
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 mb-2">
          <div className="flex items-center gap-2 text-blue-800">
            <span className="text-lg">🔄</span>
            <div className="flex-1">
              <div className="text-sm font-medium">替換模式已啟用</div>
              <div className="text-xs text-blue-600 mt-0.5">
                點擊圖片以替換選取的元素
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 上傳錯誤訊息 */}
      {uploadErrors.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-red-800 mb-2">
                <span className="text-lg">⚠️</span>
                <span className="text-sm font-medium">
                  部分圖片上傳失敗 ({uploadErrors.length} 個)
                </span>
              </div>
              <ul className="text-xs text-red-700 space-y-1 ml-7">
                {uploadErrors.map((error, index) => (
                  <li key={index}>
                    <span className="font-medium">{error.name}</span>: {error.reason}
                  </li>
                ))}
              </ul>
            </div>
            {clearUploadErrors && (
              <button
                onClick={clearUploadErrors}
                className="text-red-500 hover:text-red-700 text-lg leading-none ml-2"
                title="關閉"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

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
            isUploading
              ? "bg-blue-50 border-blue-300"
              : "hover:bg-gray-50"
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
              <div className="text-xs text-gray-500 mt-1">
                支援 JPG、PNG 格式
              </div>
            </>
          )}
        </label>
      </div>

      {/* 已上傳圖片庫 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">圖片庫</h4>
          <span className="text-xs text-gray-500">
            {uploadedImages.length} 張圖片
          </span>
        </div>

        {uploadedImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
            {uploadedImages.map((image) => (
              <div key={image.id} className="relative group">
                <button
                  onClick={() => handleAddImageToCanvas(image)}
                  draggable={handleDragStart ? true : false}
                  onDragStart={(e) => {
                    if (handleDragStart) {
                      e.dataTransfer.effectAllowed = 'copy';
                      handleDragStart(image.url);
                    }
                  }}
                  onDragEnd={() => {
                    if (handleDragEnd) {
                      handleDragEnd();
                    }
                  }}
                  className="aspect-square bg-gray-100 rounded border hover:border-blue-400 transition-colors overflow-hidden w-full cursor-pointer"
                  title={`點擊添加到畫布 - ${image.name}`}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover pointer-events-none"
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
  );
};

ImagePanel.propTypes = {
  uploadedImages: PropTypes.array.isRequired,
  isUploading: PropTypes.bool.isRequired,
  handleImageUpload: PropTypes.func.isRequired,
  handleAddImageToCanvas: PropTypes.func.isRequired,
  handleDeleteUploadedImage: PropTypes.func.isRequired,
  handleDragStart: PropTypes.func,
  handleDragEnd: PropTypes.func,
  isReplacingImage: PropTypes.bool,
  uploadErrors: PropTypes.array,
  clearUploadErrors: PropTypes.func,
};

export default ImagePanel;
