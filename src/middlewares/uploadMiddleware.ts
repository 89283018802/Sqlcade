// src/middlewares/uploadMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Создаем папку для загрузки аватаров, если она не существует
const uploadDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка хранилища файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Генерируем уникальное имя файла, сохраняя расширение
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Функция проверки типа файла
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // Проверяем MIME тип файла
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    req.fileValidationError = 'Разрешены только изображения';
    cb(null, false);
  }
};

// Создаем middleware multer с ограничениями
export const uploadAvatar = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter
}).single('avatar'); // 'avatar' - имя поля формы

// Middleware для проверки загрузки файла
export const validateUpload = (req: Request, res: Response, next: NextFunction): void => {
  if (req.fileValidationError) {
    res.status(400).json({ error: req.fileValidationError });
    return; // Don't call next()
  }
  
  if (!req.file) {
    res.status(400).json({ error: 'Файл не загружен или имеет неподдерживаемый формат' });
    return; // Don't call next()
  }
  
  next();
};

// Middleware для обработки ошибок Multer
export const handleUploadErrors = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Размер файла не должен превышать 5MB' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Расширяем интерфейс Request для добавления нашего свойства
declare global {
  namespace Express {
    interface Request {
      fileValidationError?: string;
    }
  }
}