// Re-export ImageServiceOrchestrator from local with explicit path
// to maintain compatibility while keeping property domain self-contained
export * from '../../local/services/images/ImageServiceOrchestrator'
export { default, getImageServiceOrchestrator, resetImageServiceOrchestrator, createImageServiceOrchestrator } from '../../local/services/images/ImageServiceOrchestrator'
