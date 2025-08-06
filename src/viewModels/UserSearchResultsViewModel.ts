import BaseSearchResultsViewModel from './BaseSearchResultsViewModel';
import UserDriveViewModel from './UserDriveViewModel';

type UserSearchResultsViewModel = BaseSearchResultsViewModel &
  Required<Pick<UserDriveViewModel, 'title' | 'rootFolders' | 'currentUser'>>;

export function createUserSearchResultsViewModel(
  data: Partial<UserSearchResultsViewModel> &
    Pick<UserDriveViewModel, 'title' | 'rootFolders' | 'currentUser'>,
): UserSearchResultsViewModel {
  const { features, actions, urls, ...rest } = data;

  // Default values
  return {
    layout: 'grid',
    alerts: [],
    results: {
      files: [],
      folders: [],
    },
    searchTerm: '',
    getResultsCount: () =>
      (data.results?.files?.length ?? 0) + (data.results?.folders?.length ?? 0),
    features: {
      showSearch: true,
      showOptions: true,
      showRootFolders: true,
      ...(features ?? {}),
    },
    actions: {
      search: '/drive/search',
      changeToList: '?layout=list',
      changeToGrid: '?layout=grid',
      ...(actions ?? {}),
    },
    urls: {
      rootFolderLink: '/drive',
      parentFolderLink: '/drive',
      ...(urls ?? {}),
    },
    ...rest,
  };
}
