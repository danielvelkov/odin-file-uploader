import { Router } from 'express';
import { setDefaultLayout } from '../middleware/userAgent';
import * as publicController from '../controllers/public';

const publicRouter = Router();
publicRouter.use((req, res, next) => {
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

publicRouter.use(setDefaultLayout);

publicRouter.use('/:uuid', publicController.handleFolderLink);
publicRouter.get('/:uuid/folder/:id', publicController.getFolder);
publicRouter.get('/:uuid/search', publicController.getSharedFolderSearch);
// File related
publicRouter.get(
  '/:uuid/folder/:id/file/:fileId/download',
  publicController.downloadFile,
);
publicRouter.get('/:uuid/folder/:id/file/:fileId', publicController.getFile);
publicRouter.get('/:uuid', publicController.getSharedFolder);

export default publicRouter;
