import * as userController from '../controllers/user';
import { Router } from 'express';

const userRouter = Router();

userRouter.get('/login', userController.getLogin);
userRouter.post('/login', userController.postLogin);
userRouter.get('/signup', userController.getSignup);
userRouter.post('/signup', ...userController.postSignup);
userRouter.get('/logout', userController.getLogout);

export default userRouter;
