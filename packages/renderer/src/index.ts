export { createTabletopRenderer } from "./tabletop-renderer";
export type { TabletopRenderer, TacticalHighlights } from "./types";
export {
  alternatingAssetId,
  assetStatusKey,
} from "./catalog";
export type {
  AssetPreloadRequest,
  TabletopAssetCatalog,
} from "./catalog";
export {
  buildRoomProjection,
  calculateIsometricGridBounds,
  defaultCameraMargins,
  defaultIsometricProjection,
  fitIsometricCamera,
  gridToScreen,
  isometricPlaceholderTokenGeometry,
  screenToGrid,
  stableDepth,
} from "./projection";
export type {
  CameraFit,
  CameraMargins,
  IsometricBounds,
  IsometricProjection,
  ScreenPosition,
  Viewport,
} from "./projection";
export {
  logicalToView,
  nextCameraRotation,
  roomWallSegments,
  transformRoomSide,
  viewDimensions,
  viewToLogical,
  visibleBackSides,
  visibleWallSegments,
} from "./view";
export type {
  BackWallViewSide,
  CameraRotation,
  GridDimensions,
  PhysicalWallSegment,
  RoomSide,
  VisibleWallSegment,
  WallAssetOrientation,
} from "./view";
export {
  IsometricAssetRegistry,
  assetBudgets,
  validateRuntimeAssetManifest,
} from "./assets";
export type {
  AssetOrientation,
  AssetResolveResult,
  RuntimeAsset,
  RuntimeAssetManifest,
} from "./assets";
