import { NextFunction, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import multer from 'multer';
import fileValidation from '../util/fileValidation';
import { Alert } from '../util/Alert';
import prisma from '../db/client';
import { User } from '../../generated/prisma';
import Error404 from '../util/errors/Error404';

const upload = multer({ dest: 'uploads/' });

const folderNameValidation = check('folder')
  .notEmpty()
  .withMessage('Folder name required')
  .bail()
  .trim()
  .isLength({ min: 1, max: 20 })
  .withMessage('Folder name should be between 1 and 20 characters long.')
  .bail()
  .escape()
  .isLength({ min: 1, max: 20 })
  .withMessage(
    'Escaped folder name exceeds length limit.\r\n Replace any of those <, >, &, \', ", `, \\ , / characters.',
  );

/**
 * Displays user's drive containing his folders and files.
 * @route GET /drive/
 */
export const getDrive = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const rootFolders = await getUserRootFolders(+(req.user as User).id);
    res.render('drive', { title: 'My drive', folders: rootFolders });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

/**
 * Upload a file action.
 * @route POST /drive/upload
 */
export const postFileUpload = [
  upload.single('file'),

  // express validator middleware
  check('file').custom((_value, { req }) => {
    const { errors } = fileValidation(req.file);
    if (errors.length > 0) {
      throw new Error(errors.map((e) => ` • ${e}`).join('\r\n'));
    }
    return true;
  }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const alerts = errors
        .array()
        .map((e) => new Alert('warning', 'Invalid File', e.msg));

      return res.render('drive', {
        alerts,
        title: 'My drive',
        folders: await getUserRootFolders(+(req.user as User).id),
      });
    }
    // TODO add file to current folder
    // console.log(req.file);
    res.redirect('/drive');
  },
];

/**
 * Get Folder contents.
 * @route GET /drive/folder/:id
 */
export const getFolder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;

  try {
    const folder = await prisma.folder.findFirst({
      where: {
        id: +id,
        owner_id: +(req.user as User).id,
      },
      include: {
        files: true,
        subfolders: true,
        parentFolder: true,
      },
    });

    if (!folder) throw new Error404('Folder does not exist');

    return res.render('drive', {
      title: folder.name,
      folders: await getUserRootFolders(+(req.user as User).id),
      currentFolder: folder,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Create a folder.
 * @route POST /drive/folder/create
 */
export const postFolderCreate = [
  folderNameValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const alerts = errors
        .array()
        .map((e) => new Alert('warning', 'Invalid Folder name', e.msg));

      return res.render('drive', {
        alerts,
        title: 'My drive',
        folders: await getUserRootFolders(+(req.user as User).id),
      });
    }

    try {
      const existingFolder = await prisma.folder.findFirst({
        where: {
          name: req.body.folder,
          parentFolder: null,
          owner_id: +(req.user as User).id,
        },
      });

      if (existingFolder) {
        const alert = new Alert(
          'error',
          'Folder with that name already exists.',
          '',
        );

        return res.render('drive', {
          title: 'My Drive',
          alerts: [alert],
          folders: await getUserRootFolders(+(req.user as User).id),
        });
      }

      await prisma.folder.create({
        data: {
          name: req.body.folder,
          owner_id: +(req.user as User).id,
        },
      });

      res.redirect('/drive');
    } catch (error) {
      console.error(error);
      next(error);
    }
  },
];

/**
 * Delete a folder action.
 * @route DELETE /drive/folder/:id
 */
export const deleteFolder = [
  check('id')
    .notEmpty()
    .isNumeric()
    .withMessage('Folder Id route param not provided'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        const alerts = errors
          .array()
          .map((e) => new Alert('error', 'Failed to delete folder', e.msg));

        return res.render('drive', {
          alerts,
          title: 'My drive',
          folders: await getUserRootFolders(+(req.user as User).id),
        });
      }

      const { id } = req.params;
      const folderForDeletion = await prisma.folder.findFirst({
        where: {
          id: +id,
          owner_id: (req.user as User).id,
        },
      });

      if (!folderForDeletion)
        return res.render('drive', {
          alerts: [
            new Alert(
              'error',
              'Failed to delete folder',
              'Folder with such id does not exist',
            ),
          ],
          folders: await getUserRootFolders(+(req.user as User).id),
          title: 'My drive',
        });

      await prisma.folder.delete({
        where: { id: folderForDeletion?.id },
      });

      return res.render('drive', {
        alerts: [new Alert('success', 'Folder deleted', '')],
        folders: await getUserRootFolders(+(req.user as User).id),
        title: 'My drive',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
];

/**
 * Update a folder's name.
 * @route PUT /drive/folder/:id
 */
export const updateFolderName = [
  check('id')
    .notEmpty()
    .isNumeric()
    .withMessage('Folder Id route param not provided'),
  check('folder'),
  folderNameValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        const alerts = errors
          .array()
          .map((e) => new Alert('error', 'Failed to update folder', e.msg));

        return res.render('drive', {
          alerts,
          title: 'My drive',
          folders: await getUserRootFolders(+(req.user as User).id),
        });
      }

      const { id } = req.params;
      const folderForUpdate = await prisma.folder.findFirst({
        where: {
          id: +id,
          owner_id: (req.user as User).id,
        },
      });

      if (!folderForUpdate)
        return res.render('drive', {
          alerts: [
            new Alert(
              'error',
              'Failed to update folder name',
              'Folder with such id does not exist',
            ),
          ],
          folders: await getUserRootFolders(+(req.user as User).id),
          title: 'My drive',
        });

      await prisma.folder.update({
        where: { id: folderForUpdate?.id },
        data: {
          name: req.body.folder,
        },
      });

      return res.render('drive', {
        alerts: [new Alert('success', 'Folder renamed', '')],
        folders: await getUserRootFolders(+(req.user as User).id),
        title: 'My drive',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
];

const getUserRootFolders = async (userId: number) => {
  return await prisma.folder.findMany({
    where: {
      owner_id: userId,
      parentFolderId: null,
    },
  });
};
