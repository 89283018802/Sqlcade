// src/app.ts
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './config/dataSource';
import authRoutes from './routes/authRoutes';
// Удаляем import queryRoutes from './routes/queryRoutes'
import path from 'path';
import { errorHandler } from './middlewares/errorHandler';
import { seedDatabase } from './utils/seedDataWithTypeORM';
import bodyParser from 'body-parser';
import courseRoutes from './routes/courseRoutes';
import queryRoutes from './routes/queryRoutes';
import { setupSandboxTables } from './utils/setupSandboxTables';
import forumRoutes from './routes/forumRoutes';

// Загрузка переменных окружения
dotenv.config();

// Инициализация приложения
const app = express();
const PORT = process.env.PORT || 3000;

// Корневой маршрут - отдает HTML-страницу
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Маршрут аватарок пользователя
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/courses', courseRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/forum', forumRoutes);

// Статические файлы
app.use(express.static(path.join(__dirname, '../public')));

// API маршруты (должны быть определены ДО catch-all маршрута)
app.use('/api/auth', authRoutes);

// Корневой маршрут
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Catch-all маршрут (должен быть последним)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
// Обработка 404
app.use((req, res) => {
  res.status(404).send('Not Found');
});



// Обработчик ошибок (должен быть после всех маршрутов)
app.use(errorHandler);

// Подключение к базе данных и запуск сервера
const startServer = async () => {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    console.log('Connected to PostgreSQL database');
    
    // Create tables if they don't exist
    await AppDataSource.synchronize();
    console.log('Database schema synchronized');
    await setupSandboxTables();
console.log('Sandbox tables created and seeded');
    // Add test data
    await seedDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
};

startServer();