import { Request, Response, NextFunction } from 'express';
import prisma from '../db/client';
import Error404 from '../util/errors/Error404';
import Error410 from '../util/errors/Error410';
import { AccessType, User } from '../../generated/prisma';
import Error403 from '../util/errors/Error403';
import mime from 'mime';
import { v2 as cloudinary } from 'cloudinary'; //to work set .env var: CLOUDINARY_URL=cloudinary://my_key:my_secret@my_cloud_name
import fetch from 'node-fetch';
import { createSharedFolderViewModel } from '../viewModels/SharedFolderViewModel';
import { LayoutType } from '../util/LayoutType';
import { check, validationResult } from 'express-validator';
import { Alert } from '../util/Alert';
import { createUserSearchResultsViewModel } from '../viewModels/UserSearchResultsViewModel';

export const handleFolderLink = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { uuid } = req.params;

  const sharedFolder = await prisma.sharedFolder.findFirst({
    where: {
      id: uuid,
    },
    include: {
      folder: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!sharedFolder) return next(new Error404('Shared folder does not exist.'));

  if (new Date() >= sharedFolder.expiresAt) {
    return next(
      new Error410('This link is no longer valid. Please request a new one.'),
    );
  }
  res.locals.sharedFolder = sharedFolder;
  res.locals.sharedFolderOwner = sharedFolder.folder.user;
  next();
};

/**
 * Get Public Folder contents.
 * @route GET /public/:uuid
 */
export const getSharedFolder = async (req: Request, res: Response) => {
  res.redirect(
    `/public/${res.locals.sharedFolder.id}/folder/${res.locals.sharedFolder.folderId}`,
  );
};

/**
 * Get Public Folder subdirectory contents.
 * @route GET /public/:uuid/folder/:id
 */
export const getFolder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;

  const { layout } = req.query;

  if (layout) req.session.layoutType = layout as LayoutType;

  if (+id !== +res.locals.sharedFolder.folderId) {
    const exists = await isFolderSomewhereWithinParent(
      res.locals.sharedFolder.folderId,
      +id,
    );

    if (!exists) return next(new Error404('Folder does not exist'));
  }

  try {
    const currentFolder = await prisma.folder.findFirst({
      where: {
        id: +id,
      },
      include: {
        files: true,
        subfolders: true,
        user: true,
      },
    });

    if (!currentFolder) return next(new Error404('Folder does not exist'));

    const viewModel = createSharedFolderViewModel({
      title: currentFolder.name,
      currentFolder,
      layout: req.session.layoutType ?? 'grid',
      sharedFolder: res.locals.sharedFolder,
      sharedFolderOwner: res.locals.sharedFolderOwner,
      actions: {
        search: `/public/${res.locals.sharedFolder.id}/search`,
      },
      features: {
        canGoBack: currentFolder.id !== res.locals.sharedFolder.folderId,
      },
      urls: {
        rootFolderLink: `/public/${res.locals.sharedFolder.id}`,
        parentFolderLink:
          currentFolder.id === res.locals.sharedFolder.folderId
            ? `/public/${res.locals.sharedFolder.id}`
            : `/public/${res.locals.sharedFolder.id}/folder/${currentFolder.parentFolderId}`,
      },
    });

    return res.render('drive', viewModel);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Get file details page
 * @route GET /public/:uuid/folder/:id/file/:fileId
 */
export const getFile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { fileId, id } = req.params;

    if (+id !== +res.locals.sharedFolder.folderId) {
      const exists = await isFolderSomewhereWithinParent(
        res.locals.sharedFolder.folderId,
        +id,
      );

      if (!exists) return next(new Error404('Folder does not exist'));
    }

    const file = await prisma.file.findFirst({
      where: {
        id: +fileId,
        parentFolderId: +id,
      },
      include: {
        user: true,
        parentFolder: true,
      },
    });

    if (!file) return next(new Error404('File does not exist.'));

    res.render('file', {
      title: file.name,
      file,
      accessType: res.locals.sharedFolder.accessType,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

/**
 * Download file from shared folder
 * @route GET /public/:uuid/folder/:id/file/:fileId/download
 */
export const downloadFile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { fileId, id } = req.params;

    if (+id !== +res.locals.sharedFolder.folderId) {
      const exists = await isFolderSomewhereWithinParent(
        res.locals.sharedFolder.folderId,
        +id,
      );

      if (!exists) return next(new Error404('Folder does not exist'));
    }

    const file = await prisma.file.findFirst({
      where: {
        id: +fileId,
        parentFolderId: +id,
      },
    });

    if (!file) return next(new Error404('File does not exist'));

    if (
      (res.locals.sharedFolder.accessType as AccessType) !== 'PREVIEW_DOWNLOAD'
    )
      return next(
        new Error403(
          'Downloading is not allowed. Ask for a link with "Preview and Download" access rights.',
        ),
      );

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
      return next(new Error404('File not found on server.'));

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
 * Displays search results for a given query.
 * @route GET /public/:uuid/search?q=*
 */
export const getSharedFolderSearch = [
  check('q')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Please enter a search value.'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { alerts } = req.session;
      delete req.session.alerts;
      const { layout, q: searchTerm } = req.query;

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        const alerts = errors.array().map((e) => new Alert('error', '', e.msg));

        req.session.alerts = alerts;

        return res.redirect(`/public/${res.locals.sharedFolder.id}`);
      }

      if (!searchTerm || !searchTerm?.length)
        return next(new Error('No search term provided'));

      if (layout) req.session.layoutType = layout as LayoutType;

      let fileResults = await prisma.file.findMany({
        where: {
          owner_id: (res.locals.sharedFolderOwner as User).id,
          name: {
            contains: searchTerm as string,
          },
        },
      });

      let folderResults = await prisma.folder.findMany({
        where: {
          owner_id: (res.locals.sharedFolderOwner as User).id,
          name: {
            contains: searchTerm as string,
          },
        },
      });

      fileResults = fileResults.filter(
        async (f) =>
          await isFolderSomewhereWithinParent(
            res.locals.sharedFolder.folderId,
            f.parentFolderId,
          ),
      );

      folderResults = folderResults.filter(
        async (f) =>
          await isFolderSomewhereWithinParent(
            res.locals.sharedFolder.folderId,
            f.id,
          ),
      );

      const viewModel = createUserSearchResultsViewModel({
        title: `Search results for: ${searchTerm}`,
        searchTerm: searchTerm as string,
        alerts: alerts
          ? alerts.map((a) => new Alert(a.type, a.title, a.message))
          : [],
        layout: req.session.layoutType ?? 'grid',
        actions: {
          changeToGrid: `/public/${res.locals.sharedFolder.id}/search?q=${searchTerm}&layout=grid`,
          changeToList: `/public/${res.locals.sharedFolder.id}/search?q=${searchTerm}&layout=list`,
          search: `/public/${res.locals.sharedFolder.id}/search`,
        },
        results: {
          files: fileResults,
          folders: folderResults,
        },
        urls: {
          parentFolderLink: `/public/${res.locals.sharedFolder.id}`,
          rootFolderLink: `/public/${res.locals.sharedFolder.id}`,
        },
        currentUser: req.user as User,
        rootFolders: [],
      });

      return res.render('search', viewModel);
    } catch (error) {
      console.error(error);
      next(error);
    }
  },
];

const isFolderSomewhereWithinParent = async (
  parentFolderId: number,
  folderId: number,
) => {
  const result = await prisma.$queryRaw<{ exists: number }[]>`
  WITH RECURSIVE folder_tree AS (
    -- Base case
    SELECT id, "parentFolderId" FROM "Folder" WHERE id = ${folderId}

    UNION ALL

    -- Recursive part
    SELECT f.id, f."parentFolderId"
    FROM "Folder" f
    JOIN folder_tree ft ON f.id = ft."parentFolderId"
  )
  SELECT 1 FROM folder_tree WHERE id = ${parentFolderId} LIMIT 1;
`;
  return result.length > 0;
};
