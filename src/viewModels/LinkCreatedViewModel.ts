import UserDriveViewModel, {
  createUserDriveViewModel,
} from './UserDriveViewModel';
type LinkCreatedViewModel = UserDriveViewModel & {
  createdSharedFolderLink: string;
};

// I hate that name
export function createLinkCreatedViewModel(
  data: Partial<LinkCreatedViewModel> &
    Pick<LinkCreatedViewModel, 'title' | 'layout' | 'currentUser'>,
): LinkCreatedViewModel {
  return createUserDriveViewModel(data) as LinkCreatedViewModel;
}
