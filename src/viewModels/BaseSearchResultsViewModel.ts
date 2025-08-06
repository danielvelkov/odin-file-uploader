import { Folder, File } from '../../generated/prisma';
import BaseDriveViewModel, {
  DriveActions,
  DriveFeatures,
} from './BaseDriveViewModel';

export default interface BaseSearchResultsViewModel extends BaseDriveViewModel {
  searchTerm: string;
  getResultsCount: () => number;
  results: {
    folders: Folder[];
    files: File[];
  };
  features: Omit<
    DriveFeatures,
    'showCreateFolder' | 'showUploadFile' | 'showShareFolder'
  >;
  actions: Pick<DriveActions, 'search' | 'changeToGrid' | 'changeToList'>;
}
