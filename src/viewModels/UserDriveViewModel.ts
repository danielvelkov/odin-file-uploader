import { Folder, User } from '../../generated/prisma';
import BaseDriveViewModel from './BaseDriveViewModel';

export default interface UserDriveViewModel extends BaseDriveViewModel {
  currentUser: User;
  rootFolders: Folder[];
  currentFolder?: Folder;
}

export function createUserDriveViewModel(
  data: Partial<UserDriveViewModel> &
    Pick<UserDriveViewModel, 'title' | 'layout' | 'currentUser'>,
): UserDriveViewModel {
  const { features, actions, urls, ...rest } = data;
  return {
    alerts: [],
    rootFolders: [],
    features: {
      showCreateFolder: true,
      showUploadFile: true,
      showShareFolder: true,
      showSearch: true,
      showOptions: true,
      canRenameFile: true,
      canRenameFolder: true,
      canDeleteFile: true,
      canDeleteFolder: true,
      canGoBack: true,
      showRootFolders: true,
      showCreateRootFolder: true,
      ...(features ?? {}),
    },
    actions: {
      search: '/drive/search',
      createFolder: '/drive/folder/create',
      createRootFolder: '/drive/folder/create',
      changeToList: '?layout=list',
      changeToGrid: '?layout=grid',
      ...(actions ?? {}),
    },
    urls: {
      rootFolderLink: '/drive',
      ...(urls ?? {}),
    },
    ...rest,
  };
}
