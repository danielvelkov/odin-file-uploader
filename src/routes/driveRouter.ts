import { Router } from 'express';
import * as driveController from '../controllers/drive';
import { isAuthenticated } from '../config/passport';

const driveRouter = Router();

driveRouter.use(isAuthenticated);
driveRouter.get('/', driveController.getDrive);
driveRouter.post('/upload', driveController.postFileUpload);
driveRouter.post('/folder/create', driveController.postFolderCreate);
driveRouter.get('/folder/:id', driveController.getFolder);
driveRouter.put('/folder/:id', driveController.updateFolderName);
driveRouter.delete('/folder/:id', driveController.deleteFolder);

export default driveRouter;
