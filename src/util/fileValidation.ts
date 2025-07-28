import path from 'path';
import { escape } from 'validator';

export const MAX_FILE_NAME_LEN = 64;

export const MAX_SIZE = 1024 * 1024 * 10; // 10 MB

export const ALLOWED_EXTENSIONS = [
  '.png',
  '.txt',
  '.jpeg',
  '.docx',
  '.gif',
  '.jpg',
];

const fileValidation = (file: Express.Multer.File) => {
  const errors: string[] = [];

  if (path.parse(file.originalname).name.length > MAX_FILE_NAME_LEN)
    errors.push('Filename should not exceed 20 characters.');

  file.originalname = escape(file.originalname);

  if (path.parse(file.originalname).name.length > MAX_FILE_NAME_LEN)
    errors.push(
      `Escaped file name exceeds length limit (${MAX_FILE_NAME_LEN}).\r\n Replace any of those <, >, &, ', ", \`, \\ , / characters.`,
    );

  if (
    path.extname(file.originalname).length === 0 ||
    (path.extname(file.originalname).length > 0 &&
      !ALLOWED_EXTENSIONS.includes(
        path.extname(file.originalname).toLowerCase(),
      ))
  )
    errors.push(
      `File type ${path.extname(file.originalname).toLowerCase()} not accepted. (Allowed types:
        ${ALLOWED_EXTENSIONS.join(' , ')} )`,
    );
  return { errors };
};

export default fileValidation;
