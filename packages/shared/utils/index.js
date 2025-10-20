// Export utility functions
export * from './ProductDataManager';
export { default as TemplatePreviewGenerator } from './TemplatePreviewGenerator';

// Export specific functions from TemplatePreviewGenerator
export {
  generateTemplatePreview,
  generateTemplateThumbnail
} from './TemplatePreviewGenerator';
