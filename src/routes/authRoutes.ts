// src/routes/authRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { uploadAvatar, validateUpload, handleUploadErrors } from '../middlewares/uploadMiddleware';

const router = Router();
const authController = new AuthController();

// Регистрация и вход
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authController.register(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authController.login(req, res);
  } catch (error) {
    next(error);
  }
});

// Защищенные маршруты (требуют авторизации)
router.get('/current-user', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authController.getCurrentUser(req, res);
  } catch (error) {
    next(error);
  }
});

router.put('/update-profile', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authController.updateUser(req, res);
  } catch (error) {
    next(error);
  }
});

// Маршруты для работы с аватаром
router.post(
  '/avatar', 
  authMiddleware, 
  (req: Request, res: Response, next: NextFunction) => {
    uploadAvatar(req, res, (err) => {
      if (err) {
        return handleUploadErrors(err, req, res, next);
      }
      next();
    });
  },
  // Modified validateUpload to be middleware function that doesn't return a value
 (req: Request, res: Response, next: NextFunction) => {
  if (req.fileValidationError) {
    res.status(400).json({ error: req.fileValidationError });
    return;
  }
  
  if (!req.file) {
    res.status(400).json({ error: 'Файл не загружен или имеет неподдерживаемый формат' });
    return;
  }
  
  next();
},
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authController.updateAvatar(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/avatar', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authController.deleteAvatar(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;