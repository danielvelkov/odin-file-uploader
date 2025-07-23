import path from 'path';
const MAX_FILE_NAME_LEN = 20;
const MAX_SIZE = 1024 * 1024 * 10; // 10 MB
const ALLOWED_EXTENSIONS = ['.png', '.txt', '.jpeg', '.docx'];
const fileValidation = (file: Express.Multer.File) => {
  const errors: string[] = [];

  if (file.originalname.length > MAX_FILE_NAME_LEN)
    errors.push('Filename should not exceed 20 characters.');

  if (file.size >= MAX_SIZE) errors.push('File size exceeds limit (10 MB).');

  if (
    path.extname(file.originalname).length === 0 ||
    (path.extname(file.originalname).length > 0 &&
      !ALLOWED_EXTENSIONS.includes(path.extname(file.originalname)))
  )
    errors.push(
      'File type not allowed. (Allowed types: ' +
        ALLOWED_EXTENSIONS.join(' , ') +
        ' )',
    );
  return { errors };
};

export default fileValidation;
