/**
 * ProductMaintenance - 共享組件庫
 *
 * 使用方式:
 *
 * Admin 模式:
 * ```jsx
 * import { useProductMaintenance, adminConfig } from '@monkind/shared/components/ProductMaintenance';
 *
 * function AdminProductMaintenance() {
 *   const pm = useProductMaintenance(adminConfig);
 *   // 使用 pm 提供的所有狀態和方法
 * }
 * ```
 *
 * Customer 模式:
 * ```jsx
 * import { useProductMaintenance, customerConfig } from '@monkind/shared/components/ProductMaintenance';
 *
 * function CustomerProductMaintenance() {
 *   const pm = useProductMaintenance(customerConfig);
 *   // 使用 pm 提供的所有狀態和方法
 * }
 * ```
 */

// Hooks
export { useNotification } from './hooks/useNotification';
export { useDesignArea } from './hooks/useDesignArea';
export { useProductMaintenance } from './hooks/useProductMaintenance';

// Components
export { default as NotificationMessage } from './components/NotificationMessage';
export { default as DesignAreaPreview } from './components/DesignAreaPreview';
export { default as BleedAreaSettings } from './components/BleedAreaSettings';

// Utils
export * from './utils/validationHelpers';
export * from './utils/bleedAreaUtils';

// Config
export { adminConfig, customerConfig, getConfig, mergeConfig } from './config';
