// src/utils/setupSandboxTables.ts
import { AppDataSource } from '../config/dataSource';

export async function setupSandboxTables() {
  try {
    // Удаляем существующие демо-таблицы, если они есть
    await AppDataSource.query('DROP TABLE IF EXISTS demo_order_items');
    await AppDataSource.query('DROP TABLE IF EXISTS demo_orders');
    await AppDataSource.query('DROP TABLE IF EXISTS demo_products');
    await AppDataSource.query('DROP TABLE IF EXISTS demo_categories');
    await AppDataSource.query('DROP TABLE IF EXISTS demo_customers');

    // Создаем таблицу категорий
    await AppDataSource.query(`
      CREATE TABLE demo_categories (
        category_id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT
      )
    `);

    // Создаем таблицу продуктов с внешним ключом на категории
    await AppDataSource.query(`
      CREATE TABLE demo_products (
        product_id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock_quantity INT NOT NULL DEFAULT 0,
        category_id INT,
        FOREIGN KEY (category_id) REFERENCES demo_categories(category_id)
      )
    `);

    // Создаем таблицу клиентов
    await AppDataSource.query(`
      CREATE TABLE demo_customers (
        customer_id SERIAL PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создаем таблицу заказов
    await AppDataSource.query(`
      CREATE TABLE demo_orders (
        order_id SERIAL PRIMARY KEY,
        customer_id INT NOT NULL,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending',
        total_amount DECIMAL(10, 2),
        FOREIGN KEY (customer_id) REFERENCES demo_customers(customer_id)
      )
    `);

    // Создаем таблицу элементов заказа
    await AppDataSource.query(`
      CREATE TABLE demo_order_items (
        item_id SERIAL PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price_per_unit DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES demo_orders(order_id),
        FOREIGN KEY (product_id) REFERENCES demo_products(product_id)
      )
    `);

    // Наполняем демо-данными
    await seedSandboxData();

    console.log('Sandbox tables created and seeded successfully');
  } catch (error) {
    console.error('Error setting up sandbox tables:', error);
    throw error;
  }
}

async function seedSandboxData() {
  try {
    // Вставляем категории
    await AppDataSource.query(`
      INSERT INTO demo_categories (name, description) VALUES
      ('Электроника', 'Компьютеры, телефоны и другие устройства'),
      ('Одежда', 'Модная одежда для мужчин и женщин'),
      ('Книги', 'Художественная и нехудожественная литература'),
      ('Спорт', 'Спортивное оборудование и одежда')
    `);

    // Вставляем продукты
    await AppDataSource.query(`
      INSERT INTO demo_products (name, description, price, stock_quantity, category_id) VALUES
      ('Ноутбук Dell XPS 15', 'Мощный ноутбук для профессионалов', 1299.99, 25, 1),
      ('iPhone 14 Pro', 'Последняя модель смартфона от Apple', 999.99, 50, 1),
      ('Механическая клавиатура', 'RGB подсветка, синие переключатели', 89.99, 100, 1),
      ('Футболка хлопковая', 'Качественная футболка из 100% хлопка', 19.99, 200, 2),
      ('Джинсы классические', 'Прямые джинсы темно-синего цвета', 49.99, 75, 2),
      ('Гарри Поттер (полный набор)', 'Все книги о мальчике, который выжил', 120.00, 30, 3),
      ('1984', 'Джордж Оруэлл - классика антиутопии', 15.99, 45, 3),
      ('Гантели 10кг', 'Пара гантелей по 10кг', 59.99, 15, 4),
      ('Беговая дорожка', 'Электрическая беговая дорожка для дома', 599.99, 10, 4)
    `);

    // Вставляем клиентов
    await AppDataSource.query(`
      INSERT INTO demo_customers (first_name, last_name, email, phone, address) VALUES
      ('Иван', 'Иванов', 'ivan@example.com', '+7-900-123-4567', 'Москва, ул. Пушкина, д. 10'),
      ('Мария', 'Петрова', 'maria@example.com', '+7-900-765-4321', 'Санкт-Петербург, пр. Невский, д. 15'),
      ('Алексей', 'Сидоров', 'alex@example.com', '+7-900-111-2222', 'Казань, ул. Баумана, д. 5'),
      ('Елена', 'Козлова', 'elena@example.com', '+7-900-333-4444', 'Новосибирск, ул. Ленина, д. 7')
    `);

    // Вставляем заказы
    await AppDataSource.query(`
      INSERT INTO demo_orders (customer_id, order_date, status, total_amount) VALUES
      (1, '2023-09-15 10:00:00', 'completed', 1389.98),
      (2, '2023-09-20 14:30:00', 'shipped', 135.99),
      (3, '2023-09-25 09:15:00', 'processing', 649.98),
      (4, '2023-09-28 16:45:00', 'pending', 120.00),
      (1, '2023-10-05 11:20:00', 'completed', 69.98)
    `);

    // Вставляем элементы заказов
    await AppDataSource.query(`
      INSERT INTO demo_order_items (order_id, product_id, quantity, price_per_unit) VALUES
      (1, 1, 1, 1299.99),
      (1, 3, 1, 89.99),
      (2, 4, 2, 19.99),
      (2, 5, 1, 49.99),
      (2, 3, 1, 89.99),
      (3, 9, 1, 599.99),
      (3, 8, 1, 59.99),
      (4, 6, 1, 120.00),
      (5, 7, 2, 15.99),
      (5, 4, 2, 19.99)
    `);
  } catch (error) {
    console.error('Error seeding sandbox data:', error);
    throw error;
  }
}