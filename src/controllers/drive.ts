import { NextFunction, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import multer from 'multer';
import fileValidation, {
  MAX_FILE_NAME_LEN,
  MAX_SIZE,
} from '../util/fileValidation';
import { Alert } from '../util/Alert';
import prisma from '../db/client';
import { v2 as cloudinary } from 'cloudinary'; //to work set .env var: CLOUDINARY_URL=cloudinary://my_key:my_secret@my_cloud_name
import { File, Folder, User } from '../../generated/prisma';
import Error404 from '../util/errors/Error404';
import path from 'path';
import mime from 'mime';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import fetch from 'node-fetch';

interface FileRequest extends Request {
  fileValidationError?: string;
  parentFolder?: Folder;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const filename = `${uniqueId}${extension}`;
    cb(null, filename);
  },
});

const fileUpload = multer({
  storage: storage,
  limits: {
    files: 1,
    fileSize: MAX_SIZE,
  },
  fileFilter: (req, file, cb) => {
    const { errors } = fileValidation(file);

    if (errors.length > 0) {
      return cb(new Error(errors.map((e) => ` • ${e}`).join('\r\n')));
    }

    cb(null, true);
  },
});

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

const fileNameValidation = check('file')
  .notEmpty()
  .withMessage('File name required')
  .bail()
  .trim()
  .isLength({ min: 1, max: MAX_FILE_NAME_LEN })
  .withMessage(
    `File name should be between 1 and ${MAX_FILE_NAME_LEN} characters long`,
  )
  .bail()
  .escape()
  .isLength({ min: 1, max: MAX_FILE_NAME_LEN })
  .withMessage(
    `Escaped file name exceeds length limit (${MAX_FILE_NAME_LEN}).\r\n Replace any of those <, >, &, ', ", \`, \\ , / characters.`,
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
    const { alerts } = req.session;
    delete req.session.alerts;

    const rootFolders = await getUserRootFolders(+(req.user as User).id);
    res.render('drive', {
      title: 'My drive',
      folders: rootFolders,
      alerts: alerts
        ? alerts.map((a) => new Alert(a.type, a.title, a.message))
        : [],
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

/**
 * Upload a file to a folder action.
 * @route POST /drive/folder/:id/upload
 */
export const postFileUpload = [
  (req: FileRequest, res: Response, next: NextFunction) => {
    fileUpload.single('file')(req, res, async (err) => {
      if (err) {
        // Handle different types of multer errors
        if (err.code === 'LIMIT_FILE_SIZE') {
          req.fileValidationError = `File size exceeds limit (${(MAX_SIZE / Math.pow(1024, 2)).toFixed(2)} MB).`;
        } else {
          req.fileValidationError = err.message;
        }

        return next();
      }

      // Handle no file passed
      if (!req.file) {
        req.fileValidationError = 'No file uploaded';
        return next();
      }

      const file = req.file;

      // Handle Folder not existing OR file existing with the same name
      try {
        const { id } = req.params;

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

        if (!folder) return next(new Error404('Folder does not exist'));

        req.parentFolder = folder;

        if (
          folder.files.some(
            (f) =>
              path.parse(f.name).name === path.parse(file.originalname).name &&
              path.parse(f.name).ext.toLowerCase() ===
                path.parse(file.originalname).ext.toLowerCase(),
          )
        ) {
          req.fileValidationError =
            'File with this name already exists in folder.';
          return next();
        } else next();
      } catch (error) {
        console.log(error);
        next(error);
      }
    });
  },
  // Express validator middleware
  check('file').custom((_value, { req }) => {
    if (req.fileValidationError) {
      throw new Error(req.fileValidationError);
    }
    return true;
  }),
  async (req: FileRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const alerts = errors
          .array()
          .map((e) => new Alert('warning', 'Invalid File', e.msg));

        return res.render('drive', {
          alerts,
          title: req.parentFolder?.name || 'My Drive',
          folders: await getUserRootFolders(+(req.user as User).id),
          currentFolder: req.parentFolder,
        });
      }

      if (!req.file) return next(new Error('No file uploaded.'));

      if (!req.parentFolder) return next(new Error('No folder specified.'));

      const result = await cloudinary.uploader.upload(
        path.resolve(process.cwd(), req.file.path),
        {
          resource_type: 'auto',
          public_id: path.parse(req.file.path).name,
        },
      );

      await prisma.file.create({
        data: {
          name: req.file.originalname,
          ext: path.extname(req.file.originalname).toLowerCase(),
          size: req.file.size,
          parentFolderId: req.parentFolder.id,
          owner_id: (req.user as User).id,
          path: req.file.path,
          cloudinary_public_id: result.public_id,
        },
      });

      await unlink(path.resolve(process.cwd(), req.file.path));

      res.redirect(`/drive/folder/${req.parentFolder?.id ?? ''}`);
    } catch (error) {
      // Clean up uploaded file if database save fails
      if (req.file) {
        try {
          await unlink(path.resolve(process.cwd(), req.file.path));
        } catch (unlinkError) {
          console.error('Failed to clean up file:', unlinkError);
        }
      }
      console.error('Upload error:', error);
      next(error);
    }
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

  const { alerts } = req.session;
  delete req.session.alerts;

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

    if (!folder) return next(new Error404('Folder does not exist'));

    return res.render('drive', {
      title: folder.name,
      folders: await getUserRootFolders(+(req.user as User).id),
      currentFolder: folder,
      alerts: alerts
        ? alerts.map((a) => new Alert(a.type, a.title, a.message))
        : [],
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Create a root folder.
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
      req.session.alerts = alerts;

      return res.redirect('/drive');
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

        req.session.alerts = [alert];
        return res.redirect('/drive');
      }

      await prisma.folder.create({
        data: {
          name: req.body.folder,
          owner_id: +(req.user as User).id,
        },
      });

      const alert = new Alert('success', 'Folder created.', '');

      req.session.alerts = [alert];
      res.redirect('/drive');
    } catch (error) {
      console.error(error);
      next(error);
    }
  },
];

/**
 * Create a folder inside another folder.
 * @route POST /drive/folder/:id/create
 */
export const postSubfolderCreate = [
  folderNameValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const parentFolder = await getUserFolderContents(
      +id,
      (req.user as User).id,
    );
    const errors = validationResult(req);

    if (!parentFolder)
      return next(
        new Error404(
          'Cannot create directory. \n\rFolder with such id does not exist.',
        ),
      );

    if (!errors.isEmpty()) {
      const alerts = errors
        .array()
        .map((e) => new Alert('warning', 'Invalid Folder name', e.msg));

      req.session.alerts = alerts;

      return res.redirect(`/drive/folder/${id}`);
    }

    try {
      const existingFolder = parentFolder?.subfolders.find(
        (f) => f.name === req.body.folder,
      );

      if (existingFolder) {
        const alert = new Alert(
          'error',
          'Folder with that name already exists.',
          '',
        );
        req.session.alerts = [alert];

        return res.redirect(`/drive/folder/${id}`);
      }

      await prisma.folder.create({
        data: {
          name: req.body.folder,
          owner_id: +(req.user as User).id,
          parentFolderId: parentFolder.id,
        },
      });

      res.redirect(`/drive/folder/${parentFolder.id}`);
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

        req.session.alerts = alerts;

        return res.redirect('/drive');
      }

      const { id } = req.params;
      const folderForDeletion = await prisma.folder.findFirst({
        where: {
          id: +id,
          owner_id: (req.user as User).id,
        },
      });

      if (!folderForDeletion)
        return next(new Error404('Folder with such id does not exist.'));

      // Get all files for the folder and subfolders of that folder

      const deletedFiles = await getAllFilesInFolderRecursively(
        folderForDeletion.id,
      );

      // Delete all related files from uploads/
      (deletedFiles as File[]).forEach(async (f) => {
        const filePath = path.resolve(process.cwd(), f.path);
        if (existsSync(filePath)) await unlink(filePath);

        if (f.cloudinary_public_id) {
          const { result } = await cloudinary.uploader.destroy(
            f.cloudinary_public_id,
          );
          if (result !== 'ok') {
            const alert = new Alert(
              'error',
              `Failed to delete file ${f.name}`,
              '',
            );

            req.session.alerts = [alert];

            return res.redirect(`/drive/folder/${f.parentFolderId}`);
          }
        }
      });

      await prisma.folder.delete({
        where: { id: folderForDeletion?.id },
      });

      req.session.alerts = [new Alert('success', 'Folder deleted', '')];

      res.redirect('/drive');
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

        req.session.alerts = alerts;

        return res.redirect('/drive');
      }

      const { id } = req.params;
      const folderForUpdate = await prisma.folder.findFirst({
        where: {
          id: +id,
          owner_id: (req.user as User).id,
        },
      });

      if (!folderForUpdate) {
        const alert = new Alert(
          'error',
          'Failed to update folder name',
          'Folder with such id does not exist',
        );

        req.session.alerts = [alert];

        return res.redirect(`/drive`);
      }

      await prisma.folder.update({
        where: { id: folderForUpdate?.id },
        data: {
          name: req.body.folder,
          updatedAt: new Date(),
        },
      });

      const alert = new Alert('success', 'Folder renamed', '');
      req.session.alerts = [alert];

      return res.redirect(`/drive`);
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
];

/**
 * Get file details page
 * @route GET /drive/folder/:parentFolderId/file/:id
 */
export const getFile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id, parentFolderId } = req.params;

    const file = await prisma.file.findFirst({
      where: {
        id: +id,
        parentFolderId: +parentFolderId,
        owner_id: (req.user as User).id,
      },
      include: {
        user: true,
        parentFolder: true,
      },
    });

    if (!file) return next(new Error404('File does not exist.'));

    res.render('file', { title: file.name, file });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

/**
 * Download file
 * @route GET /drive/folder/:parentFolderId/file/:id/download
 */
export const downloadFile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { parentFolderId, id } = req.params;

    const file = await prisma.file.findFirst({
      where: {
        id: +id,
        parentFolderId: +parentFolderId,
        owner_id: (req.user as User).id,
      },
    });

    if (!file) return next(new Error404('File does not exist'));

    file.name = file.name.replace(/\.[^/.]+$/, file.ext.toLowerCase());

    // Set proper headers
    const contentType = mime.getType(file.name) || 'application/octet-stream';
    const encodedName = encodeURIComponent(file.name);
    const sanitizedName = file.name.replace(/[^\w\s.-]/g, '_');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', file.size.toString());
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${sanitizedName}"; filename*=UTF-8''${encodedName}`,
    );

    if (!file.cloudinary_public_id)
      return next(
        new Error404(
          'File not found on server. Delete this item and try to reupload.',
        ),
      );

    const result = await cloudinary.api.resource(file.cloudinary_public_id);

    const response = await fetch(result.url);

    if (!response.ok) throw new Error('Failed to fetch server asset.');

    response.body?.pipe(res);
  } catch (error) {
    console.error('Download handler error:', error);
    next(error);
  }
};

/**
 * Delete file
 * @route DELETE /drive/folder/:parentFolderId/file/:id
 */
export const deleteFile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id, parentFolderId } = req.params;

    const file = await prisma.file.findFirst({
      where: {
        id: +id,
        parentFolderId: +parentFolderId,
        owner_id: (req.user as User).id,
      },
    });

    if (!file) return next(new Error404('File does not exist.'));

    if (file.cloudinary_public_id) {
      const { result } = await cloudinary.uploader.destroy(
        file.cloudinary_public_id,
      );
      if (result !== 'ok') {
        const alert = new Alert(
          'error',
          `Failed to delete file ${file.name}`,
          'Try again later',
        );

        req.session.alerts = [alert];

        return res.redirect(`/drive/folder/${parentFolderId}`);
      }
    }
    await prisma.file.delete({
      where: {
        id: +id,
      },
    });

    const filePath = path.resolve(process.cwd(), file.path);
    if (existsSync(filePath)) await unlink(filePath);

    const alert = new Alert('success', 'File Deleted', '');

    req.session.alerts = [alert];

    return res.redirect(`/drive/folder/${parentFolderId}`);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

/**
 * Update file name in folder
 * @route PUT /drive/folder/:parentFolderId/file/:id
 */
export const updateFileName = [
  fileNameValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { parentFolderId, id } = req.params;

      const parentFolder = await getUserFolderContents(
        +parentFolderId,
        (req.user as User).id,
      );

      if (!parentFolder)
        return next(new Error404('Folder with such id does not exist.'));

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        const alerts = errors
          .array()
          .map((e) => new Alert('error', 'Failed to update file', e.msg));

        req.session.alerts = alerts;

        return res.redirect(`/drive/folder/${parentFolderId}`);
      }

      const fileForUpdate = parentFolder.files.find((f) => f.id === +id);

      if (!fileForUpdate) return next(new Error404('File does not exist.'));

      const updatedFile = await prisma.file.update({
        where: { id: fileForUpdate.id },
        data: {
          name: req.body.file + fileForUpdate.ext,
          updatedAt: new Date(),
        },
      });

      parentFolder.files.map((f) => {
        if (f.id === fileForUpdate.id) f.name = updatedFile.name;
        return f;
      });

      const alert = new Alert('success', 'File name updated', '');
      req.session.alerts = [alert];

      return res.redirect(`/drive/folder/${parentFolderId}`);
    } catch (error) {
      console.error(error);
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

const getUserFolderContents = async (folderId: number, userId: number) => {
  return await prisma.folder.findFirst({
    where: {
      id: folderId,
      owner_id: userId,
    },
    include: {
      files: true,
      subfolders: true,
      parentFolder: true,
    },
  });
};

const getAllFilesInFolderRecursively = async (folderId: number) =>
  await prisma.$queryRaw`
       WITH RECURSIVE folder_tree as (
         -- (1.) Base case (starting point)
          SELECT id FROM "Folder" WHERE id = ${folderId}

          -- (3.) UNION ALL combines these new rows with the existing results
          UNION ALL

          -- (2.) Recursive part
            -- This joins the Folder table with the current folder_tree results
            -- It finds all folders where parentFolderId matches an ID already in folder_tree
          SELECT f.id FROM "Folder" f
          JOIN folder_tree ft ON f."parentFolderId" = ft.id
          -- (4.) The recursion stops automatically when no new rows are found
            -- SQL engines have safeguards against infinite recursion

       ) select * from "File" WHERE "parentFolderId" IN (SELECT id FROM folder_tree);`;
