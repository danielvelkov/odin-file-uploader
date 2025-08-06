import { Folder, SharedFolder, User } from '../../generated/prisma';
import BaseDriveViewModel, {
  DriveActions,
  DriveFeatures,
} from './BaseDriveViewModel';
import UserDriveViewModel from './UserDriveViewModel';

type SharedFolderViewModel = BaseDriveViewModel & {
  sharedFolder: SharedFolder;
  sharedFolderOwner: User;
  currentFolder: Folder;
  features: Pick<DriveFeatures, 'canGoBack' | 'showSearch'>;
  actions: Pick<DriveActions, 'changeToGrid' | 'changeToList' | 'search'>;
};

export function createSharedFolderViewModel(
  data: SharedFolderViewModel &
    Partial<UserDriveViewModel> &
    Pick<UserDriveViewModel, 'title' | 'layout'>,
): SharedFolderViewModel {
  const { features, actions, urls, ...rest } = data;
  return {
    alerts: [],
    rootFolders: [],
    features: {
      showCreateFolder: false,
      showUploadFile: false,
      showShareFolder: false,
      showSearch: true,
      showOptions: false,
      canRenameFile: false,
      canRenameFolder: false,
      canDeleteFile: false,
      canDeleteFolder: false,
      canGoBack: true,
      showRootFolders: false,
      showCreateRootFolder: false,
      ...(features ?? {}),
    },
    actions: {
      changeToList: '?layout=list',
      changeToGrid: '?layout=grid',
      ...(actions ?? {}),
    },
    urls: {
      ...(urls ?? {}),
    },
    ...rest,
  };
}
