import { Alert } from '../util/Alert';
import { LayoutType } from '../util/LayoutType';

export default interface BaseDriveViewModel {
  title: string;
  alerts?: Alert[];
  layout: LayoutType;
  features: DriveFeatures;
  actions: DriveActions;
  urls: DriveUrls;
}

export interface DriveFeatures {
  showCreateFolder?: boolean;
  showUploadFile?: boolean;
  showShareFolder?: boolean;
  showSearch?: boolean;
  showOptions?: boolean;
  canRenameFile?: boolean;
  canRenameFolder?: boolean;
  canDeleteFile?: boolean;
  canDeleteFolder?: boolean;
  canGoBack?: boolean;
  showRootFolders?: boolean;
  showCreateRootFolder?: boolean;
}

export interface DriveActions {
  search?: string;
  createFolder?: string;
  createRootFolder?: string;
  uploadFile?: string;
  shareFolder?: string;
  changeToList?: string;
  changeToGrid?: string;
}

export interface DriveUrls {
  parentFolderLink?: string;
  rootFolderLink?: string;
}
