import React, { useRef, useState } from 'react';
import '../styles/BackgroundImageUploader.css';

/**
 * 背景图上传器组件
 * 提供图片拖拽上传、预览、删除功能
 */
const BackgroundImageUploader = ({
  backgroundImage,
  onUpload,
  onDelete,
  loading = false,
  error = null
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(backgroundImage?.url || null);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * 处理文件选择
   */
  const handleFileSelect = (file) => {
    if (!file) return;

    // 检查文件类型
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      console.error('不支持的图片格式，请上传 JPG、PNG 或 WebP');
      return;
    }

    // 检查文件大小（限制 10MB）
    if (file.size > 10 * 1024 * 1024) {
      console.error('图片文件过大，请上传小于 10MB 的文件');
      return;
    }

    // 显示预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);

    // 调用上传回调
    onUpload?.(file);
  };

  /**
   * 处理文件输入变更
   */
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * 处理拖拽进入
   */
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  /**
   * 处理拖拽离开
   */
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === e.currentTarget) {
      setIsDragging(false);
    }
  };

  /**
   * 处理拖拽放下
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * 处理点击上传按钮
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * 处理删除背景图
   */
  const handleDelete = () => {
    if (window.confirm('确定要删除背景图吗？')) {
      setPreviewUrl(null);
      onDelete?.();
    }
  };

  return (
    <div className="background-image-uploader">
      <div className="uploader-section">
        <h3 className="section-title">商品背景图</h3>

        {/* 预览区域 */}
        {previewUrl ? (
          <div className="preview-container">
            <div className="preview-image">
              <img src={previewUrl} alt="背景图预览" />
            </div>

            {/* 文件信息 */}
            {backgroundImage && (
              <div className="file-info">
                <div className="info-row">
                  <span className="label">文件名:</span>
                  <span className="value">{backgroundImage.fileInfo?.originalName || backgroundImage.fileInfo?.filename}</span>
                </div>
                <div className="info-row">
                  <span className="label">大小:</span>
                  <span className="value">{backgroundImage.fileInfo?.sizeMB || (backgroundImage.fileInfo?.size / 1024 / 1024).toFixed(2)}MB</span>
                </div>
                <div className="info-row">
                  <span className="label">上传时间:</span>
                  <span className="value">{new Date(backgroundImage.uploadedAt).toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* 删除按钮 */}
            <button
              className="delete-button"
              onClick={handleDelete}
              disabled={loading}
              title="删除背景图"
            >
              ✕ 删除
            </button>

            {/* 重新上传按钮 */}
            <button
              className="re-upload-button"
              onClick={handleUploadClick}
              disabled={loading}
              title="重新上传"
            >
              ↻ 更新
            </button>
          </div>
        ) : (
          /* 上传拖拽区 */
          <div
            className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="dropzone-content">
              <div className="upload-icon">⬆</div>
              <p className="primary-text">拖拽图片到此处</p>
              <p className="secondary-text">或点击下方按钮选择</p>
              <p className="file-info-text">支持 JPG、PNG、WebP，最大 10MB</p>
            </div>

            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />

            {/* 选择按钮 */}
            <button
              className="select-button"
              onClick={handleUploadClick}
              disabled={loading}
            >
              {loading ? '上传中...' : '选择图片'}
            </button>
          </div>
        )}

        {/* 上传进度 */}
        {loading && uploadProgress > 0 && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="progress-text">{uploadProgress}%</span>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* 状态提示 */}
        {loading && (
          <div className="status-message">
            <span className="spinner">⟳</span>
            <span className="status-text">正在上传...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackgroundImageUploader;
