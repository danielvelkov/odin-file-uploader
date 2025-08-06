import { Router } from 'express';
import * as driveController from '../controllers/drive';
import { isAuthenticated } from '../config/passport';
import { setDefaultLayout } from '../middleware/userAgent';

const driveRouter = Router();
driveRouter.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  const normalizedUrl = req.originalUrl.split('?')[0];
  if (!/^[a-zA-Z0-9/_-]+$/.test(normalizedUrl)) {
    throw new Error('Invalid URL');
  }
  res.locals.url = normalizedUrl;

  next();
});

driveRouter.use(isAuthenticated);

driveRouter.use(setDefaultLayout);

// File related
driveRouter.get(
  '/folder/:parentFolderId/file/:id/download',
  driveController.downloadFile,
);
driveRouter.put(
  '/folder/:parentFolderId/file/:id',
  driveController.updateFileName,
);
driveRouter.get('/folder/:parentFolderId/file/:id', driveController.getFile);
driveRouter.post('/folder/:id/upload', driveController.postFileUpload);
driveRouter.delete(
  '/folder/:parentFolderId/file/:id',
  driveController.deleteFile,
);

// Folder related
driveRouter.post('/folder/:id/share', driveController.postSubfolderShare);
driveRouter.post('/folder/:id/create', driveController.postSubfolderCreate);
driveRouter.post('/folder/create', driveController.postFolderCreate);
driveRouter.get('/folder/:id', driveController.getFolder);
driveRouter.put('/folder/:id', driveController.updateFolderName);
driveRouter.delete('/folder/:id', driveController.deleteFolder);

driveRouter.get('/search', driveController.getDriveSearch);
driveRouter.get('/', driveController.getDrive);

export default driveRouter;
