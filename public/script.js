document.addEventListener('DOMContentLoaded', function() {
    // Инициализация страниц
    initPages();

    // Инициализация модального окна авторизации/регистрации
    initAuthModal();

    // Инициализация SQL песочницы
    initSQLPlayground();

    // Инициализация курсов
    initCourses();

    // Инициализация профиля
    initProfile();

    // Анимация кнопок
    animateButtons();

    syncUserProgress();
    

    // Инициализация кнопки "Начать обучение"
    initHeroButton();
	
	 initMobileMenu();

	updateLoginButton();

// Добавление новой структуры для карточек курсов
function updateCourseCards() {
    document.querySelectorAll('.course-card').forEach(card => {
        // Сохраняем содержимое
        const title = card.querySelector('h3').outerHTML;
        const badge = card.querySelector('.course-badge') ? card.querySelector('.course-badge').outerHTML : '';
        const description = card.querySelector('.course-description').outerHTML;
        const meta = card.querySelector('.course-meta') ? card.querySelector('.course-meta').outerHTML : '';
        const progress = card.querySelector('.progress-container').outerHTML;
        const button = card.querySelector('.pixel-btn').outerHTML;
        
        // Обновляем структуру
        card.innerHTML = `
            <div class="course-card-header">
                ${badge}
            </div>
            <div class="course-card-body">
                ${title}
                ${description}
                ${progress}
                <div class="course-card-meta">
                    ${meta || '<span><i class="fas fa-book-open"></i> Интерактивный курс</span>'}
                </div>
                ${button}
            </div>
        `;
    });
}

    // Инициализация анимации кнопок
    animateButtons();

    // Демонстрационный запрос при первом запуске
    if (!localStorage.getItem('firstLaunchDone')) {
        editor.setValue(`SELECT 
    id, 
    name, 
    email, 
    created_at 
FROM users 
WHERE status = 'active' 
ORDER BY created_at DESC 
LIMIT 10;`);
        localStorage.setItem('firstLaunchDone', 'true');
    }
});
// Обновляем аватар пользователя
function updateAvatar() {
    const userAvatar = document.getElementById('user-avatar');
    if (!userAvatar) return;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    console.log('Updating avatar, avatarUrl:', currentUser.avatarUrl); // Для отладки
    
    if (currentUser.avatarUrl) {
        // Очищаем контейнер перед добавлением изображения
        userAvatar.innerHTML = '';
        
        // Создаем новый элемент img
        const img = document.createElement('img');
        img.src = currentUser.avatarUrl;
        img.alt = currentUser.username;
        
        // Добавляем изображение в контейнер
        userAvatar.appendChild(img);
        userAvatar.classList.add('has-avatar');
        userAvatar.style.backgroundColor = 'transparent';
    } else {
        // Если аватара нет, отображаем первую букву имени
        userAvatar.innerHTML = '';
        userAvatar.textContent = currentUser.username.charAt(0).toUpperCase();
        userAvatar.classList.remove('has-avatar');
        userAvatar.style.backgroundColor = 'var(--pixel-blue)';
    }
}

// Инициализация загрузки аватара
function initAvatarUpload() {
    const avatarUpload = document.getElementById('avatar-upload');
    const removeAvatarBtn = document.getElementById('remove-avatar');
    
    if (!avatarUpload || !removeAvatarBtn) return;
    
    // Обработчик загрузки нового аватара
    avatarUpload.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Проверка типа файла
        if (!file.type.startsWith('image/')) {
            showMessage('Пожалуйста, выберите изображение', 'error');
            return;
        }
        
        // Проверка размера файла (макс. 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showMessage('Размер файла не должен превышать 5MB', 'error');
            return;
        }
        
        // Создаем FormData для отправки файла
        const formData = new FormData();
        formData.append('avatar', file);
        
        // Показываем индикатор загрузки
        const userAvatar = document.getElementById('user-avatar');
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'avatar-loading';
        loadingIndicator.innerHTML = '<i class="fas fa-spinner"></i>';
        userAvatar.appendChild(loadingIndicator);
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showMessage('Требуется авторизация', 'error');
                userAvatar.removeChild(loadingIndicator);
                return;
            }
            
            const response = await fetch('/api/auth/avatar', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка при загрузке аватара');
            }
            
            // Обновляем данные пользователя
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            currentUser.avatarUrl = data.avatarUrl;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Обновляем отображение аватара
            updateAvatar();
            showMessage('Аватар успешно обновлен', 'success');
        } catch (error) {
            console.error('Ошибка при загрузке аватара:', error);
            showMessage(error.message || 'Ошибка при загрузке аватара', 'error');
        } finally {
            // Удаляем индикатор загрузки
            if (userAvatar.contains(loadingIndicator)) {
                userAvatar.removeChild(loadingIndicator);
            }
            
            // Сбрасываем input file
            avatarUpload.value = '';
        }
    });
    
    // Обработчик удаления аватара
    removeAvatarBtn.addEventListener('click', async function() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showMessage('Требуется авторизация', 'error');
                return;
            }
            
            // Показываем индикатор загрузки
            const userAvatar = document.getElementById('user-avatar');
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'avatar-loading';
            loadingIndicator.innerHTML = '<i class="fas fa-spinner"></i>';
            userAvatar.appendChild(loadingIndicator);
            
            const response = await fetch('/api/auth/avatar', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка при удалении аватара');
            }
            
            // Обновляем данные пользователя
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            currentUser.avatarUrl = null;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Обновляем отображение аватара
            updateAvatar();
            showMessage('Аватар успешно удален', 'success');
        } catch (error) {
            console.error('Ошибка при удалении аватара:', error);
            showMessage(error.message || 'Ошибка при удалении аватара', 'error');
        } finally {
            // Удаляем индикатор загрузки
            const userAvatar = document.getElementById('user-avatar');
            const loadingIndicator = userAvatar.querySelector('.avatar-loading');
            if (loadingIndicator) {
                userAvatar.removeChild(loadingIndicator);
            }
        }
    });
}

// ========== Основные функции ==========

function initPages() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
	// Инициализация скрытой страницы курса
    const coursePage = document.getElementById('course');
    if (coursePage) {
        coursePage.classList.remove('active');
    }
    // Скрываем ссылку на курс по умолчанию
const courseLink = document.querySelector('.nav-link[data-page="course"]');
if (courseLink) {
    courseLink.style.display = 'none';
}
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Удаляем активный класс у всех ссылок и страниц
            navLinks.forEach(l => l.classList.remove('active'));
            pages.forEach(page => page.classList.remove('active'));
            
            // Добавляем активный класс текущей ссылке
            this.classList.add('active');
            
            // Показываем соответствующую страницу
            const pageId = this.getAttribute('data-page');
            document.getElementById(pageId).classList.add('active');
            
            // Прокрутка вверх
            window.scrollTo(0, 0);
        });
    });
}

function initHeroButton() {
    const heroBtn = document.querySelector('.hero-btn');
    if (heroBtn) {
        heroBtn.addEventListener('click', function() {
            // Переход на страницу курсов
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            
            document.querySelector('.nav-link[data-page="courses"]').classList.add('active');
            document.getElementById('courses').classList.add('active');
            
            window.scrollTo(0, 0);
        });
    }
}

// ========== Модальное окно авторизации ==========

function initAuthModal() {
    // Проверяем, не добавлено ли уже модальное окно
    if (!document.getElementById('authModal')) {
        // Создаем модальное окно
        createAuthModal();
    }

    // Находим кнопку входа
    const loginBtn = document.querySelector('.login-btn');
    if (!loginBtn) {
        console.error('Кнопка входа не найдена');
        return;
    }

    // Обработчики событий для кнопки входа
    loginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Проверяем, вошел ли пользователь
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));

        if (currentUser) {
            console.log("User logged in, navigating to profile page.");
            navigateToProfile();
        } else {
            // Если пользователь не вошел, показываем модальное окно
            showAuthModal();
        }
    });
}

// Новая функция для настройки обработчиков форм
function setupAuthFormHandlers() {
    console.log("Setting up auth form handlers");
    
    // Форма регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        console.log("Register form found, adding handler");
        registerForm.removeEventListener('submit', handleRegisterSubmit); // Удаляем старый обработчик
        registerForm.addEventListener('submit', handleRegisterSubmit);
    } else {
        console.error("Register form not found!");
    }
    
    // Форма входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log("Login form found, adding handler");
        loginForm.removeEventListener('submit', handleLoginSubmit); // Удаляем старый обработчик
        loginForm.addEventListener('submit', handleLoginSubmit);
    } else {
        console.error("Login form not found!");
    }
}

// Обработчик отправки формы регистрации
async function handleRegisterSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showAuthMessage(data.error || 'Ошибка при регистрации', 'error');
            return;
        }
        
        // Добавляем пустой массив курсов для нового пользователя
        const userData = {
            ...data.user,
            courses: [],
            level: 1,
            xp: 0
        };
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        showAuthMessage('Регистрация прошла успешно!', 'success');
        updateProfile();
        hideAuthModal();
        updateLoginButton();
        
        // Перезагружаем страницу для корректного обновления всех компонентов
        window.location.reload();
    } catch (error) {
        console.error('Ошибка:', error);
        showAuthMessage('Ошибка при регистрации', 'error');
    }
}
// Функция для отправки данных формы на API
function submitForm(event) {
    // Предотвращаем стандартную отправку формы
    event.preventDefault();
    
    // Получаем данные формы
    const form = document.getElementById('clientForm');
    const formData = new FormData(form);
    
    // Преобразуем FormData в обычный объект JavaScript
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });
    
    // Отправляем данные на API
    fetch('https://api.prosoft31.ru/salespartner/crm/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при отправке данных');
        }
        return response.json();
    })
    .then(data => {
        console.log('Успешно:', data);
        alert('Данные успешно отправлены!');
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при отправке данных');
    });
}

// Функция инициализации обработчиков событий
function initializeFormHandlers() {
    const form = document.getElementById('clientForm');
    if (form) {
        form.addEventListener('submit', submitForm);
    } else {
        console.error('Форма не найдена');
    }
}

// Вызываем инициализацию после загрузки DOM
document.addEventListener('DOMContentLoaded', initializeFormHandlers);

// Обработчик отправки формы входа
async function handleLoginSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showAuthMessage(data.error || 'Неверное имя пользователя или пароль', 'error');
            return;
        }
        
        // Сохраняем токен
        localStorage.setItem('token', data.token);
        
        // Получаем прогресс курсов с сервера
        const progressResponse = await fetch('/api/courses/user-courses', {
            headers: {
                'Authorization': `Bearer ${data.token}`
            }
        });
        
        if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            
            // Сохраняем информацию о пользователе с данными прогресса
            const userData = {
                ...data.user,
                courses: progressData.courses || []
            };
            
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            showAuthMessage('Вход выполнен успешно!', 'success');
            
            // Обновляем интерфейс
            updateProfile();
            updateCoursesProgressUI(); // Добавьте эту функцию для обновления карточек курсов
            hideAuthModal();
            updateLoginButton();
            
            window.location.reload();
        } else {
            // Даже если не удалось получить прогресс, все равно выполняем вход
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            showAuthMessage('Вход выполнен успешно, но не удалось загрузить прогресс курсов', 'success');
            hideAuthModal();
            updateLoginButton();
            window.location.reload();
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showAuthMessage('Ошибка при входе', 'error');
    }
}

function createAuthModal() {
    // Создаем модальное окно
    const modalHTML = `
        <div class="auth-modal" id="authModal" style="display: none;">
            <div class="auth-modal-content pixel-border-lg">
                <span class="close-modal"></span>
                
                <div class="auth-tabs">
                    <div class="auth-tab active" id="registerTab" data-tab="register">Регистрация</div>
                    <div class="auth-tab" id="loginTab" data-tab="login">Вход</div>
                </div>
                
                <div class="auth-forms">
                    <form id="registerForm" class="auth-form active" data-form="register">
                        <div class="form-group">
                            <label for="regUsername">Имя пользователя</label>
                            <input type="text" id="regUsername" name="username" required class="pixel-input">
                        </div>
                        <div class="form-group">
                            <label for="regEmail">Email</label>
                            <input type="email" id="regEmail" name="email" required class="pixel-input">
                        </div>
                        <div class="form-group">
                            <label for="regPassword">Пароль</label>
                            <input type="password" id="regPassword" name="password" required class="pixel-input">
                        </div>
                        <button type="submit" class="pixel-btn">Зарегистрироваться</button>
                    </form>
                    
                    <form id="loginForm" class="auth-form" data-form="login">
                        <div class="form-group">
                            <label for="loginEmail">Email или имя пользователя</label>
                            <input type="text" id="loginEmail" name="username" required class="pixel-input">
                        </div>
                        <div class="form-group">
                            <label for="loginPassword">Пароль</label>
                            <input type="password" id="loginPassword" name="password" required class="pixel-input">
                        </div>
                        <button type="submit" class="pixel-btn">Войти</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Добавляем модальное окно в body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // ВАЖНО: настраиваем обработчики ПОСЛЕ добавления в DOM
    setupAuthFormHandlers();
    setupModalCloseHandlers();
    
    // Переключение между вкладками
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            
            this.classList.add('active');
            const formId = this.getAttribute('data-tab');
            document.querySelector(`.auth-form[data-form="${formId}"]`).classList.add('active');
        });
    });
}

// Новая функция для настройки обработчиков закрытия модального окна
function setupModalCloseHandlers() {
    console.log("Setting up modal close handlers");
    
    // Кнопка закрытия (крестик)
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        console.log("Close button found, adding handler");
        
        // Удаляем все старые обработчики
        const newCloseBtn = closeModalBtn.cloneNode(true);
        closeModalBtn.parentNode.replaceChild(newCloseBtn, closeModalBtn);
        
        // Добавляем новый обработчик
        newCloseBtn.addEventListener('click', function(e) {
            console.log('Close button clicked!');
            e.preventDefault();
            e.stopPropagation();
            hideAuthModal();
        });
    } else {
        console.error("Close button not found!");
    }
    
    // Закрытие при клике вне модального окна
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.addEventListener('click', handleModalBackdropClick);
    }
    
    // Закрытие по клавише Escape
    document.addEventListener('keydown', handleEscapeKey);
}

// Обработчик клика по фону модального окна
function handleModalBackdropClick(e) {
    if (e.target === e.currentTarget) { // Клик именно по фону, а не по содержимому
        hideAuthModal();
    }
}

// Обработчик клавиши Escape
function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('authModal');
        if (modal && modal.style.display === 'flex') {
            hideAuthModal();
        }
    }
}

function showMessage(message, type = 'info') {
    // Создаем элемент для сообщения
    const messageElement = document.createElement('div');
    messageElement.className = `message-popup ${type}-message`;
    messageElement.innerHTML = `
        <div class="message-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Добавляем на страницу
    document.body.appendChild(messageElement);
    
    // Показываем сообщение с анимацией
    setTimeout(() => {
        messageElement.classList.add('visible');
    }, 10);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        messageElement.classList.remove('visible');
        setTimeout(() => {
            if (messageElement.parentNode) {
                document.body.removeChild(messageElement);
            }
        }, 300);
    }, 3000);
}
function showAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Убеждаемся, что обработчики установлены
        if (!modal.dataset.handlersSet) {
            setupAuthFormHandlers();
            setupModalCloseHandlers();
            modal.dataset.handlersSet = 'true';
        }
    } else {
        console.error('Модальное окно не найдено');
    }
}

function hideAuthModal() {
    console.log('Hiding auth modal');
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        console.log('Modal hidden successfully');
    } else {
        console.error('Modal not found when trying to hide');
    }
}

function showAuthMessage(text, type) {
    const message = document.createElement('div');
    message.className = `auth-message ${type}-message`;
    message.innerHTML = `<i class="fas fa-${type === 'error' ? 'times-circle' : 'check-circle'}"></i> ${text}`;
    
    const forms = document.querySelector('.auth-forms');
    const existingMessage = document.querySelector('.auth-message');
    if (existingMessage) {
        forms.removeChild(existingMessage);
    }
    
    forms.insertBefore(message, forms.firstChild);
    
    // Автоматическое скрытие сообщения
    setTimeout(() => {
        if (message.parentNode) {
            forms.removeChild(message);
        }
    }, 5000);
}

function navigateToProfile() {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const profileLink = document.querySelector('.nav-link[data-page="profile"]');
    const profilePage = document.getElementById('profile');
    
    // Проверяем наличие элементов перед обращением к ним
    if (profileLink) profileLink.classList.add('active');
    if (profilePage) profilePage.classList.add('active');

    window.scrollTo(0, 0);
    
    // Обновляем аватар при переходе на страницу профиля
    updateAvatar();
}
// ========== Профиль пользователя ==========

function initProfile() {
    updateProfile();
    updateAvatar();
}

async function updateProfile() {
    const profileContainer = document.querySelector('.profile-container');
    if (!profileContainer) return;
    
    const token = localStorage.getItem('token');
    
    if (!token) {
        // Код для неавторизованного пользователя остаётся без изменений
      profileContainer.innerHTML = `
    <div class="not-logged-in">
        <h3>Профиль</h3>
        <p>Войдите или зарегистрируйтесь, чтобы просмотреть свой профиль</p>
        <button class="pixel-btn login-btn profile-login-btn">
            <i class="fas fa-key pixel-icon"></i> Войти
        </button>
    </div>
`;

        const loginBtn = profileContainer.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showAuthModal();
            });
        }

        return;
    }
    
    try {
        // Используем данные из localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!currentUser) {
            localStorage.removeItem('token');
            updateProfile();
            return;
        }
        
        // Рассчитываем статистику курсов
        const startedCourses = currentUser.courses ? currentUser.courses.length : 0;
        const completedCourses = currentUser.courses ? currentUser.courses.filter(c => c.completed).length : 0;
        
         // Создаем HTML для профиля с полной информацией
        profileContainer.innerHTML = `
            <div class="profile-layout">
                <div class="profile-sidebar">
                    <div class="avatar-container">
                        <div class="user-avatar" id="user-avatar">
                           ${currentUser.username.charAt(0).toUpperCase()}
                        </div>
                        <div class="avatar-upload-controls">
                            <label for="avatar-upload" class="pixel-btn small-btn">
                                <i class="fas fa-upload pixel-icon"></i> Загрузить аватар
                            </label>
                            <input type="file" id="avatar-upload" accept="image/*" style="display:none">
                            <button id="remove-avatar" class="pixel-btn small-btn clear-btn">
                                <i class="fas fa-trash pixel-icon"></i> Удалить
                            </button>
                        </div>
                        <h3 class="user-name">${currentUser.username}</h3>
                    </div>
                    
                    <div class="level-progress">
                        <div class="level-info">
                            <span class="level-label">Уровень ${currentUser.level || 1}</span>
                            <span class="xp-text">${currentUser.xp || 0} XP</span>
                        </div>
                        <div class="xp-bar">
                            <div class="xp-progress" style="width: ${calculateXPPercentage(currentUser)}%"></div>
                        </div>
                    </div>
                    
                    <div class="course-stats">
                        <div class="stat-item">
                            <i class="fas fa-book"></i>
                            <div class="stat-content">
                                <p class="stat-value">${startedCourses}</p>
                                <p class="stat-label">Начато курсов</p>
                            </div>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-graduation-cap"></i>
                            <div class="stat-content">
                                <p class="stat-value">${completedCourses}</p>
                                <p class="stat-label">Завершено</p>
                            </div>
                        </div>
                    </div>
                    
                    <button class="pixel-btn clear-btn logout-btn" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Выйти
                    </button>
                </div>
                
                <div class="profile-content">
                    <h2 class="section-title">Мои курсы</h2>
                    ${generatePixelCourseCards(currentUser.courses)}
                </div>
            </div>
        `;
        
        // Инициализируем функциональность загрузки аватара
        updateAvatar();
        initAvatarUpload();
        
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        showMessage('Ошибка загрузки профиля', 'error');
    }
}

// Вспомогательная функция для расчета процента XP до следующего уровня
function calculateXPPercentage(user) {
    const level = user.level || 1;
    const xp = user.xp || 0;
    const xpToNextLevel = level * 1000;
    
    return Math.min(100, Math.round((xp / xpToNextLevel) * 100));
}

async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Требуется авторизация');
    }
    
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    
    const mergedOptions = { 
        ...defaultOptions, 
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    const response = await fetch(url, mergedOptions);
    
    // Если возвращается 401, значит токен недействителен
    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        showMessage('Сессия истекла. Пожалуйста, войдите снова.', 'error');
        // Перенаправляем на главную страницу
        document.querySelector('.nav-link[data-page="home"]').click();
        return null;
    }
    
    return response;
}

// Функция для генерации сот с курсами
function generateHoneycombCourses(courses) {
    if (!courses || courses.length === 0) {
        return '<p class="no-courses-message">У вас еще нет начатых курсов</p>';
    }
    
    // Получаем полные данные о курсах
    const allCourses = JSON.parse(localStorage.getItem('courses')) || [];
    
    return courses.map(userCourse => {
        const courseInfo = allCourses.find(c => c.id === userCourse.id) || {};
        const progressClass = userCourse.completed ? 'completed' : 
                              userCourse.progress > 50 ? 'in-progress' : 'started';
        
        return `
            <div class="honeycomb-cell ${progressClass}" data-course-id="${userCourse.id}">
                <div class="honeycomb-content">
                    <h4 class="course-title">${courseInfo.title || userCourse.title}</h4>
                    <div class="hexagon-progress">
                        <div class="hex-progress-bar">
                            <div class="hex-progress" style="width: ${userCourse.progress}%"></div>
                        </div>
                        <span class="progress-text">${userCourse.progress}%</span>
                    </div>
                    ${userCourse.completed ? '<div class="completed-badge"><i class="fas fa-check"></i></div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Функция для генерации пиксельных карточек курсов вместо сот
function generatePixelCourseCards(courses) {
    if (!courses || courses.length === 0) {
        return '<p class="no-courses-message">У вас еще нет начатых курсов</p>';
    }
    
    // Получаем полные данные о курсах
    const allCourses = JSON.parse(localStorage.getItem('courses')) || [];
    
    return `<div class="pixel-courses-grid">
        ${courses.map(userCourse => {
            const courseInfo = allCourses.find(c => c.id === userCourse.id) || {};
            const progressClass = userCourse.completed ? 'completed' : 
                                userCourse.progress > 50 ? 'in-progress' : 'started';
            const iconClass = userCourse.completed ? 'fa-trophy' : 
                             userCourse.progress > 50 ? 'fa-code' : 'fa-book-open';
            
            return `
                <div class="pixel-course-card ${progressClass}" data-course-id="${userCourse.id}">
                    <i class="fas ${iconClass} pixel-icon"></i>
                    <h4 class="pixel-course-title">${courseInfo.title || userCourse.title}</h4>
                    <div class="pixel-progress-container">
                        <div class="pixel-progress-bar">
                            <div class="pixel-progress-fill" style="width: ${userCourse.progress}%"></div>
                            <span class="pixel-progress-text">${userCourse.progress}%</span>
                        </div>
                    </div>
                    ${userCourse.completed ? '<div class="pixel-completion-badge"><i class="fas fa-check"></i></div>' : ''}
                </div>
            `;
        }).join('')}
    </div>`;
}

function logout() {
    // Удаление токена и информации о пользователе
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    
    // Возвращаем кнопку входа
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.innerHTML = '<i class="fas fa-key pixel-icon"></i> Войти';
        loginBtn.classList.remove('profile-btn');
    }
    
    // Обновляем профиль
    updateProfile();
    
    // Показываем сообщение
    showMessage('Вы успешно вышли из системы', 'success');
}
// ========== Курсы ==========

function initCourses() {
    const coursesContainer = document.querySelector('.course-cards');
    if (!coursesContainer) return;
    
    // Данные курсов
    const coursesData = [
       {
            id: 1,
            title: "Основы SQL",
            description: "Полное погружение в основы языка SQL",
            lessons: [
                {id: 1, title: "Введение в реляционные БД", duration: "15 мин"},
                {id: 2, title: "Создание таблиц (CREATE TABLE)", duration: "20 мин"},
                {id: 3, title: "Типы данных SQL", duration: "25 мин"},
                {id: 4, title: "CRUD операции: основы", duration: "30 мин"},
                {id: 5, title: "CRUD операции: SELECT", duration: "25 мин"},
                {id: 6, title: "CRUD операции: INSERT", duration: "20 мин"},
                {id: 7, title: "CRUD операции: UPDATE", duration: "25 мин"},
                {id: 8, title: "CRUD операции: DELETE", duration: "20 мин"},
                {id: 9, title: "Ограничения (CONSTRAINTS)", duration: "30 мин"},
                {id: 10, title: "Первичные ключи", duration: "25 мин"},
                {id: 11, title: "Внешние ключи", duration: "30 мин"},
                {id: 12, title: "Индексы (CREATE INDEX)", duration: "25 мин"},
                {id: 13, title: "Импорт/экспорт данных", duration: "30 мин"},
                {id: 14, title: "Нормализация данных", duration: "35 мин"},
                {id: 15, title: "Оптимизация простых запросов", duration: "30 мин"},
                {id: 16, title: "Практика: Проектирование БД", duration: "45 мин"}
            ],
            isNew: true
        },
        {
            id: 2,
            title: "Продвинутые техники",
            description: "Углубленное изучение возможностей SQL",
            lessons: [
                {id: 1, title: "INNER JOIN: основы", duration: "30 мин"},
                {id: 2, title: "LEFT и RIGHT JOIN", duration: "30 мин"},
                {id: 3, title: "FULL и CROSS JOIN", duration: "25 мин"},
                {id: 4, title: "Сложные JOIN операции", duration: "35 мин"},
                {id: 5, title: "Подзапросы: основы", duration: "30 мин"},
                {id: 6, title: "Коррелированные подзапросы", duration: "35 мин"},
                {id: 7, title: "Оконные функции: основы", duration: "30 мин"},
                {id: 8, title: "Оконные функции: агрегации", duration: "35 мин"},
                {id: 9, title: "Оконные функции: ранжирование", duration: "30 мин"},
                {id: 10, title: "CTE (Common Table Expressions)", duration: "35 мин"},
                {id: 11, title: "Рекурсивные запросы", duration: "40 мин"},
                {id: 12, title: "Динамический SQL", duration: "30 мин"},
                {id: 13, title: "Хранимые процедуры", duration: "35 мин"},
{id: 14, title: "Триггеры в SQL", duration: "30 мин"},
{id: 15, title: "Пользовательские функции", duration: "35 мин"},
{id: 16, title: "Транзакции и уровни изоляции", duration: "40 мин"},
{id: 17, title: "Индексы: основы и применение", duration: "45 мин"},
{id: 18, title: "Оптимизация запросов", duration: "50 мин"},
{id: 19, title: "Работа с JSON данными", duration: "35 мин"},
{id: 20, title: "Полнотекстовый поиск", duration: "40 мин"}

            ],
            isNew: false
        },
        {
           id: 3,
title: "Python для анализа данных",
description: "Изучите библиотеки Python для эффективного анализа данных и визуализации.",
price: 12900,
duration: "14 недель",
lessons: [
{id: 1, title: "Введение в Python для анализа данных", duration: "40 мин"},
{id: 2, title: "Основы NumPy", duration: "45 мин"},
{id: 3, title: "Введение в pandas: Series и DataFrame", duration: "50 мин"},
{id: 4, title: "Загрузка и сохранение данных с pandas", duration: "35 мин"},
{id: 5, title: "Индексация и выборка данных", duration: "45 мин"},
{id: 6, title: "Обработка отсутствующих данных", duration: "40 мин"},
{id: 7, title: "Группировка и агрегация данных", duration: "50 мин"},
{id: 8, title: "Слияние и объединение данных", duration: "45 мин"},
{id: 9, title: "Временные ряды в pandas", duration: "55 мин"},
{id: 10, title: "Введение в визуализацию с matplotlib", duration: "40 мин"},
{id: 11, title: "Продвинутая визуализация с seaborn", duration: "45 мин"},
{id: 12, title: "Интерактивная визуализация с plotly", duration: "50 мин"},
{id: 13, title: "Статистический анализ с scipy", duration: "45 мин"},
{id: 14, title: "Машинное обучение с scikit-learn: основы", duration: "55 мин"},
{id: 15, title: "Работа с текстовыми данными", duration: "40 мин"},
{id: 16, title: "Web-скрейпинг для сбора данных", duration: "50 мин"},
{id: 17, title: "Автоматизация анализа данных", duration: "45 мин"},
{id: 18, title: "Оптимизация кода Python", duration: "40 мин"},
{id: 19, title: "Большие данные с Dask", duration: "55 мин"},
{id: 20, title: "Создание дашбордов с Dash", duration: "60 мин"}
            ],
            isNew: true
        },
        {
            id: 4,
            title: "SQL для анализа данных",
            description: "Аналитические функции и техники",
            lessons: [
                {id: 1, title: "Агрегация данных", duration: "25 мин"},
                {id: 2, title: "Аналитические функции", duration: "35 мин"},
                {id: 3, title: "Работа с временными рядами", duration: "30 мин"},
                {id: 4, title: "Гео-аналитика", duration: "40 мин"},
                {id: 5, title: "Машинное обучение на SQL", duration: "45 мин"},
                {id: 6, title: "Визуализация результатов", duration: "30 мин"},
                {id: 7, title: "Практика: Аналитический дашборд", duration: "60 мин"},
                {id: 8, title: "Когортный анализ", duration:"35 мин"},
                {id: 9, title:"Расчет метрик продуктовой аналитики" , duration:"40 мин"},
                {id: 10, title:"A/B тестирование на SQL" , duration: "45 мин" },
                {id: 11, title:"Работа с иерархическими данными", duration: "30 мин"},
                {id: 12, title:"Фрод-детекция и поиск аномалий", duration:"35 мин" },
                {id: 13, title:"Сегментация клиентов", duration: "40 мин"},
                {id: 14, title:"Работа с внешними API через SQL", duration: "30 мин"}
            ],
            isNew: true
        },
        {
    id: 5,
    title: "NoSQL и SQL",
    description: "Гибридные подходы в работе с данными",
    lessons: [
        {id: 1, title: "Архитектура гибридных систем", duration: "30 мин"},
        {id: 2, title: "Работа с JSON в SQL", duration: "35 мин"},
        {id: 3, title: "Интеграция с MongoDB", duration: "40 мин"},
        {id: 4, title: "Графовые базы данных", duration: "45 мин"},
        {id: 5, title: "Временные базы данных", duration: "30 мин"},
        {id: 6, title: "Практика: Гибридное решение", duration: "75 мин"},
        {id: 7, title: "Кеширование с Redis и Memcached", duration: "40 мин"},
        {id: 8, title: "Полнотекстовый поиск с Elasticsearch", duration: "50 мин"},
        {id: 9, title: "Миграция данных между SQL и NoSQL", duration: "45 мин"},
        {id: 10, title: "Репликация и синхронизация данных", duration: "40 мин"},
        {id: 11, title: "Оптимизация производительности гибридных систем", duration: "55 мин"}
    ],
    isNew: true
},
		{
        id: 6,
        title: "SQL для аналитики",
        description: "Продвинутые аналитические запросы",
        lessons: [
            {id: 1, title: "Агрегация данных", duration: "25 мин"},
            {id: 2, title: "Оконные функции", duration: "35 мин"},
            {id: 3, title: "Pivot-таблицы", duration: "30 мин"},
            {id: 4, title: "Геоаналитика", duration: "40 мин"},
            {id: 5, title: "Временные ряды", duration: "45 мин"},
            {id: 6, title: "CTE и рекурсивные запросы", duration: "38 мин"},
            {id: 7, title: "Статистические функции и корреляции", duration: "42 мин"}
        ],
        isNew: true
    },
    ];
     const interactiveFeatures = {
        1: {
            8: {
                type: "project",
                task: "Спроектируйте БД для интернет-магазина",
                checklist: [
                    "Минимум 5 связанных таблиц",
                    "Нормализация до 3NF",
                    "Добавьте индексы для частых запросов"
                ],
                schemaPreview: true
            }
        },
        4: {
            7: {
                type: "visualization",
                dataset: "sales_data",
                tools: ["Tableau", "Metabase"],
                requirements: [
                    "3 различных типа графиков",
                    "Интерактивные фильтры",
                    "Автоматическое обновление"
                ]
            }
        }
    };
	
	   localStorage.setItem('courses', JSON.stringify(coursesData));
    localStorage.setItem('interactiveFeatures', JSON.stringify(interactiveFeatures));
    // Сохраняем курсы в localStorage
    localStorage.setItem('courses', JSON.stringify(coursesData));
    
    // Генерация карточек курсов
    coursesData.forEach(course => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const userCourse = currentUser?.courses?.find(c => c.id === course.id);
        const progress = userCourse?.progress || 0;
        
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card pixel-border';
        courseCard.innerHTML = `
            ${course.isNew ? '<div class="course-badge">NEW</div>' : ''}
            <h3>${course.title}</h3>
            <p class="course-description">${course.description}</p>
            <div class="course-meta">
                <span><i class="fas fa-book-open"></i> ${course.lessons.length} уроков</span>
            </div>
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress" style="width: ${progress}%"></div>
                </div>
                <span>${progress}%</span>
            </div>
             <button class="pixel-btn small-btn" data-course-id="${course.id}">
                ${progress > 0 ? 'Продолжить' : 'Начать'}
            </button>
        `;
        
        coursesContainer.appendChild(courseCard);
    });
     updateCoursesProgressUI();
    
 document.querySelectorAll('.course-card .pixel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const courseId = parseInt(this.getAttribute('data-course-id'));
            startCourse(courseId);
            
            // Показываем ссылку на курс в навигации
            const courseNavLink = document.querySelector('.nav-link[data-page="course"]');
            if (courseNavLink) {
                courseNavLink.style.display = 'inline-block';
            }
        });
    });
}

function showMessage(message, type = 'info') {
    // Создаем элемент для сообщения
    const messageElement = document.createElement('div');
    messageElement.className = `message-popup ${type}-message`;
    messageElement.innerHTML = `
        <div class="message-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Добавляем на страницу
    document.body.appendChild(messageElement);
    
    // Показываем сообщение с анимацией
    setTimeout(() => {
        messageElement.classList.add('visible');
    }, 10);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        messageElement.classList.remove('visible');
        setTimeout(() => {
            if (messageElement.parentNode) {
                document.body.removeChild(messageElement);
            }
        }, 300);
    }, 3000);
}

function startCourse(courseId) {
    try {
        console.log('Starting course with ID:', courseId);
        
        // 1. Проверяем/создаём пользователя с правильной структурой
        let currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!currentUser) {
            currentUser = {
                id: 999,
                name: 'Гость',
                email: 'guest@example.com',
                courses: [], // Важно: инициализируем пустым массивом
                level: 1,
                xp: 0
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        // Гарантируем, что массив курсов всегда существует
        if (!currentUser.courses) {
            currentUser.courses = [];
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }

        // 2. Получаем курс
        const courses = JSON.parse(localStorage.getItem('courses')) || [];
        const course = courses.find(c => c.id === courseId);
        
        if (!course) {
            console.error('Курс не найден:', courseId);
            showMessage('Курс не найден', 'error'); // Теперь функция showMessage определена
            return;
        }
        
        // 3. Обновляем данные пользователя
        let userCourseIndex = -1;
        if (currentUser.courses && Array.isArray(currentUser.courses)) {
            userCourseIndex = currentUser.courses.findIndex(c => c.id === courseId);
        }
        
        if (userCourseIndex === -1) {
            if (!currentUser.courses) {
                currentUser.courses = [];
            }
            currentUser.courses.push({
                id: courseId,
                title: course.title,
                progress: 0,
                currentLesson: 1,
                completed: false
            });
            userCourseIndex = currentUser.courses.length - 1;
        }
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // 4. Проверяем существование элементов перед работой с ними
        const navLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.page');
        const courseNavLink = document.querySelector('.nav-link[data-page="course"]');
        const coursePage = document.getElementById('course');
         if (!courseNavLink || !coursePage) {
            throw new Error('Не найдены элементы навигации курса');
        }
		 // Скрываем все страницы
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        // Убираем активность у всех пунктов меню
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
		
        if (navLinks.length && pages.length && courseNavLink && coursePage) {
            navLinks.forEach(l => l.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));
            
            courseNavLink.classList.add('active');
            coursePage.classList.add('active');
        } else {
            console.warn('Не найдены необходимые элементы DOM для навигации');
            // Альтернативный вариант перехода на страницу курса
            window.location.hash = '#course';
        }
         // Показываем страницу курса
        coursePage.classList.add('active');
        courseNavLink.classList.add('active');
        
        // Прокрутка вверх
        window.scrollTo(0, 0);
		
        // 5. Загружаем курс
     loadCourse(courseId);
    } catch (error) {
        console.error('Ошибка в startCourse:', error);
        showMessage('Ошибка загрузки курса: ' + error.message, 'error');
    }
}
// Добавьте функцию для обновления отображения прогресса курсов
function updateCoursesProgressUI() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { courses: [] };
    const courseCards = document.querySelectorAll('.course-card');
    
    courseCards.forEach(card => {
        const courseId = parseInt(card.querySelector('.pixel-btn').getAttribute('data-course-id'));
        const userCourse = currentUser.courses.find(c => c.id === courseId);
        
        if (userCourse) {
            // Обновляем прогресс-бар
            const progressBar = card.querySelector('.progress');
            const progressText = card.querySelector('.progress-container span');
            const progressValue = userCourse.progress || 0;
            
            progressBar.style.width = `${progressValue}%`;
            if (progressText) progressText.textContent = `${progressValue}%`;
            
            // Обновляем текст кнопки
            const button = card.querySelector('.pixel-btn');
            button.textContent = progressValue > 0 ? 'Продолжить' : 'Начать';
        }
    });
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('skip-test')) {
        const testContainer = document.querySelector('.lesson-test');
        if (testContainer) {
            testContainer.style.display = 'none';
            e.target.textContent = 'Далее';
            e.target.classList.remove('skip-test');
        }
    }
});




function resetLessonQuiz() {
    currentQuestionIndex = 0;
    userAnswers = [];
    testStartTime = Date.now();
    displayCurrentQuestion();
}

function hideLessonQuiz() {
    document.getElementById('lesson-test-container').style.display = 'none';
}

function loadCourse(courseId) {
    const coursePage = document.getElementById('course');
    if (!coursePage) {
        console.error('Страница курса не найдена');
        return;
    }
    
    const courses = JSON.parse(localStorage.getItem('courses'));
    const course = courses.find(c => c.id === courseId);
    
    if (!course) return;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userCourse = currentUser?.courses?.find(c => c.id === courseId);
    const currentLesson = userCourse?.currentLesson || 1;
    
    const modules = [];
    let currentModule = [];
    
    course.lessons.forEach((lesson, index) => {
        currentModule.push(lesson);
        
        if (currentModule.length === 4 || index === course.lessons.length - 1) {
            modules.push([...currentModule]);
            currentModule = [];
        }
    });

    function calculateModuleProgress(moduleItems, currentLessonId) {
        const completedCount = moduleItems.filter(item => item.id < currentLessonId).length;
        const isCurrentInModule = moduleItems.some(item => item.id === currentLessonId);
        
        if (isCurrentInModule) {
            return (completedCount * 100) / moduleItems.length;
        } else if (completedCount === moduleItems.length) {
            return 100;
        } else {
            return (completedCount * 100) / moduleItems.length;
        }
    }
    
    // ИСПРАВЛЯЕМ ЛОГИКУ: показываем итоговый тест когда все уроки пройдены
    const allLessonsCompleted = currentLesson > course.lessons.length;
    const showFinalTestLink = currentLesson >= course.lessons.length; // Показываем ссылку когда достигли последнего урока
    
    console.log('Debug info:', {
        courseId,
        currentLesson,
        totalLessons: course.lessons.length,
        allLessonsCompleted,
        showFinalTestLink
    });
    
    coursePage.innerHTML = `
        <div class="course-header pixel-border">
            <h2>${course.title}</h2>
            <div class="course-progress">
                <div class="progress-bar">
                    <div class="progress" style="width: ${userCourse?.progress || 0}%"></div>
                </div>
                <span>${userCourse?.progress || 0}% завершено</span>
            </div>
            <button class="pixel-btn clear-btn back-to-courses">
                <i class="fas fa-arrow-left"></i> К списку курсов
            </button>
        </div>
        
        <div class="course-content">
            <div class="lessons-sidebar pixel-border">
                <h3>Содержание курса</h3>
                <div class="lessons-accordion">
                    ${modules.map((moduleItems, moduleIndex) => `
                        <div class="lesson-accordion-item" data-module="${moduleIndex + 1}">
                            <div class="accordion-header">
                                <span>Модуль ${moduleIndex + 1}</span>
                                <i class="fas fa-chevron-down"></i>
                            </div>
                            <div class="accordion-content">
                                ${moduleItems.map((lesson, lessonIndex) => `
                                    <div class="lesson-item ${currentLesson === lesson.id ? 'active' : ''} 
                                        ${lesson.id < currentLesson ? 'completed' : ''}" 
                                        data-lesson-id="${lesson.id}">
                                        <span class="lesson-number">${moduleIndex * 4 + lessonIndex + 1}.</span>
                                        <span class="lesson-title">${lesson.title}</span>
                                    </div>
                                `).join('')}
                                <div class="module-progress">
                                    <div class="module-progress-bar" style="width: ${calculateModuleProgress(moduleItems, currentLesson)}%"></div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                    
                    <!-- Добавляем итоговый тест как отдельный пункт -->
                    ${showFinalTestLink ? `
                        <div class="final-test-item ${allLessonsCompleted ? 'active' : 'available'}">
                            <div class="final-test-header" onclick="showFinalTest(${courseId})">
                                <i class="fas fa-graduation-cap"></i>
                                <span>Итоговый тест</span>
                                <span class="test-status ${userCourse?.finalTestCompleted ? 'completed' : 'pending'}">
                                    <i class="fas fa-${userCourse?.finalTestCompleted ? 'check' : 'clock'}"></i>
                                </span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="lesson-content pixel-border">
                ${allLessonsCompleted ? 
                    generateFinalTestContent(courseId) : 
                    showFinalTestLink && currentLesson > course.lessons.length ?
                    generateFinalTestContent(courseId) :
                    `
                    <h3>${course.lessons.find(l => l.id === currentLesson)?.title || ''}</h3>
                    <div class="lesson-text">
                        ${generateLessonContent(courseId, currentLesson)}
                    </div>
                    `
                }
                
                <div class="lesson-actions">
                    ${!allLessonsCompleted ? `
                        ${currentLesson > 1 ? `
                            <button class="pixel-btn clear-btn prev-lesson" data-course-id="${courseId}">
                                <i class="fas fa-arrow-left"></i> Назад
                            </button>
                        ` : ''}
                        
                        ${currentLesson < course.lessons.length ? `
                            <button class="pixel-btn next-lesson" data-course-id="${courseId}">
                                Далее <i class="fas fa-arrow-right"></i>
                            </button>
                        ` : `
                            <button class="pixel-btn start-final-test" data-course-id="${courseId}">
                                Перейти к итоговому тесту <i class="fas fa-graduation-cap"></i>
                            </button>
                        `}
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    // Добавляем обработчик для кнопки "Перейти к итоговому тесту"
    document.querySelector('.start-final-test')?.addEventListener('click', function() {
        const courseId = parseInt(this.getAttribute('data-course-id'));
        showFinalTest(courseId);
    });
    
    // Инициализация аккордеона
    const accordionItems = document.querySelectorAll('.lesson-accordion-item');
    
    // Найдем модуль с активным уроком
    const activeModuleIndex = modules.findIndex(moduleItems => 
        moduleItems.some(lesson => lesson.id === currentLesson)
    );
    
    accordionItems.forEach((item, index) => {
        const header = item.querySelector('.accordion-header');
        const content = item.querySelector('.accordion-content');
        
        // По умолчанию открываем модуль с активным уроком
        if (index === activeModuleIndex) {
            item.classList.add('accordion-expanded');
        }
        
        header.addEventListener('click', () => {
            const isExpanded = item.classList.contains('accordion-expanded');
            
            // Закрываем все элементы аккордеона
            accordionItems.forEach(i => i.classList.remove('accordion-expanded'));
            
            // Если элемент не был раскрыт, раскрываем его
            if (!isExpanded) {
                item.classList.add('accordion-expanded');
            }
        });
    });
    
    // Обработка кликов по урокам
    document.querySelectorAll('.lesson-item').forEach(item => {
        item.addEventListener('click', function() {
            const lessonId = parseInt(this.getAttribute('data-lesson-id'));
            if (lessonId <= currentLesson) {
                updateCurrentLesson(courseId, lessonId);
            }
        });
    });
    
    // Обработка кнопок навигации
    document.querySelector('.prev-lesson')?.addEventListener('click', function() {
        updateCurrentLesson(courseId, currentLesson - 1);
    });
    
    document.querySelector('.next-lesson')?.addEventListener('click', function() {
        updateCurrentLesson(courseId, currentLesson + 1);
    });
    
    document.querySelector('.complete-course')?.addEventListener('click', function() {
        completeCourse(courseId);
    });
    
    // Обработка кнопки возврата к списку курсов
    document.querySelector('.back-to-courses')?.addEventListener('click', function() {
        document.querySelector('.nav-link[data-page="courses"]').click();
        document.querySelector('.nav-link[data-page="course"]').style.display = 'none';
    });
    
   document.querySelector('.start-final-test')?.addEventListener('click', function() {
    const courseId = parseInt(this.getAttribute('data-course-id'));
    startFinalTest(courseId);
});
}

function getCurrentCourseId() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const coursePage = document.getElementById('course');
    const backButton = coursePage.querySelector('.back-to-courses');
    
    // Извлекаем ID курса из данных или URL
    const courseId = parseInt(coursePage.dataset.courseId) || 1;
    return courseId;
}

function getCurrentLessonId() {
    const activeLesson = document.querySelector('.lesson-item.active');
    if (activeLesson) {
        return parseInt(activeLesson.dataset.lessonId);
    }
    return 1;
}

// Функция для проверки теста
function checkTest() {
    let correctAnswers = 0;
    const resultContainer = document.querySelector('.test-result');
    resultContainer.innerHTML = '';
    
    currentTestData.forEach((question, index) => {
        const userAnswer = testAnswers[index];
        let isCorrect = false;
        
        if (question.type === 'single') {
            const correctOption = question.options.findIndex(opt => opt.correct);
            isCorrect = userAnswer === correctOption;
            
        } else if (question.type === 'multiple') {
            const correctOptions = question.options
                .map((opt, i) => opt.correct ? i : -1)
                .filter(i => i !== -1);
            
            isCorrect = userAnswer && 
                       userAnswer.length === correctOptions.length &&
                       userAnswer.every(opt => correctOptions.includes(opt));
                       
        } else if (question.type === 'boolean') {
            isCorrect = userAnswer === String(question.correct);
        }
        
        if (isCorrect) {
            correctAnswers++;
        }
    });
    
    const percentage = Math.round((correctAnswers / currentTestData.length) * 100);
    let resultMessage = '';
    let resultClass = '';
    
    if (percentage >= 80) {
        resultMessage = `Отлично! Вы ответили правильно на ${correctAnswers} из ${currentTestData.length} вопросов (${percentage}%)`;
        resultClass = 'test-result-excellent';
    } else if (percentage >= 60) {
        resultMessage = `Хорошо! Вы ответили правильно на ${correctAnswers} из ${currentTestData.length} вопросов (${percentage}%)`;
        resultClass = 'test-result-good';
    } else {
        resultMessage = `Необходимо повторить материал. Вы ответили правильно только на ${correctAnswers} из ${currentTestData.length} вопросов (${percentage}%)`;
        resultClass = 'test-result-poor';
    }
    
    resultContainer.innerHTML = `
        <div class="result-message ${resultClass}">
            <h4>Результат теста</h4>
            <p>${resultMessage}</p>
            <div class="test-actions">
                <button class="pixel-btn" onclick="resetTest()">Пройти еще раз</button>
                <button class="pixel-btn" onclick="hideTest()">Продолжить урок</button>
            </div>
        </div>
    `;
    
    // Скрываем навигацию теста
    document.querySelector('.test-navigation').style.display = 'none';
    
    // Если тест пройден хорошо, добавляем XP
    if (percentage >= 70) {
        addXP(10 * currentTestData.length);
    }
}

// Функция для добавления XP пользователю
function addXP(amount) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    currentUser.xp = (currentUser.xp || 0) + amount;
    
    // Проверяем, не достиг ли пользователь нового уровня
    const xpToNextLevel = currentUser.level * 1000;
    if (currentUser.xp >= xpToNextLevel) {
        currentUser.level += 1;
        currentUser.xp = currentUser.xp - xpToNextLevel;
        showMessage(`Поздравляем! Вы достигли уровня ${currentUser.level}!`, 'success');
    }
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateProfile();
}

// Функция для инициализации навигации курса
function initializeCourseNavigation(courseId, currentLesson, modules, totalLessons) {
    // Обновляем навигацию по урокам
    document.querySelectorAll('.lesson-item').forEach(item => {
        const lessonId = parseInt(item.getAttribute('data-lesson-id'));
        
        // Разрешаем переход только к пройденным урокам и текущему
        if (lessonId <= currentLesson) {
            item.style.cursor = 'pointer';
            item.style.opacity = '1';
        } else {
            item.style.cursor = 'not-allowed';
            item.style.opacity = '0.5';
        }
        
        item.addEventListener('click', function() {
            if (lessonId <= currentLesson) {
                updateCurrentLesson(courseId, lessonId);
            }
        });
    });
}

// Функция для улучшения контента урока
function enhanceLessonContent() {
    // Добавляем подсветку синтаксиса для SQL кода
    const codeBlocks = document.querySelectorAll('pre code, .sql-code');
    codeBlocks.forEach(block => {
        if (!block.classList.contains('highlighted')) {
            highlightSQLCode(block);
            block.classList.add('highlighted');
        }
    });
    
    // Добавляем интерактивные элементы
    const interactiveElements = document.querySelectorAll('.interactive-element');
    interactiveElements.forEach(element => {
        element.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });
}

// Функция для подсветки SQL кода
function highlightSQLCode(element) {
    let code = element.textContent;
    
    // SQL ключевые слова
    const keywords = ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'DISTINCT', 'UNION', 'AND', 'OR', 'NOT', 'NULL', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'INDEX', 'DATABASE', 'SCHEMA'];
    
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        code = code.replace(regex, `<span class="sql-keyword">${keyword}</span>`);
    });
    
    element.innerHTML = code;
}
// Глобальные переменные только для итогового теста
let currentFinalTest = null;
let currentFinalTestAnswers = [];
let currentFinalTestQuestion = 0;


const finalTestsData = {
    1: { // courseId: 1 (Основы SQL)
        title: "Итоговый тест: Основы SQL",
        description: "Проверьте свои знания по всему курсу",
        timeLimit: 45,
        questions: [
            {
                id: 1,
                question: "Что такое реляционная база данных?",
                options: [
                    "База данных, использующая таблицы для хранения данных",
                    "База данных только для текстовых данных",
                    "База данных без структуры",
                    "База данных только для чисел"
                ],
                correct: 0,
                explanation: "Реляционная БД организует данные в виде таблиц, связанных между собой"
            },
            {
                id: 2,
                question: "Какой принцип лежит в основе реляционной модели данных?",
                options: [
                    "Принцип иерархии",
                    "Принцип связей между таблицами через ключи",
                    "Принцип случайного доступа",
                    "Принцип последовательного хранения"
                ],
                correct: 1,
                explanation: "Реляционная модель основана на связях между таблицами через первичные и внешние ключи"
            },
            {
                id: 3,
                question: "Какая команда используется для создания таблицы?",
                options: [
                    "MAKE TABLE",
                    "NEW TABLE",
                    "CREATE TABLE",
                    "ADD TABLE"
                ],
                correct: 2,
                explanation: "CREATE TABLE - стандартная SQL команда для создания новой таблицы"
            },
            {
                id: 4,
                question: "Что обязательно указывается при создании столбца таблицы?",
                options: [
                    "Только имя столбца",
                    "Имя столбца и тип данных",
                    "Только тип данных",
                    "Имя столбца и значение по умолчанию"
                ],
                correct: 1,
                explanation: "При создании столбца обязательно указывается его имя и тип данных"
            },
            {
                id: 5,
                question: "Какой тип данных используется для хранения целых чисел?",
                options: [
                    "VARCHAR",
                    "DECIMAL",
                    "INTEGER",
                    "TEXT"
                ],
                correct: 2,
                explanation: "INTEGER (или INT) используется для хранения целых чисел"
            },
            {
                id: 6,
                question: "Какой тип данных подходит для хранения строк переменной длины?",
                options: [
                    "CHAR",
                    "VARCHAR",
                    "INTEGER",
                    "BOOLEAN"
                ],
                correct: 1,
                explanation: "VARCHAR позволяет хранить строки переменной длины с указанием максимального размера"
            },
            {
                id: 7,
                question: "Чем отличается CHAR от VARCHAR?",
                options: [
                    "CHAR хранит только числа",
                    "VARCHAR хранит только числа", 
                    "CHAR имеет фиксированную длину, VARCHAR - переменную",
                    "Никакой разницы нет"
                ],
                correct: 2,
                explanation: "CHAR всегда занимает указанное количество символов, VARCHAR - только необходимое"
            },
            {
                id: 8,
                question: "Что означает CRUD?",
                options: [
                    "Create, Read, Update, Delete",
                    "Create, Replace, Update, Delete",
                    "Copy, Read, Update, Delete",
                    "Create, Read, Upgrade, Delete"
                ],
                correct: 0,
                explanation: "CRUD - это Create (создание), Read (чтение), Update (обновление), Delete (удаление)"
            },
            {
                id: 9,
                question: "Какая операция CRUD отвечает за извлечение данных?",
                options: [
                    "Create",
                    "Read",
                    "Update",
                    "Delete"
                ],
                correct: 1,
                explanation: "Read (чтение) отвечает за извлечение данных из базы данных"
            },
            {
                id: 10,
                question: "Какая команда используется для извлечения данных из таблицы?",
                options: [
                    "GET",
                    "FETCH",
                    "SELECT",
                    "RETRIEVE"
                ],
                correct: 2,
                explanation: "SELECT - основная команда для извлечения данных из таблиц"
            },
            {
                id: 11,
                question: "Что означает SELECT * FROM table_name?",
                options: [
                    "Выбрать все строки из таблицы",
                    "Выбрать все столбцы всех строк из таблицы",
                    "Удалить все данные из таблицы",
                    "Создать копию таблицы"
                ],
                correct: 1,
                explanation: "SELECT * выбирает все столбцы всех строк из указанной таблицы"
            },
            {
                id: 12,
                question: "Какое ключевое слово используется для фильтрации результатов в SELECT?",
                options: [
                    "FILTER",
                    "WHERE",
                    "HAVING",
                    "CONDITION"
                ],
                correct: 1,
                explanation: "WHERE используется для указания условий фильтрации в SELECT запросах"
            },
            {
                id: 13,
                question: "Какая команда используется для добавления новых записей в таблицу?",
                options: [
                    "ADD",
                    "INSERT",
                    "CREATE",
                    "APPEND"
                ],
                correct: 1,
                explanation: "INSERT используется для добавления новых записей в таблицу"
            },
            {
                id: 14,
                question: "Какой синтаксис правильный для INSERT?",
                options: [
                    "INSERT table_name VALUES (values)",
                    "INSERT INTO table_name VALUES (values)",
                    "INSERT INTO table_name SET values",
                    "INSERT table_name SET values"
                ],
                correct: 1,
                explanation: "Правильный синтаксис: INSERT INTO table_name VALUES (values)"
            },
            {
                id: 15,
                question: "Какая команда используется для изменения существующих записей?",
                options: [
                    "MODIFY",
                    "CHANGE",
                    "UPDATE",
                    "ALTER"
                ],
                correct: 2,
                explanation: "UPDATE используется для изменения данных в существующих записях"
            },
            {
                id: 16,
                question: "Что обязательно должно быть в команде UPDATE для безопасности?",
                options: [
                    "ORDER BY",
                    "GROUP BY",
                    "WHERE",
                    "HAVING"
                ],
                correct: 2,
                explanation: "WHERE условие обязательно в UPDATE для предотвращения изменения всех записей"
            },
            {
                id: 17,
                question: "Какая команда используется для удаления записей из таблицы?",
                options: [
                    "REMOVE",
                    "DELETE",
                    "DROP",
                    "CLEAR"
                ],
                correct: 1,
                explanation: "DELETE используется для удаления записей из таблицы"
            },
            {
                id: 18,
                question: "В чем разница между DELETE и DROP?",
                options: [
                    "Нет разницы",
                    "DELETE удаляет записи, DROP удаляет таблицу целиком",
                    "DELETE удаляет таблицу, DROP удаляет записи",
                    "DROP работает быстрее"
                ],
                correct: 1,
                explanation: "DELETE удаляет записи из таблицы, DROP удаляет саму таблицу или другие объекты БД"
            },
            {
                id: 19,
                question: "Что такое CONSTRAINT в SQL?",
                options: [
                    "Команда для создания таблицы",
                    "Ограничение, применяемое к данным в таблице",
                    "Тип данных",
                    "Способ индексации"
                ],
                correct: 1,
                explanation: "CONSTRAINT - это ограничение, которое определяет правила для данных в таблице"
            },
            {
                id: 20,
                question: "Какое ограничение запрещает NULL значения в столбце?",
                options: [
                    "UNIQUE",
                    "CHECK",
                    "NOT NULL",
                    "PRIMARY KEY"
                ],
                correct: 2,
                explanation: "NOT NULL ограничение запрещает пустые (NULL) значения в столбце"
            },
            {
                id: 21,
                question: "Что такое первичный ключ?",
                options: [
                    "Любое поле в таблице",
                    "Поле, которое можно изменять",
                    "Уникальный идентификатор записи в таблице",
                    "Поле с текстовыми данными"
                ],
                correct: 2,
                explanation: "Первичный ключ однозначно идентифицирует каждую запись в таблице"
            },
            {
                id: 22,
                question: "Сколько первичных ключей может быть в одной таблице?",
                options: [
                    "Неограниченное количество",
                    "Максимум 5",
                    "Только один",
                    "Минимум 2"
                ],
                correct: 2,
                explanation: "В таблице может быть только один первичный ключ (но он может состоять из нескольких столбцов)"
            },
            {
                id: 23,
                question: "Какие свойства имеет первичный ключ?",
                options: [
                    "Только уникальность",
                    "Только NOT NULL",
                    "Уникальность и NOT NULL",
                    "Никаких особых свойств"
                ],
                correct: 2,
                explanation: "Первичный ключ автоматически имеет ограничения UNIQUE и NOT NULL"
            },
            {
                id: 24,
                question: "Что такое внешний ключ?",
                options: [
                    "Ключ от другой базы данных",
                    "Ссылка на первичный ключ другой таблицы",
                    "Дублированный первичный ключ",
                    "Временный ключ"
                ],
                correct: 1,
                explanation: "Внешний ключ создает связь между таблицами, ссылаясь на первичный ключ другой таблицы"
            },
            {
                id: 25,
                question: "Для чего нужны внешние ключи?",
                options: [
                    "Для ускорения запросов",
                    "Для обеспечения целостности данных между таблицами",
                    "Для сжатия данных",
                    "Для шифрования данных"
                ],
                correct: 1,
                explanation: "Внешние ключи обеспечивают ссылочную целостность между связанными таблицами"
            },
            {
                id: 26,
                question: "Что такое индекс в базе данных?",
                options: [
                    "Номер записи в таблице",
                    "Структура данных для ускорения поиска",
                    "Тип данных",
                    "Команда SQL"
                ],
                correct: 1,
                explanation: "Индекс - это структура данных, которая ускоряет поиск и сортировку записей"
            },
            {
                id: 27,
                question: "Какая команда создает индекс?",
                options: [
                    "MAKE INDEX",
                    "NEW INDEX",
                    "CREATE INDEX",
                    "ADD INDEX"
                ],
                correct: 2,
                explanation: "CREATE INDEX - команда для создания индекса на столбце или столбцах таблицы"
            },
            {
                id: 28,
                question: "Каков основной недостаток индексов?",
                options: [
                    "Ускоряют SELECT запросы",
                    "Замедляют INSERT, UPDATE, DELETE операции",
                    "Уменьшают размер таблицы",
                    "Улучшают безопасность"
                ],
                correct: 1,
                explanation: "Индексы ускоряют чтение, но замедляют операции записи, так как нужно обновлять индекс"
            },
            {
                id: 29,
                question: "Какой формат обычно используется для экспорта данных SQL?",
                options: [
                    "PDF",
                    "CSV",
                    "DOC",
                    "MP3"
                ],
                correct: 1,
                explanation: "CSV (Comma-Separated Values) - популярный формат для импорта/экспорта табличных данных"
            },
            {
                id: 30,
                question: "Что такое дамп базы данных?",
                options: [
                    "Ошибка в базе данных",
                    "Полная копия структуры и данных БД в виде SQL команд",
                    "Временная таблица",
                    "Сжатый файл"
                ],
                correct: 1,
                explanation: "Дамп - это полная копия БД в виде SQL команд для восстановления"
            }
        ]},
    2: { // courseId: 2 (Продвинутые техники)
        title: "Итоговый тест: Продвинутые техники SQL",
        description: "Проверьте свои знания по продвинутым возможностям SQL",
        timeLimit: 45,
        questions: [
            {
                id: 1,
                question: "Что делает INNER JOIN?",
                options: [
                    "Возвращает все записи из левой таблицы",
                    "Возвращает только записи, которые есть в обеих таблицах",
                    "Возвращает все записи из обеих таблиц",
                    "Удаляет дублированные записи"
                ],
                correct: 1,
                explanation: "INNER JOIN возвращает только те записи, для которых найдено соответствие в обеих таблицах"
            },
            {
                id: 2,
                question: "В чем разница между LEFT JOIN и RIGHT JOIN?",
                options: [
                    "LEFT JOIN быстрее RIGHT JOIN",
                    "LEFT JOIN возвращает все записи из левой таблицы, RIGHT JOIN - из правой",
                    "Нет разницы, это синонимы",
                    "RIGHT JOIN не поддерживается в SQL"
                ],
                correct: 1,
                explanation: "LEFT JOIN сохраняет все записи левой таблицы, RIGHT JOIN - правой таблицы"
            },
            {
                id: 3,
                question: "Что делает FULL OUTER JOIN?",
                options: [
                    "Возвращает только совпадающие записи",
                    "Возвращает все записи из обеих таблиц",
                    "Возвращает только записи из левой таблицы",
                    "Создает новую таблицу"
                ],
                correct: 1,
                explanation: "FULL OUTER JOIN возвращает все записи из обеих таблиц, заполняя NULL там, где нет соответствий"
            },
            {
                id: 4,
                question: "Что такое CROSS JOIN?",
                options: [
                    "Соединение по условию",
                    "Декартово произведение таблиц",
                    "Соединение только уникальных записей",
                    "Быстрое соединение таблиц"
                ],
                correct: 1,
                explanation: "CROSS JOIN создает декартово произведение - каждая строка первой таблицы соединяется с каждой строкой второй"
            },
            {
                id: 5,
                question: "Можно ли использовать несколько JOIN в одном запросе?",
                options: [
                    "Нет, только один JOIN на запрос",
                    "Да, можно соединять несколько таблиц",
                    "Только в подзапросах",
                    "Только с INNER JOIN"
                ],
                correct: 1,
                explanation: "В одном запросе можно использовать множественные JOIN для соединения нескольких таблиц"
            },
            {
                id: 6,
                question: "Что такое подзапрос (subquery)?",
                options: [
                    "Ошибка в запросе",
                    "Запрос внутри другого запроса",
                    "Быстрый запрос",
                    "Запрос без WHERE"
                ],
                correct: 1,
                explanation: "Подзапрос - это SELECT запрос, вложенный внутри другого SQL оператора"
            },
            {
                id: 7,
                question: "Где можно использовать подзапросы?",
                options: [
                    "Только в SELECT",
                    "Только в WHERE",
                    "В SELECT, WHERE, FROM, HAVING",
                    "Только в FROM"
                ],
                correct: 2,
                explanation: "Подзапросы можно использовать в различных частях SQL запроса: SELECT, WHERE, FROM, HAVING"
            },
            {
                id: 8,
                question: "Что такое коррелированный подзапрос?",
                options: [
                    "Подзапрос с ошибкой",
                    "Подзапрос, который ссылается на внешний запрос",
                    "Очень быстрый подзапрос",
                    "Подзапрос без условий"
                ],
                correct: 1,
                explanation: "Коррелированный подзапрос использует значения из внешнего запроса и выполняется для каждой строки"
            },
            {
                id: 9,
                question: "Что такое оконные функции (Window Functions)?",
                options: [
                    "Функции для создания окон в приложении",
                    "Функции, которые работают с набором строк, связанных с текущей строкой",
                    "Функции для работы с датами",
                    "Функции для математических вычислений"
                ],
                correct: 1,
                explanation: "Оконные функции выполняют вычисления над набором строк, связанных с текущей строкой"
            },
            {
                id: 10,
                question: "Какой ключевой элемент используется в оконных функциях?",
                options: [
                    "WINDOW",
                    "OVER",
                    "FRAME",
                    "RANGE"
                ],
                correct: 1,
                explanation: "Ключевое слово OVER используется для определения окна в оконных функциях"
            },
            {
                id: 11,
                question: "Что делает функция ROW_NUMBER()?",
                options: [
                    "Считает количество строк",
                    "Присваивает уникальный номер каждой строке в окне",
                    "Находит номер строки в таблице",
                    "Возвращает случайное число"
                ],
                correct: 1,
                explanation: "ROW_NUMBER() присваивает уникальный последовательный номер каждой строке в определенном окне"
            },
            {
                id: 12,
                question: "В чем разница между ROW_NUMBER() и RANK()?",
                options: [
                    "Нет разницы",
                    "RANK() может присваивать одинаковые ранги при равных значениях",
                    "ROW_NUMBER() работает быстрее",
                    "RANK() работает только с числами"
                ],
                correct: 1,
                explanation: "RANK() присваивает одинаковые ранги строкам с равными значениями, ROW_NUMBER() всегда уникален"
            },
            {
                id: 13,
                question: "Что такое PARTITION BY в оконных функциях?",
                options: [
                    "Удаление данных",
                    "Разделение результата на группы для применения функции",
                    "Сортировка данных",
                    "Фильтрация данных"
                ],
                correct: 1,
                explanation: "PARTITION BY разделяет результирующий набор на группы, к каждой из которых применяется оконная функция"
            },
            {
                id: 14,
                question: "Что такое CTE (Common Table Expression)?",
                options: [
                    "Тип данных в SQL",
                    "Временный именованный результирующий набор",
                    "Команда для создания таблицы",
                    "Функция для вычислений"
                ],
                correct: 1,
                explanation: "CTE - это временный именованный результирующий набор, существующий в рамках выполнения одного оператора"
            },
            {
                id: 15,
                question: "Как начинается CTE?",
                options: [
                    "CREATE",
                    "WITH",
                    "SELECT",
                    "DECLARE"
                ],
                correct: 1,
                explanation: "CTE начинается с ключевого слова WITH, за которым следует имя и определение"
            },
            {
                id: 16,
                question: "Что такое рекурсивный CTE?",
                options: [
                    "CTE с ошибкой",
                    "CTE, который ссылается сам на себя",
                    "Очень сложный CTE",
                    "CTE для работы с датами"
                ],
                correct: 1,
                explanation: "Рекурсивный CTE - это CTE, который ссылается сам на себя для обработки иерархических данных"
            },
            {
                id: 17,
                question: "Что такое динамический SQL?",
                options: [
                    "SQL, который изменяется автоматически",
                    "SQL код, построенный и выполненный во время выполнения",
                    "Быстрый SQL",
                    "SQL с переменными"
                ],
                correct: 1,
                explanation: "Динамический SQL - это SQL код, который строится как строка и выполняется во время выполнения программы"
            },
            {
                id: 18,
                question: "Какая команда используется для выполнения динамического SQL?",
                options: [
                    "RUN",
                    "EXEC или EXECUTE",
                    "PERFORM",
                    "DO"
                ],
                correct: 1,
                explanation: "Команды EXEC или EXECUTE используются для выполнения динамически построенных SQL команд"
            },
            {
                id: 19,
                question: "Что такое хранимая процедура?",
                options: [
                    "Временная таблица",
                    "Предварительно скомпилированный блок SQL кода",
                    "Резервная копия данных",
                    "Индекс таблицы"
                ],
                correct: 1,
                explanation: "Хранимая процедура - это предварительно скомпилированный блок SQL кода, сохраненный в базе данных"
            },
            {
                id: 20,
                question: "Какие преимущества дают хранимые процедуры?",
                options: [
                    "Только безопасность",
                    "Производительность, безопасность, повторное использование кода",
                    "Только производительность",
                    "Простота написания"
                ],
                correct: 1,
                explanation: "Хранимые процедуры обеспечивают лучшую производительность, безопасность и возможность повторного использования"
            },
            {
                id: 21,
                question: "Что такое триггер в SQL?",
                options: [
                    "Команда для запуска запроса",
                    "Специальная процедура, выполняемая автоматически при определенных событиях",
                    "Тип данных",
                    "Индекс таблицы"
                ],
                correct: 1,
                explanation: "Триггер - это специальная хранимая процедура, которая автоматически выполняется при определенных событиях"
            },
            {
                id: 22,
                question: "На какие события могут реагировать триггеры?",
                options: [
                    "Только INSERT",
                    "INSERT, UPDATE, DELETE",
                    "Только SELECT",
                    "Только CREATE"
                ],
                correct: 1,
                explanation: "Триггеры могут реагировать на события INSERT, UPDATE и DELETE в таблицах"
            },
            {
                id: 23,
                question: "Что такое пользовательская функция в SQL?",
                options: [
                    "Функция, написанная пользователем",
                    "Встроенная функция SQL",
                    "Ошибка в коде",
                    "Тип данных"
                ],
                correct: 0,
                explanation: "Пользовательская функция - это функция, созданная пользователем для выполнения специфических вычислений"
            },
            {
                id: 24,
                question: "Что такое транзакция?",
                options: [
                    "Одна SQL команда",
                    "Логическая единица работы, состоящая из одной или нескольких операций",
                    "Таблица в базе данных",
                    "Тип соединения"
                ],
                correct: 1,
                explanation: "Транзакция - это последовательность операций, которая выполняется как единое целое"
            },
            {
                id: 25,
                question: "Какие свойства должна иметь транзакция (ACID)?",
                options: [
                    "Atomicity, Consistency, Isolation, Durability",
                    "Accuracy, Completeness, Integration, Database",
                    "Access, Control, Identity, Data",
                    "All, Correct, Important, Details"
                ],
                correct: 0,
                explanation: "ACID: Atomicity (атомарность), Consistency (согласованность), Isolation (изолированность), Durability (долговечность)"
            },
            {
                id: 26,
                question: "Что делает команда COMMIT?",
                options: [
                    "Отменяет транзакцию",
                    "Подтверждает и сохраняет изменения транзакции",
                    "Начинает новую транзакцию",
                    "Проверяет транзакцию"
                ],
                correct: 1,
                explanation: "COMMIT подтверждает все изменения, сделанные в текущей транзакции, и делает их постоянными"
            }]},
    3: { // courseId: 3 (Python для анализа данных)
        title: "Итоговый тест: Python для анализа данных",
        description: "Проверьте свои знания по всему курсу анализа данных с Python",
        timeLimit: 45,
        questions: [
            {
                id: 1,
                question: "Какая библиотека является основой для численных вычислений в Python?",
                options: [
                    "pandas",
                    "matplotlib",
                    "NumPy",
                    "scipy"
                ],
                correct: 2,
                explanation: "NumPy - фундаментальная библиотека для научных вычислений в Python, предоставляющая многомерные массивы"
            },
            {
                id: 2,
                question: "Что такое DataFrame в pandas?",
                options: [
                    "Одномерная структура данных",
                    "Двумерная структура данных, похожая на таблицу",
                    "Трехмерная структура данных",
                    "Функция для создания графиков"
                ],
                correct: 1,
                explanation: "DataFrame - это двумерная структура данных с метками строк и столбцов, похожая на таблицу или электронную таблицу"
            },
            {
                id: 3,
                question: "Какой метод используется для загрузки CSV файла в pandas?",
                options: [
                    "pd.load_csv()",
                    "pd.read_csv()",
                    "pd.import_csv()",
                    "pd.open_csv()"
                ],
                correct: 1,
                explanation: "pd.read_csv() - стандартный метод pandas для чтения CSV файлов в DataFrame"
            },
            {
                id: 4,
                question: "Что делает метод .head() в pandas?",
                options: [
                    "Удаляет первые строки",
                    "Показывает первые 5 строк DataFrame",
                    "Сортирует данные",
                    "Создает новый столбец"
                ],
                correct: 1,
                explanation: ".head() возвращает первые n строк DataFrame (по умолчанию 5)"
            },
            {
                id: 5,
                question: "Как выбрать столбец 'name' из DataFrame df?",
                options: [
                    "df.select('name')",
                    "df.get('name')",
                    "df['name']",
                    "df.column('name')"
                ],
                correct: 2,
                explanation: "df['name'] - стандартный способ доступа к столбцу в pandas DataFrame"
            },
            {
                id: 6,
                question: "Какой метод используется для обнаружения пропущенных значений?",
                options: [
                    "isnull()",
                    "ismissing()",
                    "isempty()",
                    "isblank()"
                ],
                correct: 0,
                explanation: "isnull() возвращает булевы значения, указывающие на пропущенные данные (NaN)"
            },
            {
                id: 7,
                question: "Что делает метод .fillna()?",
                options: [
                    "Удаляет пропущенные значения",
                    "Находит пропущенные значения",
                    "Заполняет пропущенные значения",
                    "Подсчитывает пропущенные значения"
                ],
                correct: 2,
                explanation: ".fillna() заменяет пропущенные значения (NaN) на указанное значение"
            },
            {
                id: 8,
                question: "Какой метод используется для группировки данных в pandas?",
                options: [
                    "group()",
                    "groupby()",
                    "group_data()",
                    "aggregate()"
                ],
                correct: 1,
                explanation: ".groupby() создает группы на основе значений в одном или нескольких столбцах"
            },
            {
                id: 9,
                question: "Что делает функция np.array()?",
                options: [
                    "Создает список Python",
                    "Создает NumPy массив",
                    "Создает DataFrame",
                    "Создает строку"
                ],
                correct: 1,
                explanation: "np.array() создает многомерный массив NumPy из последовательности данных"
            },
            {
                id: 10,
                question: "Какой метод используется для объединения DataFrame по столбцам?",
                options: [
                    "join()",
                    "merge()",
                    "concat()",
                    "combine()"
                ],
                correct: 1,
                explanation: "merge() выполняет операции объединения DataFrame, аналогичные SQL JOIN"
            },
            {
                id: 11,
                question: "Что такое Series в pandas?",
                options: [
                    "Двумерная структура данных",
                    "Одномерная структура данных с индексом",
                    "Функция для построения графиков",
                    "Тип данных для дат"
                ],
                correct: 1,
                explanation: "Series - одномерная структура данных pandas с осью меток (индексом)"
            },
            {
                id: 12,
                question: "Какая библиотека используется для базовой визуализации в Python?",
                options: [
                    "seaborn",
                    "plotly",
                    "matplotlib",
                    "bokeh"
                ],
                correct: 2,
                explanation: "matplotlib - базовая библиотека для создания статических, анимированных и интерактивных визуализаций в Python"
            },
            {
                id: 13,
                question: "Что делает функция plt.show()?",
                options: [
                    "Сохраняет график",
                    "Отображает график на экране",
                    "Создает новый график",
                    "Очищает график"
                ],
                correct: 1,
                explanation: "plt.show() отображает текущий график в окне или блокноте Jupyter"
            },
            {
                id: 14,
                question: "Какая библиотека построена поверх matplotlib и предоставляет красивые статистические графики?",
                options: [
                    "plotly",
                    "seaborn",
                    "bokeh",
                    "altair"
                ],
                correct: 1,
                explanation: "seaborn - библиотека статистической визуализации, построенная на matplotlib с более простым интерфейсом"
            },
            {
                id: 15,
                question: "Какой метод pandas используется для создания сводной таблицы?",
                options: [
                    "pivot()",
                    "pivot_table()",
                    "crosstab()",
                    "summary()"
                ],
                correct: 1,
                explanation: "pivot_table() создает сводную таблицу с агрегированными данными"
            },
            {
                id: 16,
                question: "Что такое iloc в pandas?",
                options: [
                    "Индексация по меткам",
                    "Индексация по позиции (целочисленная)",
                    "Метод сортировки",
                    "Функция агрегации"
                ],
                correct: 1,
                explanation: "iloc обеспечивает целочисленную позиционную индексацию для выбора данных"
            },
            {
                id: 17,
                question: "Какая функция scipy используется для проверки нормальности распределения?",
                options: [
                    "normaltest()",
                    "shapiro()",
                    "anderson()",
                    "ttest_1samp()"
                ],
                correct: 1,
                explanation: "shapiro() выполняет тест Шапиро-Уилка для проверки нормальности распределения"
            },
            {
                id: 18,
                question: "Что делает pd.to_datetime()?",
                options: [
                    "Создает случайные даты",
                    "Преобразует строки в объект datetime",
                    "Форматирует даты",
                    "Сортирует по датам"
                ],
                correct: 1,
                explanation: "pd.to_datetime() преобразует строки или другие форматы в pandas datetime объекты"
            },
            {
                id: 19,
                question: "Какой модуль используется для веб-скрейпинга в Python?",
                options: [
                    "requests",
                    "beautifulsoup4",
                    "scrapy",
                    "Все перечисленные"
                ],
                correct: 3,
                explanation: "Все перечисленные библиотеки используются для веб-скрейпинга: requests для HTTP запросов, BeautifulSoup для парсинга HTML, Scrapy как фреймворк"
            },
            {
                id: 20,
                question: "Что такое машинное обучение с учителем?",
                options: [
                    "Обучение без примеров",
                    "Обучение на размеченных данных",
                    "Обучение методом проб и ошибок",
                    "Автоматическое обучение"
                ],
                correct: 1,
                explanation: "Обучение с учителем использует размеченные данные (входы и соответствующие выходы) для обучения модели"
            },
            {
                id: 21,
                question: "Какая функция sklearn используется для разделения данных на обучающую и тестовую выборки?",
                options: [
                    "split_data()",
                    "train_test_split()",
                    "divide_data()",
                    "separate_data()"
                ],
                correct: 1,
                explanation: "train_test_split() случайным образом разделяет данные на обучающую и тестовую выборки"
            },
            {
                id: 22,
                question: "Что означает NaN в pandas?",
                options: [
                    "Not a Name",
                    "Not a Number",
                    "Null and None",
                    "New and Nice"
                ],
                correct: 1,
                explanation: "NaN означает 'Not a Number' и представляет пропущенные или недоступные данные"
            },
            {
                id: 23,
                question: "Какой метод используется для сохранения DataFrame в CSV файл?",
                options: [
                    "save_csv()",
                    "to_csv()",
                    "export_csv()",
                    "write_csv()"
                ],
                correct: 1,
                explanation: "to_csv() записывает DataFrame в файл формата CSV"
            },
            {
                id: 24,
                question: "Что такое broadcasting в NumPy?",
                options: [
                    "Отправка данных по сети",
                    "Правила выполнения операций над массивами разных размеров",
                    "Создание копий массива",
                    "Сортировка массива"
                ],
                correct: 1,
                explanation: "Broadcasting позволяет NumPy выполнять операции над массивами разных форм без явного изменения их размеров"
            },
            {
                id: 25,
                question: "Какая библиотека используется для создания интерактивных графиков?",
                options: [
                    "matplotlib",
                    "seaborn",
                    "plotly",
                    "pandas"
                ],
                correct: 2,
                explanation: "Plotly создает интерактивные веб-графики, которые можно масштабировать, панорамировать и исследовать"
            },
            {
                id: 26,
                question: "Что делает функция df.describe()?",
                options: [
                    "Описывает структуру DataFrame",
                    "Показывает статистическую сводку числовых столбцов",
                    "Создает описание данных",
                    "Выводит информацию о типах данных"
                ],
                correct: 1,
                explanation: "describe() генерирует описательную статистику (среднее, стандартное отклонение, минимум, максимум и т.д.)"
            },
            {
                id: 27,
                question: "Какой тип данных pandas лучше всего подходит для работы с категориальными данными?",
                options: [
                    "object",
                    "string",
                    "category",
                    "int64"
                ],
                correct: 2,
                explanation: "Тип 'category' оптимизирован для категориальных данных и использует меньше памяти"
            },
            {
                id: 28,
                question: "Что такое Dask?",
                options: [
                    "Библиотека для машинного обучения",
                    "Библиотека для параллельных вычислений и работы с большими данными",
                    "Библиотека для визуализации",
                    "Библиотека для веб-разработки"
                ],
                correct: 1,
                explanation: "Dask обеспечивает параллельные вычисления для аналитики, позволяя работать с данными, не помещающимися в память"
            }]},
    4: { // courseId: 4 (SQL для анализа данных)
        title: "Итоговый тест: SQL для анализа данных",
        description: "Проверьте свои знания аналитических функций и техник работы с данными",
        timeLimit: 45,
        questions: [
            {
                id: 1,
                question: "Какая функция используется для подсчета количества записей?",
                options: [
                    "SUM()",
                    "COUNT()",
                    "AVG()",
                    "MAX()"
                ],
                correct: 1,
                explanation: "COUNT() подсчитывает количество записей в группе или всей таблице"
            },
            {
                id: 2,
                question: "Что делает оператор GROUP BY?",
                options: [
                    "Сортирует данные",
                    "Группирует строки с одинаковыми значениями",
                    "Удаляет дубликаты",
                    "Создает новую таблицу"
                ],
                correct: 1,
                explanation: "GROUP BY группирует строки с одинаковыми значениями для применения агрегатных функций"
            },
            {
                id: 3,
                question: "Какая функция вычисляет медиану в SQL?",
                options: [
                    "MEDIAN()",
                    "PERCENTILE_CONT(0.5)",
                    "MIDDLE()",
                    "AVG()"
                ],
                correct: 1,
                explanation: "PERCENTILE_CONT(0.5) вычисляет 50-й процентиль, что является медианой"
            },
            {
                id: 4,
                question: "Что такое оконная функция (Window Function)?",
                options: [
                    "Функция для создания окон в интерфейсе",
                    "Функция, выполняющая вычисления над набором строк, связанных с текущей строкой",
                    "Функция для работы с временными интервалами",
                    "Функция для группировки данных"
                ],
                correct: 1,
                explanation: "Оконные функции выполняют вычисления над набором строк без группировки результата"
            },
            {
                id: 5,
                question: "Какая функция используется для присвоения ранга записям?",
                options: [
                    "ORDER()",
                    "SORT()",
                    "RANK()",
                    "INDEX()"
                ],
                correct: 2,
                explanation: "RANK() присваивает ранг каждой строке в рамках результирующего набора"
            },
            {
                id: 6,
                question: "Что делает функция LAG()?",
                options: [
                    "Возвращает значение из предыдущей строки",
                    "Создает задержку в выполнении запроса",
                    "Вычисляет отставание по времени",
                    "Группирует данные с задержкой"
                ],
                correct: 0,
                explanation: "LAG() возвращает значение из строки, расположенной на заданное количество позиций раньше текущей"
            },
            {
                id: 7,
                question: "Как извлечь год из даты в SQL?",
                options: [
                    "YEAR(date)",
                    "EXTRACT(YEAR FROM date)",
                    "GET_YEAR(date)",
                    "DATE_YEAR(date)"
                ],
                correct: 1,
                explanation: "EXTRACT(YEAR FROM date) - стандартный способ извлечения года из даты"
            },
            {
                id: 8,
                question: "Что такое временной ряд в контексте анализа данных?",
                options: [
                    "Последовательность данных, упорядоченная по времени",
                    "Таблица с временными метками",
                    "График изменения данных",
                    "Расписание выполнения запросов"
                ],
                correct: 0,
                explanation: "Временной ряд - это последовательность точек данных, проиндексированных во времени"
            },
            {
                id: 9,
                question: "Какая функция используется для вычисления скользящего среднего?",
                options: [
                    "MOVING_AVG()",
                    "AVG() OVER (ROWS BETWEEN n PRECEDING AND CURRENT ROW)",
                    "SLIDING_AVG()",
                    "WINDOW_AVG()"
                ],
                correct: 1,
                explanation: "Скользящее среднее вычисляется с помощью AVG() с оконной функцией OVER"
            },
            {
                id: 10,
                question: "Что такое сезонность во временных рядах?",
                options: [
                    "Данные только по временам года",
                    "Регулярно повторяющиеся паттерны в данных",
                    "Данные с временными интервалами",
                    "Ошибки в временных данных"
                ],
                correct: 1,
                explanation: "Сезонность - это регулярно повторяющиеся паттерны в данных через определенные интервалы"
            },
            {
                id: 11,
                question: "Какая функция используется для работы с геоданными?",
                options: [
                    "ST_Distance()",
                    "GEO_CALC()",
                    "MAP_FUNC()",
                    "LOCATION()"
                ],
                correct: 0,
                explanation: "ST_Distance() вычисляет расстояние между геометрическими объектами"
            },
            {
                id: 12,
                question: "Что такое геокодирование?",
                options: [
                    "Шифрование географических данных",
                    "Преобразование адресов в координаты",
                    "Создание географических карт",
                    "Анализ геологических данных"
                ],
                correct: 1,
                explanation: "Геокодирование - процесс преобразования адресов в географические координаты"
            },
            {
                id: 13,
                question: "Какой тип данных используется для хранения координат?",
                options: [
                    "TEXT",
                    "GEOGRAPHY/GEOMETRY",
                    "DECIMAL",
                    "VARCHAR"
                ],
                correct: 1,
                explanation: "GEOGRAPHY и GEOMETRY - специальные типы данных для пространственной информации"
            },
            {
                id: 14,
                question: "Что такое машинное обучение на SQL?",
                options: [
                    "Обучение написанию SQL запросов",
                    "Использование ML алгоритмов внутри базы данных",
                    "Автоматическое создание запросов",
                    "Оптимизация производительности SQL"
                ],
                correct: 1,
                explanation: "ML на SQL позволяет выполнять алгоритмы машинного обучения непосредственно в базе данных"
            },
            {
                id: 15,
                question: "Какая функция используется для линейной регрессии в SQL?",
                options: [
                    "LINEAR_REG()",
                    "REGR_SLOPE() и REGR_INTERCEPT()",
                    "ML_REGRESSION()",
                    "PREDICT()"
                ],
                correct: 1,
                explanation: "REGR_SLOPE() и REGR_INTERCEPT() вычисляют коэффициенты линейной регрессии"
            },
            {
                id: 16,
                question: "Что такое корреляция в анализе данных?",
                options: [
                    "Связь между двумя переменными",
                    "Ошибка в данных",
                    "Дублирование информации",
                    "Сортировка данных"
                ],
                correct: 0,
                explanation: "Корреляция измеряет силу и направление линейной связи между переменными"
            },
            {
                id: 17,
                question: "Какой инструмент лучше всего подходит для визуализации SQL результатов?",
                options: [
                    "Excel",
                    "Tableau/Power BI",
                    "Word",
                    "Notepad"
                ],
                correct: 1,
                explanation: "Tableau и Power BI специализированы для создания интерактивных визуализаций данных"
            },
            {
                id: 18,
                question: "Что такое дашборд?",
                options: [
                    "Интерфейс управления базой данных",
                    "Интерактивная панель с визуализациями ключевых метрик",
                    "Список всех таблиц в БД",
                    "Инструмент для написания запросов"
                ],
                correct: 1,
                explanation: "Дашборд - это интерактивная панель, отображающая ключевые показатели и метрики"
            },
            {
                id: 19,
                question: "Какой тип графика лучше всего показывает тренды во времени?",
                options: [
                    "Круговая диаграмма",
                    "Линейный график",
                    "Столбчатая диаграмма",
                    "Точечная диаграмма"
                ],
                correct: 1,
                explanation: "Линейный график идеально подходит для отображения изменений данных во времени"
            },
            {
                id: 20,
                question: "Что такое когортный анализ?",
                options: [
                    "Анализ групп пользователей во времени",
                    "Анализ корреляций",
                    "Анализ ошибок в данных",
                    "Анализ производительности запросов"
                ],
                correct: 0,
                explanation: "Когортный анализ изучает поведение групп пользователей (когорт) в динамике"
            },
            {
                id: 21,
                question: "Что такое когорта в аналитике?",
                options: [
                    "Ошибка в данных",
                    "Группа пользователей с общими характеристиками",
                    "Временной период",
                    "Тип метрики"
                ],
                correct: 1,
                explanation: "Когорта - группа пользователей, объединенных общим событием в определенный временной период"
            },
            {
                id: 22,
                question: "Какая метрика показывает долю пользователей, вернувшихся в продукт?",
                options: [
                    "Конверсия",
                    "Retention Rate",
                    "CTR",
                    "ROI"
                ],
                correct: 1,
                explanation: "Retention Rate (удержание) показывает долю пользователей, вернувшихся в продукт"
            },
            {
                id: 23,
                question: "Что такое DAU в продуктовой аналитике?",
                options: [
                    "Daily Active Users",
                    "Data Analysis Unit",
                    "Daily Average Usage",
                    "Database Access Utility"
                ],
                correct: 0,
                explanation: "DAU (Daily Active Users) - количество уникальных активных пользователей в день"
            },
            {
                id: 24,
                question: "Как рассчитывается конверсия?",
                options: [
                    "(Целевые действия / Общее количество пользователей) × 100%",
                    "Доходы / Расходы",
                    "Активные пользователи / Зарегистрированные",
                    "Клики / Показы"
                ],
                correct: 0,
                explanation: "Конверсия = (Количество выполненных целевых действий / Общее количество возможностей) × 100%"
            },
            {
                id: 25,
                question: "Что такое LTV (Lifetime Value)?",
                options: [
                    "Время жизни пользователя",
                    "Общая ценность клиента за весь период взаимодействия",
                    "Количество покупок клиента",
                    "Средний чек клиента"
                ],
                correct: 1,
                explanation: "LTV - общая прибыль, которую компания получает от клиента за весь период сотрудничества"
            },
            {
                id: 26,
                question: "Что такое A/B тестирование?",
                options: [
                    "Тестирование базы данных",
                    "Сравнение двух версий продукта для определения лучшей",
                    "Проверка качества данных",
                    "Тестирование производительности"
                ],
                correct: 1,
                explanation: "A/B тестирование сравнивает две версии продукта, чтобы определить какая работает лучше"
            },
            {
                id: 27,
                question: "Какая метрика используется для оценки статистической значимости в A/B тесте?",
                options: [
                    "Средняя арифметическая",
                    "p-value",
                    "Медиана",
                    "Стандартное отклонение"
                ],
                correct: 1,
                explanation: "p-value показывает вероятность получения наблюдаемых результатов случайно"
            },]
        },
        5: { // courseId: 5 (NoSQL и SQL)
    title: "Итоговый тест: NoSQL и SQL - Гибридные подходы",
    description: "Проверьте свои знания гибридных систем баз данных и интеграции SQL с NoSQL решениями",
    timeLimit: 60,
    questions: [
        {
            id: 1,
            question: "Какой тип данных JSON лучше всего подходит для хранения в SQL базах данных?",
            options: [
                "TEXT",
                "VARCHAR",
                "JSON",
                "BLOB"
            ],
            correct: 2,
            explanation: "Современные SQL базы данных поддерживают нативный тип JSON с индексацией и функциями для работы с JSON-данными"
        },
        {
            id: 2,
            question: "Что такое ACID в контексте гибридных систем?",
            options: [
                "Принцип работы только с NoSQL",
                "Свойства транзакций: Atomicity, Consistency, Isolation, Durability",
                "Алгоритм шифрования данных",
                "Протокол репликации"
            ],
            correct: 1,
            explanation: "ACID - это четыре ключевых свойства транзакций, которые важно учитывать при проектировании гибридных систем"
        },
        {
            id: 3,
            question: "Какая функция PostgreSQL позволяет извлекать значения из JSON полей?",
            options: [
                "JSON_VALUE()",
                "json_extract()",
                "->",
                "Все вышеперечисленные"
            ],
            correct: 3,
            explanation: "PostgreSQL поддерживает различные операторы и функции для работы с JSON: ->, ->>, json_extract_path() и другие"
        },
        {
            id: 4,
            question: "В чем основное преимущество документно-ориентированных баз данных как MongoDB?",
            options: [
                "Лучшая производительность для всех задач",
                "Гибкая схема данных",
                "Поддержка только JSON",
                "Отсутствие индексов"
            ],
            correct: 1,
            explanation: "Главное преимущество MongoDB и других документных БД - гибкая схема, позволяющая хранить различные структуры данных"
        },
        {
            id: 5,
            question: "Какой тип базы данных лучше всего подходит для хранения связей между объектами?",
            options: [
                "Реляционная",
                "Документная",
                "Графовая",
                "Колоночная"
            ],
            correct: 2,
            explanation: "Графовые базы данных (Neo4j, Amazon Neptune) оптимизированы для хранения и обхода связей между объектами"
        },
        {
            id: 6,
            question: "Что такое Time Series Database?",
            options: [
                "База данных для хранения времени",
                "База данных, оптимизированная для временных рядов данных",
                "База данных с временными таблицами",
                "База данных для планирования задач"
            ],
            correct: 1,
            explanation: "Time Series Database оптимизирована для работы с данными, изменяющимися во времени (метрики, логи, IoT данные)"
        },
        {
            id: 7,
            question: "Какую роль играет Redis в гибридной архитектуре?",
            options: [
                "Основная база данных",
                "Кеш и хранилище сессий",
                "Система аналитики",
                "Файловая система"
            ],
            correct: 1,
            explanation: "Redis используется как высокопроизводительный кеш в памяти и для хранения сессий в гибридных системах"
        },
        {
            id: 8,
            question: "Что такое sharding в контексте NoSQL систем?",
            options: [
                "Резервное копирование",
                "Горизонтальное разделение данных",
                "Сжатие данных",
                "Шифрование"
            ],
            correct: 1,
            explanation: "Sharding - это техника горизонтального разделения данных по нескольким серверам для масштабирования"
        },
        {
            id: 9,
            question: "Для чего используется Elasticsearch в гибридных системах?",
            options: [
                "Хранение основных данных",
                "Полнотекстовый поиск и аналитика",
                "Управление транзакциями",
                "Кеширование"
            ],
            correct: 1,
            explanation: "Elasticsearch специализируется на полнотекстовом поиске, аналитике и индексации больших объемов данных"
        },
        {
            id: 10,
            question: "Какой подход лучше всего подходит для миграции данных из SQL в NoSQL?",
            options: [
                "Единовременная миграция всех данных",
                "Постепенная миграция с параллельной работой систем",
                "Удаление старых данных",
                "Создание новой системы с нуля"
            ],
            correct: 1,
            explanation: "Постепенная миграция с параллельной работой систем минимизирует риски и позволяет тестировать новую систему"
        },
        {
            id: 11,
            question: "Что такое eventual consistency в NoSQL системах?",
            options: [
                "Немедленная консистентность данных",
                "Консистентность достигается со временем",
                "Отсутствие консистентности",
                "Консистентность только для записи"
            ],
            correct: 1,
            explanation: "Eventual consistency означает, что система достигнет консистентного состояния со временем, но не гарантирует немедленную синхронизацию"
        },
        {
            id: 12,
            question: "Какой паттерн используется для объединения данных из SQL и NoSQL систем?",
            options: [
                "CQRS (Command Query Responsibility Segregation)",
                "MVC",
                "Singleton",
                "Observer"
            ],
            correct: 0,
            explanation: "CQRS разделяет операции чтения и записи, что позволяет использовать разные системы хранения для разных типов операций"
        },
        {
            id: 13,
            question: "Что такое CAP теорема в контексте распределенных систем?",
            options: [
                "Consistency, Availability, Partition tolerance",
                "Create, Alter, Partition",
                "Cache, Application, Performance",
                "Client, API, Protocol"
            ],
            correct: 0,
            explanation: "CAP теорема утверждает, что распределенная система может гарантировать только два из трех свойств: консистентность, доступность, устойчивость к разделению"
        },
        {
            id: 14,
            question: "Какая стратегия репликации лучше всего подходит для чтения-интенсивных приложений?",
            options: [
                "Master-Master репликация",
                "Master-Slave репликация",
                "Circular репликация",
                "Без репликации"
            ],
            correct: 1,
            explanation: "Master-Slave репликация позволяет распределить нагрузку чтения между несколькими slave-серверами"
        },
        {
            id: 15,
            question: "Что такое polyglot persistence?",
            options: [
                "Использование одного языка программирования",
                "Использование разных баз данных для разных задач",
                "Многоязычная документация",
                "Шифрование на разных языках"
            ],
            correct: 1,
            explanation: "Polyglot persistence - это подход, при котором используются разные типы баз данных для решения различных задач в рамках одного приложения"
        }
    ]
},
        6:{ // courseId: 6 (SQL для аналитики)
    title: "Итоговый тест: SQL для аналитики",
    description: "Проверьте свои знания продвинутых аналитических запросов и техник работы с данными",
    timeLimit: 50,
    questions: [
        {
            id: 1,
            question: "Какая функция позволяет вычислить медиану в SQL?",
            options: [
                "MEDIAN()",
                "PERCENTILE_CONT(0.5)",
                "AVG()",
                "MODE()"
            ],
            correct: 1,
            explanation: "PERCENTILE_CONT(0.5) вычисляет медиану как 50-й процентиль непрерывного распределения"
        },
        {
            id: 2,
            question: "Что делает оконная функция ROW_NUMBER()?",
            options: [
                "Подсчитывает общее количество строк",
                "Присваивает уникальный номер каждой строке в окне",
                "Ранжирует строки с пропусками",
                "Вычисляет накопительную сумму"
            ],
            correct: 1,
            explanation: "ROW_NUMBER() присваивает уникальный порядковый номер каждой строке в рамках определенного окна"
        },
        {
            id: 3,
            question: "Какая разница между RANK() и DENSE_RANK()?",
            options: [
                "Нет разницы",
                "RANK() пропускает номера при одинаковых значениях, DENSE_RANK() не пропускает",
                "DENSE_RANK() работает только с числами",
                "RANK() быстрее работает"
            ],
            correct: 1,
            explanation: "RANK() пропускает следующие позиции после одинаковых значений (1,2,2,4), DENSE_RANK() не пропускает (1,2,2,3)"
        },
        {
            id: 4,
            question: "Что такое CTE (Common Table Expression)?",
            options: [
                "Постоянная таблица в базе данных",
                "Временный именованный результирующий набор",
                "Тип индекса",
                "Функция для работы с датами"
            ],
            correct: 1,
            explanation: "CTE - это временный именованный результирующий набор, который существует только в рамках выполнения одного запроса"
        },
        {
            id: 5,
            question: "Как создать Pivot-таблицу в SQL?",
            options: [
                "Использовать оператор PIVOT",
                "Использовать CASE WHEN с GROUP BY",
                "Использовать CROSS JOIN",
                "Все перечисленные способы"
            ],
            correct: 3,
            explanation: "Pivot-таблицы можно создать используя оператор PIVOT (где поддерживается) или имитировать через CASE WHEN с GROUP BY"
        },
        {
            id: 6,
            question: "Что делает функция LAG() в оконных функциях?",
            options: [
                "Вычисляет задержку выполнения запроса",
                "Возвращает значение из предыдущей строки",
                "Подсчитывает количество пропущенных значений",
                "Сортирует данные по убыванию"
            ],
            correct: 1,
            explanation: "LAG() возвращает значение из предыдущей строки в упорядоченном наборе данных"
        },
        {
            id: 7,
            question: "Какая функция вычисляет накопительную сумму?",
            options: [
                "RUNNING_TOTAL()",
                "SUM() OVER (ORDER BY column ROWS UNBOUNDED PRECEDING)",
                "CUMSUM()",
                "TOTAL_SUM()"
            ],
            correct: 1,
            explanation: "Накопительная сумма вычисляется с помощью SUM() OVER с оконной рамкой от начала до текущей строки"
        },
        {
            id: 8,
            question: "Что означает ST_Distance() в геоаналитических функциях SQL?",
            options: [
                "Вычисляет расстояние между двумя географическими точками",
                "Определяет статистическое отклонение",
                "Сортирует по расстоянию",
                "Стандартизирует данные"
            ],
            correct: 0,
            explanation: "ST_Distance() вычисляет расстояние между двумя геометрическими объектами в пространственных данных"
        },
        {
            id: 9,
            question: "Как работает рекурсивный CTE?",
            options: [
                "Выполняется только один раз",
                "Имеет базовый случай и рекурсивную часть",
                "Работает только с числовыми данными",
                "Не поддерживается в SQL"
            ],
            correct: 1,
            explanation: "Рекурсивный CTE состоит из якорного запроса (базовый случай) и рекурсивной части, которая ссылается на себя"
        },
        {
            id: 10,
            question: "Что такое функция NTILE()?",
            options: [
                "Создает N-мерные таблицы",
                "Делит результирующий набор на N равных групп",
                "Вычисляет N-й элемент",
                "Повторяет значение N раз"
            ],
            correct: 1,
            explanation: "NTILE(n) делит упорядоченное множество строк на n примерно равных групп и присваивает каждой группе номер"
        },
        {
            id: 11,
            question: "Какая функция вычисляет корреляцию между двумя столбцами?",
            options: [
                "CORRELATION()",
                "CORR()",
                "PEARSON()",
                "RELATE()"
            ],
            correct: 1,
            explanation: "CORR() вычисляет коэффициент корреляции Пирсона между двумя числовыми выражениями"
        },
        {
            id: 12,
            question: "Что означает PARTITION BY в оконных функциях?",
            options: [
                "Разделяет таблицу физически",
                "Определяет группы строк для применения оконной функции",
                "Создает новые разделы диска",
                "Удаляет дубликаты"
            ],
            correct: 1,
            explanation: "PARTITION BY определяет, как разделить строки на группы для применения оконной функции к каждой группе отдельно"
        },
        {
            id: 13,
            question: "Как извлечь год из даты в SQL?",
            options: [
                "YEAR(date_column)",
                "EXTRACT(YEAR FROM date_column)",
                "DATE_PART('year', date_column)",
                "Все перечисленные способы"
            ],
            correct: 3,
            explanation: "Год можно извлечь разными способами в зависимости от СУБД: YEAR(), EXTRACT(), DATE_PART()"
        },
        {
            id: 14,
            question: "Что делает функция FIRST_VALUE() в оконных функциях?",
            options: [
                "Возвращает первое значение в таблице",
                "Возвращает первое значение в текущем окне",
                "Проверяет первичный ключ",
                "Находит минимальное значение"
            ],
            correct: 1,
            explanation: "FIRST_VALUE() возвращает первое значение в упорядоченном наборе значений текущего окна"
        },
        {
            id: 15,
            question: "Какая функция используется для создания скользящего среднего?",
            options: [
                "MOVING_AVG()",
                "AVG() OVER (ORDER BY date ROWS BETWEEN n PRECEDING AND CURRENT ROW)",
                "SLIDING_MEAN()",
                "ROLL_AVG()"
            ],
            correct: 1,
            explanation: "Скользящее среднее создается с помощью AVG() OVER с оконной рамкой, определяющей количество предыдущих строк"
        }
    ]
}
};

// Исправленная функция запуска итогового теста
function startFinalTest(courseId) {
    console.log('Запуск итогового теста для курса:', courseId);
    
    try {
        // Получаем данные теста
        const testData = finalTestsData[parseInt(courseId)];
        if (!testData) {
            console.error('Итоговый тест для курса не найден:', courseId);
            showMessage('Итоговый тест не найден', 'error');
            return;
        }

        // Инициализируем тест
        currentFinalTest = testData;
        currentFinalTestAnswers = new Array(testData.questions.length).fill(undefined);
        currentFinalTestQuestion = 0;

        // Обновляем информацию о тесте
        const totalQuestionsEl = document.getElementById('total-questions');
        const estimatedTimeEl = document.getElementById('estimated-time');
        
        if (totalQuestionsEl) totalQuestionsEl.textContent = testData.questions.length;
        if (estimatedTimeEl) estimatedTimeEl.textContent = Math.ceil(testData.questions.length * 2);

        // Скрываем интро и результаты, показываем тест
        const introSection = document.querySelector('.test-intro');
        const quizSection = document.getElementById('final-test-quiz');
        const resultsSection = document.getElementById('final-test-results'); // Добавлено
        
        if (introSection) introSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'none'; // Скрываем результаты
        if (quizSection) {
            quizSection.style.display = 'block';
            displayFinalTestQuestion();
        } else {
            console.error('Контейнер final-test-quiz не найден');
            showMessage('Ошибка инициализации теста', 'error');
        }

    } catch (error) {
        console.error('Ошибка в startFinalTest:', error);
        showMessage('Ошибка запуска теста', 'error');
    }
}


// Исправленная функция отображения вопроса итогового теста
function displayFinalTestQuestion() {
    if (!currentFinalTest || currentFinalTestQuestion >= currentFinalTest.questions.length) {
        console.error('Нет данных теста или неверный индекс вопроса');
        return;
    }
    
    const question = currentFinalTest.questions[currentFinalTestQuestion];
    const container = document.getElementById('test-question-container');
    
    if (!container) {
        console.error('Контейнер для вопроса не найден');
        return;
    }
    
    const optionsHTML = question.options.map((option, index) => `
        <div class="test-option" onclick="selectFinalTestAnswer(${index})">
            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
            <span class="option-text">${option}</span>
        </div>
    `).join('');
    
    container.innerHTML = `
        <div class="test-question-card">
            <div class="question-text">
                <p>${question.question}</p>
            </div>
            <div class="question-options">
                ${optionsHTML}
            </div>
        </div>
    `;
    
    // Обновляем прогресс и кнопки
    updateFinalTestProgress();
    updateFinalTestButtons();
    
    // Восстанавливаем выбранный ответ если есть
    if (currentFinalTestAnswers[currentFinalTestQuestion] !== undefined) {
        const selectedIndex = currentFinalTestAnswers[currentFinalTestQuestion];
        const options = document.querySelectorAll('.test-option');
        if (options[selectedIndex]) {
            options[selectedIndex].classList.add('selected');
        }
    }
}

// Функция выбора ответа в итоговом тесте
function selectFinalTestAnswer(answerIndex) {
    // Убираем выделение с других вариантов
    document.querySelectorAll('.test-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Выделяем выбранный вариант
    const options = document.querySelectorAll('.test-option');
    if (options[answerIndex]) {
        options[answerIndex].classList.add('selected');
    }
    
    // Сохраняем ответ
    currentFinalTestAnswers[currentFinalTestQuestion] = answerIndex;
    
    // Обновляем кнопки навигации
    updateFinalTestButtons();
}

function showTestResults(score, correctAnswers, totalQuestions, passed) {
    const container = document.getElementById('main-content');
    if (!container) return;
    
    const course = courses.find(c => c.id === currentTest.courseId);
    
    const resultHTML = `
        <div class="test-results">
            <div class="result-header">
                <h2>Результаты итогового теста</h2>
                <h3>${course ? course.title : 'Курс'}</h3>
            </div>
            
            <div class="result-content">
                <div class="score-circle ${passed ? 'passed' : 'failed'}">
                    <div class="score-number">${score}%</div>
                    <div class="score-label">${passed ? 'Пройден' : 'Не пройден'}</div>
                </div>
                
                <div class="result-details">
                    <div class="detail-item">
                        <span class="detail-label">Правильных ответов:</span>
                        <span class="detail-value">${correctAnswers} из ${totalQuestions}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Процент правильных ответов:</span>
                        <span class="detail-value">${score}%</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Минимальный балл для прохождения:</span>
                        <span class="detail-value">70%</span>
                    </div>
                    ${passed ? `
                    <div class="detail-item success">
                        <span class="detail-label">Получено XP:</span>
                        <span class="detail-value">+500 XP</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="result-actions">
                    <button class="btn btn-primary" onclick="showCourse(${currentTest.courseId})">
                        Вернуться к курсу
                    </button>
                    ${!passed ? `
                    <button class="btn btn-secondary" onclick="startFinalTest(${currentTest.courseId})">
                        Пройти тест заново
                    </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = resultHTML;
    currentTest = null;
}


// Функция обновления прогресса итогового теста
function updateFinalTestProgress() {
    if (!currentFinalTest) return;
    
    const progress = ((currentFinalTestQuestion + 1) / currentFinalTest.questions.length) * 100;
    const progressElement = document.getElementById('test-progress');
    const progressTextElement = document.getElementById('progress-text');
    
    if (progressElement) progressElement.style.width = `${progress}%`;
    if (progressTextElement) {
        progressTextElement.textContent = `${currentFinalTestQuestion + 1} / ${currentFinalTest.questions.length}`;
    }
}
// Функция обновления кнопок навигации итогового теста
function updateFinalTestButtons() {
    if (!currentFinalTest) return;
    
    const prevBtn = document.getElementById('prev-test-btn');
    const nextBtn = document.getElementById('next-test-btn');
    const finishBtn = document.getElementById('finish-test-btn');
    
    if (prevBtn) {
        prevBtn.disabled = currentFinalTestQuestion === 0;
    }
    
    const hasAnswer = currentFinalTestAnswers[currentFinalTestQuestion] !== undefined;
    const isLastQuestion = currentFinalTestQuestion === currentFinalTest.questions.length - 1;
    
    if (nextBtn && finishBtn) {
        if (isLastQuestion) {
            nextBtn.style.display = 'none';
            finishBtn.style.display = hasAnswer ? 'inline-block' : 'none';
        } else {
            nextBtn.style.display = 'inline-block';
            nextBtn.disabled = !hasAnswer;
            finishBtn.style.display = 'none';
        }
    }
}

function showFinalTest(courseId) {
    console.log('Показываем итоговый тест для курса:', courseId);
    
    // Просто обновляем контент урока на тест, не меняя всю структуру
    const lessonContent = document.querySelector('.lesson-content');
    if (!lessonContent) return;
    
    lessonContent.innerHTML = generateFinalTestContent(courseId);
}
function generateFinalTestContent(courseId) {
    const testData = finalTestsData[parseInt(courseId)];
    if (!testData) {
        return '<p>Итоговый тест для этого курса пока недоступен.</p>';
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userCourse = currentUser?.courses?.find(c => c.id === parseInt(courseId));
    const isCompleted = userCourse?.finalTestCompleted;
    
    return `
        <div class="final-test-wrapper">
            <div class="test-intro" id="test-intro">
                <div class="test-header">
                    <h3><i class="fas fa-graduation-cap"></i> ${testData.title}</h3>
                    <p class="test-description">${testData.description}</p>
                </div>
                
                <div class="test-info">
                    <div class="test-stat">
                        <i class="fas fa-question-circle"></i>
                        <span>Вопросов: <strong id="total-questions">${testData.questions.length}</strong></span>
                    </div>
                    <div class="test-stat">
                        <i class="fas fa-clock"></i>
                        <span>Примерное время: <strong id="estimated-time">${Math.ceil(testData.questions.length * 2)}</strong> мин</span>
                    </div>
                    <div class="test-stat">
                        <i class="fas fa-chart-line"></i>
                        <span>Проходной балл: <strong>70%</strong></span>
                    </div>
                </div>
                
                ${isCompleted ? `
                    <div class="test-completed-info">
                        <div class="completion-badge">
                            <i class="fas fa-check-circle"></i>
                            <span>Тест пройден</span>
                        </div>
                        <p>Ваш результат: <strong>${userCourse.finalTestScore}%</strong></p>
                        <p>Вы можете пройти тест заново для улучшения результата.</p>
                    </div>
                ` : `
                    <div class="test-requirements">
                        <h4>Требования для прохождения:</h4>
                        <ul>
                            <li>Ответьте на все вопросы</li>
                            <li>Наберите минимум 70% правильных ответов</li>
                            <li>У вас есть неограниченное количество попыток</li>
                        </ul>
                    </div>
                `}
                
                <div class="test-actions">
                    <button class="pixel-btn start-final-test-btn" onclick="startFinalTest(${courseId})">
                        <i class="fas fa-play"></i> ${isCompleted ? 'Пройти заново' : 'Начать тест'}
                    </button>
                </div>
            </div>
            
            <!-- Контейнер для теста с фиксированной высотой -->
            <div id="final-test-quiz" class="test-quiz-container" style="display: none;">
                <div class="test-content-area">
                    <div class="test-progress-container">
                        <div class="progress-info">
                            <span id="progress-text">1 / ${testData.questions.length}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress" id="test-progress" style="width: 0%"></div>
                        </div>
                    </div>
                    
                    <div id="test-question-container" class="scrollable-content">
                        <!-- Вопросы будут загружаться здесь -->
                    </div>
                </div>
                
                <!-- Фиксированная панель навигации внизу -->
                <div class="test-navigation-panel">
                    <div class="test-navigation">
                        <button class="pixel-btn clear-btn" id="prev-test-btn" onclick="prevTestQuestion()" disabled>
                            <i class="fas fa-arrow-left"></i> <span class="btn-text">Предыдущий</span>
                        </button>
                        <button class="pixel-btn" id="next-test-btn" onclick="nextTestQuestion()" disabled>
                            <span class="btn-text">Следующий</span> <i class="fas fa-arrow-right"></i>
                        </button>
                        <button class="pixel-btn success-btn" id="finish-test-btn" onclick="finishFinalTest()" style="display: none;">
                            <i class="fas fa-check"></i> <span class="btn-text">Завершить тест</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Контейнер для результатов -->
            <div id="final-test-results" style="display: none;">
                <!-- Результаты будут показаны здесь -->
            </div>
        </div>
    `;
}
function displayFinalTestQuestion() {
    if (!currentFinalTest || currentFinalTestQuestion >= currentFinalTest.questions.length) {
        console.error('Нет данных теста или неверный индекс вопроса');
        return;
    }
    
    const question = currentFinalTest.questions[currentFinalTestQuestion];
    const container = document.getElementById('test-question-container');
    
    if (!container) {
        console.error('Контейнер для вопроса не найден');
        return;
    }
    
    // Создаем кнопки ответов
    const optionsHTML = question.options.map((option, index) => `
        <button class="pixel-btn answer-btn" onclick="selectFinalTestAnswer(${index})" data-answer="${index}">
            <span class="option-letter">${String.fromCharCode(65 + index)}.</span>
            <span class="option-text">${option}</span>
        </button>
    `).join('');
    
    container.innerHTML = `
        <div class="test-question-card">
            
            <div class="question-text">
                <h3>${question.question}</h3>
            </div>
            <div class="question-options">
                ${optionsHTML}
            </div>
        </div>
    `;
    
    // Обновляем прогресс и кнопки
    updateFinalTestProgress();
    updateFinalTestButtons();
    
    // Восстанавливаем выбранный ответ если есть
    if (currentFinalTestAnswers[currentFinalTestQuestion] !== undefined) {
        const selectedIndex = currentFinalTestAnswers[currentFinalTestQuestion];
        const buttons = document.querySelectorAll('.answer-btn');
        if (buttons[selectedIndex]) {
            buttons[selectedIndex].classList.add('selected');
        }
    }
}

function selectFinalTestAnswer(answerIndex) {
    // Убираем выделение с других вариантов
    document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Выделяем выбранный вариант
    const buttons = document.querySelectorAll('.answer-btn');
    if (buttons[answerIndex]) {
        buttons[answerIndex].classList.add('selected');
    }
    
    // Сохраняем ответ
    currentFinalTestAnswers[currentFinalTestQuestion] = answerIndex;
    
    // Обновляем кнопки навигации
    updateFinalTestButtons();
}

function showFinalTestResults(results, correctCount, percentage) {
    const container = document.getElementById('final-test-results');
    const quizSection = document.getElementById('final-test-quiz');
    
    if (!container) return;
    
    // Скрываем тест и показываем результаты
    if (quizSection) quizSection.style.display = 'none';
    
    const passed = percentage >= 70;
    
    container.innerHTML = `
        <div class="test-results" style="text-align: center;">
            <div class="result-header" style="margin-bottom: 30px;">
                <h2>Результаты итогового теста</h2>
            </div>
            
            <div class="result-content">
                <div class="score-circle ${passed ? 'passed' : 'failed'}" style="
                    width: 150px; 
                    height: 150px; 
                    border-radius: 50%; 
                    display: flex; 
                    flex-direction: column; 
                    justify-content: center; 
                    align-items: center; 
                    margin: 0 auto 30px;
                    background: ${passed ? '#4CAF50' : '#f44336'};
                    color: white;
                    font-size: 24px;
                    font-weight: bold;
                ">
                    <div class="score-number">${percentage}%</div>
                    <div class="score-label" style="font-size: 14px;">${passed ? 'Пройден' : 'Не пройден'}</div>
                </div>
                
                <div class="result-details" style="margin-bottom: 30px;">
                    <p><strong>Правильных ответов:</strong> ${correctCount} из ${currentFinalTest.questions.length}</p>
                    <p><strong>Процент правильных ответов:</strong> ${percentage}%</p>
                    <p><strong>Минимальный балл для прохождения:</strong> 70%</p>
                    ${passed ? '<p style="color: #4CAF50;"><strong>Получено XP:</strong> +500 XP</p>' : ''}
                </div>
                
                <div class="result-actions">
                    <button class="pixel-btn" onclick="loadCourse(${getCurrentCourseId()})">
                        Вернуться к курсу
                    </button>
                    ${!passed ? `
                    <button class="pixel-btn clear-btn" onclick="startFinalTest(${getCurrentCourseId()})">
                        Пройти тест заново
                    </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    container.style.display = 'block';
}

// Исправленные функции навигации
function prevTestQuestion() {
    if (currentFinalTestQuestion > 0) {
        currentFinalTestQuestion--;
        displayFinalTestQuestion();
    }
}

function nextTestQuestion() {
    if (currentFinalTestQuestion < currentFinalTest.questions.length - 1) {
        currentFinalTestQuestion++;
        displayFinalTestQuestion();
    }
}
// Исправленная функция завершения итогового теста
function finishFinalTest() {
    if (!currentFinalTest) return;
    
    // Проверяем, что все вопросы отвечены
    for (let i = 0; i < currentFinalTest.questions.length; i++) {
        if (currentFinalTestAnswers[i] === undefined) {
            showMessage(`Пожалуйста, ответьте на вопрос ${i + 1}`, 'warning');
            currentFinalTestQuestion = i;
            displayFinalTestQuestion();
            return;
        }
    }
    
    // Подсчитываем результаты
    let correctCount = 0;
    const results = currentFinalTest.questions.map((question, index) => {
        const isCorrect = currentFinalTestAnswers[index] === question.correct;
        if (isCorrect) correctCount++;
        
        return {
            question: question.question,
            userAnswer: question.options[currentFinalTestAnswers[index]],
            correctAnswer: question.options[question.correct],
            isCorrect: isCorrect,
            explanation: question.explanation
        };
    });
    
    const percentage = Math.round((correctCount / currentFinalTest.questions.length) * 100);
    
    // Показываем результаты
    showFinalTestResults(results, correctCount, percentage);
    
    // Обновляем прогресс пользователя если тест пройден
    if (percentage >= 70) {
        updateUserCourseProgress(percentage);
        addXP(500); // Бонус за прохождение итогового теста
    }
}

function generateFinalTestContent(courseId) {
    const testData = finalTestsData[parseInt(courseId)];
    if (!testData) {
        return '<p>Итоговый тест для этого курса пока недоступен.</p>';
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userCourse = currentUser?.courses?.find(c => c.id === parseInt(courseId));
    const isCompleted = userCourse?.finalTestCompleted;
    
    return `
        <div class="final-test-container">
            <div class="test-intro" id="test-intro">
                <div class="test-header">
                    <h3><i class="fas fa-graduation-cap"></i> ${testData.title}</h3>
                    <p class="test-description">${testData.description}</p>
                </div>
                
                <div class="test-info">
                    <div class="test-stat">
                        <i class="fas fa-question-circle"></i>
                        <span>Вопросов: <strong id="total-questions">${testData.questions.length}</strong></span>
                    </div>
                    <div class="test-stat">
                        <i class="fas fa-clock"></i>
                        <span>Примерное время: <strong id="estimated-time">${Math.ceil(testData.questions.length * 2)}</strong> мин</span>
                    </div>
                    <div class="test-stat">
                        <i class="fas fa-chart-line"></i>
                        <span>Проходной балл: <strong>70%</strong></span>
                    </div>
                </div>
                
                ${isCompleted ? `
                    <div class="test-completed-info">
                        <div class="completion-badge">
                            <i class="fas fa-check-circle"></i>
                            <span>Тест пройден</span>
                        </div>
                        <p>Ваш результат: <strong>${userCourse.finalTestScore}%</strong></p>
                        <p>Вы можете пройти тест заново для улучшения результата.</p>
                    </div>
                ` : `
                    <div class="test-requirements">
                        <h4>Требования для прохождения:</h4>
                        <ul>
                            <li>Ответьте на все вопросы</li>
                            <li>Наберите минимум 70% правильных ответов</li>
                            <li>У вас есть неограниченное количество попыток</li>
                        </ul>
                    </div>
                `}
                
                <div class="test-actions">
                    <button class="pixel-btn start-final-test-btn" onclick="startFinalTest(${courseId})">
                        <i class="fas fa-play"></i> ${isCompleted ? 'Пройти заново' : 'Начать тест'}
                    </button>
                </div>
            </div>
            
            <!-- Контейнер для самого теста -->
            <div id="final-test-quiz" style="display: none;">
                <div class="test-progress-container">
                    <div class="progress-info">
                        <span id="progress-text">1 / ${testData.questions.length}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress" id="test-progress" style="width: 0%"></div>
                    </div>
                </div>
                
                <div id="test-question-container">
                    <!-- Вопросы будут загружаться здесь -->
                </div>
                
                <div class="test-navigation">
                    <button class="pixel-btn clear-btn" id="prev-test-btn" onclick="prevTestQuestion()" disabled>
                        <i class="fas fa-arrow-left"></i> Предыдущий
                    </button>
                    <button class="pixel-btn" id="next-test-btn" onclick="nextTestQuestion()" disabled>
                        Следующий <i class="fas fa-arrow-right"></i>
                    </button>
                    <button class="pixel-btn success-btn" id="finish-test-btn" onclick="finishFinalTest()" style="display: none;">
                        <i class="fas fa-check"></i> Завершить тест
                    </button>
                </div>
            </div>
            
            <!-- Контейнер для результатов -->
            <div id="final-test-results" style="display: none;">
                <!-- Результаты будут показаны здесь -->
            </div>
        </div>
    `;
}

function updateTestNavigationButtons() {
    const prevBtn = document.getElementById('prev-test-btn');
    const nextBtn = document.getElementById('next-test-btn');
    const finishBtn = document.getElementById('finish-test-btn');
    
    if (prevBtn) {
        prevBtn.disabled = window.finalCurrentQuestion === 0;
    }
    
    const hasAnswer = window.finalTestAnswers[window.finalCurrentQuestion] !== undefined;
    const isLastQuestion = window.finalCurrentQuestion === window.finalTestData.questions.length - 1;
    
    if (nextBtn && finishBtn) {
        if (isLastQuestion) {
            nextBtn.style.display = 'none';
            finishBtn.style.display = hasAnswer ? 'inline-block' : 'none';
            finishBtn.disabled = !hasAnswer;
        } else {
            nextBtn.style.display = 'inline-block';
            nextBtn.disabled = !hasAnswer;
            finishBtn.style.display = 'none';
        }
    }
}

// Функция обновления прогресса пользователя
function updateUserCourseProgress(percentage) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const courseId = getCurrentCourseId();
    const userCourse = currentUser.courses.find(c => c.id === courseId);
    
    if (userCourse && percentage >= 70) {
        userCourse.finalTestCompleted = true;
        userCourse.finalTestScore = percentage;
        userCourse.completed = true;
        userCourse.progress = 100;
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
}

function returnToCourse() {
    const courseId = getCurrentCourseId();
    showCourse(courseId);
}

function generateLessonContent(courseId, lessonId) {
    // Здесь должен быть контент урока
    // Для демонстрации используем заглушки
    
    const courseLessons = {
        1: {
            1: `<p>Реляционные базы данных (РБД) – это тип баз данных, которые организованы на основе реляционной модели данных, предложенной Эдгаром Коддом в 1970 году.</p>
                <p>Основные концепции реляционных БД:</p>
                <ul>
                    <li><strong>Таблицы (Relations)</strong> - данные хранятся в таблицах, состоящих из строк и столбцов</li>
                    <li><strong>Строки (Records/Tuples)</strong> - каждая строка содержит данные об отдельном объекте</li>
                    <li><strong>Столбцы (Attributes/Fields)</strong> - определяют свойства объектов</li>
                    <li><strong>Первичные ключи (Primary Keys)</strong> - уникальные идентификаторы строк</li>
                    <li><strong>Внешние ключи (Foreign Keys)</strong> - создают связи между таблицами</li>
                </ul>
                <p>Преимущества реляционных БД:</p>
                <ul>
                    <li>Простая и понятная структура данных</li>
                    <li>Гибкость при запросах (не требуется заранее определять, какие запросы будут выполняться)</li>
                    <li>ACID-транзакции (Atomicity, Consistency, Isolation, Durability)</li>
                    <li>Широкое распространение и поддержка</li>
                </ul>
                <p>Популярные СУБД: MySQL, PostgreSQL, Oracle, Microsoft SQL Server, SQLite.</p>
                <div class="test-data" style="display: none;">
                    [
                        {
                            "question": "Что такое реляционная база данных?",
                            "type": "single",
                            "options": [
                                {"text": "База данных, основанная на таблицах", "correct": true},
                                {"text": "База данных без структуры", "correct": false},
                                {"text": "База данных только для чтения", "correct": false}
                            ]
                        },
                        {
                            "question": "Какие основные элементы есть в реляционной БД?",
                            "type": "multiple",
                            "options": [
                                {"text": "Таблицы", "correct": true},
                                {"text": "Строки", "correct": true},
                                {"text": "Столбцы", "correct": true},
                                {"text": "Графы", "correct": false}
                            ]
                        },
                        {
                            "question": "Первичный ключ должен быть уникальным",
                            "type": "boolean",
                            "correct": true
                        }
                    ]
                </div>`,
                
            
            2: `<p>Команда CREATE TABLE используется для создания новой таблицы в базе данных. Она определяет структуру таблицы, включая имена столбцов, их типы данных и ограничения.</p>
                <p>Базовый синтаксис команды CREATE TABLE:</p>
                <pre><code>CREATE TABLE table_name (
    column1 datatype constraints,
    column2 datatype constraints,
    ...
    columnN datatype constraints
);</code></pre>
                <p>Пример создания простой таблицы пользователей:</p>
                <pre><code>CREATE TABLE users (
    id INT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    birth_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);</code></pre>
                <p>В этом примере мы создаем таблицу с различными типами столбцов и ограничениями:</p>
                <ul>
                    <li><code>id</code> - целочисленный первичный ключ</li>
                    <li><code>username</code> - строка длиной до 50 символов, не может быть NULL</li>
                    <li><code>email</code> - строка с ограничением уникальности</li>
                    <li><code>birth_date</code> - дата рождения пользователя</li>
                    <li><code>is_active</code> - логическое значение со значением по умолчанию TRUE</li>
                    <li><code>created_at</code> - временная метка, по умолчанию текущее время</li>
                </ul>
                <p>Для удаления таблицы используется команда DROP TABLE:</p>
                <pre><code>DROP TABLE table_name;</code></pre>
                <p>Для изменения структуры существующей таблицы используется ALTER TABLE:</p>
                <pre><code>ALTER TABLE users ADD COLUMN last_login TIMESTAMP;</code></pre>`,
            
            3: `<p>SQL поддерживает различные типы данных для хранения информации разного рода. Типы данных могут немного различаться в зависимости от СУБД.</p>
                <h4>Числовые типы данных:</h4>
                <ul>
                    <li><strong>INT/INTEGER</strong> - целые числа (обычно 4 байта: от -2,147,483,648 до 2,147,483,647)</li>
                    <li><strong>SMALLINT</strong> - малые целые числа (обычно 2 байта: от -32,768 до 32,767)</li>
                    <li><strong>BIGINT</strong> - большие целые числа (обычно 8 байт: от -9,223,372,036,854,775,808 до 9,223,372,036,854,775,807)</li>
                    <li><strong>DECIMAL(p,s)/NUMERIC(p,s)</strong> - десятичные числа с фиксированной точностью, где p - общее количество цифр, s - количество цифр после запятой</li>
                    <li><strong>FLOAT</strong> - числа с плавающей точкой (обычно 4 байта)</li>
                    <li><strong>DOUBLE/REAL</strong> - числа с плавающей точкой двойной точности (обычно 8 байт)</li>
                </ul>
                
                <h4>Строковые типы данных:</h4>
                <ul>
                    <li><strong>CHAR(n)</strong> - строка фиксированной длины n (дополняется пробелами)</li>
                    <li><strong>VARCHAR(n)</strong> - строка переменной длины с максимальной длиной n</li>
                    <li><strong>TEXT</strong> - строка переменной длины большого объема</li>
                </ul>
                
                <h4>Типы данных для даты и времени:</h4>
                <ul>
                    <li><strong>DATE</strong> - дата (год, месяц, день)</li>
                    <li><strong>TIME</strong> - время (часы, минуты, секунды)</li>
                    <li><strong>DATETIME/TIMESTAMP</strong> - дата и время</li>
                    <li><strong>INTERVAL</strong> - промежуток времени</li>
                </ul>
                
                <h4>Логический тип данных:</h4>
                <ul>
                    <li><strong>BOOLEAN</strong> - логический тип (TRUE, FALSE, а иногда NULL)</li>
                </ul>
                
                <h4>Бинарные типы данных:</h4>
                <ul>
                    <li><strong>BLOB</strong> - бинарные данные переменной длины большого объема</li>
                    <li><strong>BINARY(n)/VARBINARY(n)</strong> - бинарные данные фиксированной/переменной длины</li>
                </ul>
                
                <h4>Специальные типы данных:</h4>
                <ul>
                    <li><strong>JSON</strong> - данные в формате JSON (поддерживается в PostgreSQL, MySQL 5.7+)</li>
                    <li><strong>ENUM</strong> - перечисляемый тип (предопределенный набор строковых значений)</li>
                    <li><strong>UUID</strong> - универсальный уникальный идентификатор (поддерживается в PostgreSQL)</li>
                    <li><strong>ARRAY</strong> - массив значений (поддерживается в PostgreSQL)</li>
                </ul>
                
                <p>Пример таблицы с различными типами данных:</p>
                <pre><code>CREATE TABLE product (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    is_available BOOLEAN DEFAULT TRUE,
    category ENUM('Electronics', 'Clothing', 'Food', 'Books'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tags JSON
);</code></pre>`,
            
            4: `<p>CRUD - это аббревиатура от Create, Read, Update и Delete - четырех основных операций, которые можно выполнять с данными в большинстве информационных систем.</p>
                <p>В SQL эти операции реализуются с помощью следующих команд:</p>
                
                <h4>1. Create (Создание) - INSERT</h4>
                <p>Команда INSERT используется для добавления новых строк в таблицу:</p>
                <pre><code>INSERT INTO table_name (column1, column2, ...) 
VALUES (value1, value2, ...);</code></pre>
                <p>Пример:</p>
                <pre><code>INSERT INTO customers (name, email, phone) 
VALUES ('John Doe', 'john@example.com', '+1-555-123-4567');</code></pre>
                
                <h4>2. Read (Чтение) - SELECT</h4>
                <p>Команда SELECT используется для извлечения данных из одной или нескольких таблиц:</p>
                <pre><code>SELECT column1, column2, ... 
FROM table_name 
WHERE condition;</code></pre>
                <p>Пример:</p>
                <pre><code>SELECT id, name, email 
FROM customers 
WHERE city = 'New York';</code></pre>
                
                <h4>3. Update (Обновление) - UPDATE</h4>
                <p>Команда UPDATE используется для изменения существующих данных в таблице:</p>
                <pre><code>UPDATE table_name 
SET column1 = value1, column2 = value2, ... 
WHERE condition;</code></pre>
                <p>Пример:</p>
                <pre><code>UPDATE customers 
SET email = 'johndoe@example.com', status = 'active' 
WHERE id = 5;</code></pre>
                
                <h4>4. Delete (Удаление) - DELETE</h4>
                <p>Команда DELETE используется для удаления строк из таблицы:</p>
                <pre><code>DELETE FROM table_name 
WHERE condition;</code></pre>
                <p>Пример:</p>
                <pre><code>DELETE FROM customers 
WHERE last_order_date < '2020-01-01';</code></pre>
                
                <p><strong>Важные моменты при работе с CRUD-операциями:</strong></p>
                <ul>
                    <li>Всегда проверяйте условия WHERE при операциях UPDATE и DELETE, чтобы избежать нежелательного изменения или удаления данных</li>
                    <li>Используйте транзакции для обеспечения целостности данных при выполнении нескольких операций</li>
                    <li>Проверяйте ограничения и правила целостности данных (constraints) при вставке и обновлении</li>
                    <li>Используйте подготовленные выражения (prepared statements) для защиты от SQL-инъекций</li>
                </ul>`,
            5: `<p>SELECT - одна из важнейших команд SQL, используемая для извлечения данных из базы данных.</p>

<h4>Основной синтаксис команды SELECT:</h4>
<pre><code>SELECT column1, column2, ... 
FROM table_name
WHERE condition
ORDER BY column1 [ASC|DESC]
LIMIT number;</code></pre>

<p><strong>Основные части запроса SELECT:</strong></p>
<ul>
    <li><strong>SELECT</strong> - указывает, какие столбцы необходимо извлечь</li>
    <li><strong>FROM</strong> - указывает таблицу, из которой извлекаются данные</li>
    <li><strong>WHERE</strong> - фильтрует строки по указанному условию</li>
    <li><strong>ORDER BY</strong> - сортирует результат по одному или нескольким столбцам</li>
    <li><strong>LIMIT</strong> - ограничивает количество возвращаемых строк</li>
</ul>

<h4>Примеры запросов SELECT:</h4>
<p>Выбор всех столбцов из таблицы:</p>
<pre><code>SELECT * FROM customers;</code></pre>

<p>Выбор определенных столбцов:</p>
<pre><code>SELECT first_name, last_name, email FROM customers;</code></pre>

<p>Фильтрация с помощью WHERE:</p>
<pre><code>SELECT * FROM customers WHERE country = 'USA';</code></pre>

<p>Сортировка результатов:</p>
<pre><code>SELECT * FROM customers ORDER BY last_name ASC;</code></pre>

<p>Использование нескольких условий:</p>
<pre><code>SELECT * FROM customers 
WHERE country = 'USA' AND state = 'CA';</code></pre>

<p>Использование LIKE для поиска по шаблону:</p>
<pre><code>SELECT * FROM customers 
WHERE last_name LIKE 'Sm%';</code></pre>

<p>Использование IN для проверки вхождения в список значений:</p>
<pre><code>SELECT * FROM customers 
WHERE country IN ('USA', 'Canada', 'Mexico');</code></pre>

<p>Ограничение количества возвращаемых строк:</p>
<pre><code>SELECT * FROM customers LIMIT 10;</code></pre>

<p>Пропуск определенного количества строк (пагинация):</p>
<pre><code>SELECT * FROM customers LIMIT 10 OFFSET 20;</code></pre>`,
			6: `<p>INSERT - команда SQL, используемая для добавления новых строк в таблицу.</p>

<h4>Основной синтаксис команды INSERT:</h4>
<pre><code>INSERT INTO table_name (column1, column2, ...)
VALUES (value1, value2, ...);</code></pre>

<p>Можно также добавить несколько строк за один запрос:</p>
<pre><code>INSERT INTO table_name (column1, column2, ...)
VALUES (value1, value2, ...),
       (value1, value2, ...),
       (value1, value2, ...);</code></pre>

<h4>Примеры использования INSERT:</h4>
<p>Добавление одной строки с указанием всех столбцов:</p>
<pre><code>INSERT INTO customers (id, first_name, last_name, email, phone)
VALUES (1, 'John', 'Doe', 'john@example.com', '+1-555-123-4567');</code></pre>

<p>Добавление строки с указанием только некоторых столбцов (остальные получат значения по умолчанию или NULL):</p>
<pre><code>INSERT INTO customers (first_name, last_name, email)
VALUES ('Mary', 'Smith', 'mary@example.com');</code></pre>

<p>Добавление нескольких строк:</p>
<pre><code>INSERT INTO customers (first_name, last_name, email)
VALUES ('John', 'Doe', 'john@example.com'),
       ('Mary', 'Smith', 'mary@example.com'),
       ('Robert', 'Jones', 'robert@example.com');</code></pre>

<h4>INSERT с подзапросом:</h4>
<p>Можно использовать результаты SELECT для заполнения новых строк:</p>
<pre><code>INSERT INTO customers_archive (id, first_name, last_name, email)
SELECT id, first_name, last_name, email
FROM customers
WHERE last_order_date < '2022-01-01';</code></pre>

<h4>INSERT IGNORE:</h4>
<p>В MySQL можно использовать INSERT IGNORE для пропуска ошибок при нарушении ограничений уникальности:</p>
<pre><code>INSERT IGNORE INTO customers (id, first_name, last_name, email)
VALUES (1, 'John', 'Doe', 'john@example.com');</code></pre>

<h4>INSERT ... ON DUPLICATE KEY UPDATE:</h4>
<p>В MySQL и некоторых других СУБД можно указать действие при дублировании ключа:</p>
<pre><code>INSERT INTO customers (id, first_name, last_name, email, visits)
VALUES (1, 'John', 'Doe', 'john@example.com', 1)
ON DUPLICATE KEY UPDATE visits = visits + 1;</code></pre>

<p><strong>Важные моменты:</strong></p>
<ul>
    <li>Строковые и временные значения обычно заключаются в одинарные кавычки</li>
    <li>Числовые значения записываются без кавычек</li>
    <li>Значение NULL можно использовать для обозначения отсутствующих данных</li>
    <li>При работе с реальными приложениями всегда используйте подготовленные выражения (prepared statements) для защиты от SQL-инъекций</li>
</ul>`,
			7: `<p>UPDATE - команда SQL, используемая для изменения существующих данных в таблице.</p>

<h4>Основной синтаксис команды UPDATE:</h4>
<pre><code>UPDATE table_name
SET column1 = value1, column2 = value2, ...
WHERE condition;</code></pre>

<p><strong>Важно:</strong> Если не указать условие WHERE, команда UPDATE изменит все строки в таблице!</p>

<h4>Примеры использования UPDATE:</h4>
<p>Обновление одного столбца с простым условием:</p>
<pre><code>UPDATE customers
SET status = 'active'
WHERE id = 5;</code></pre>

<p>Обновление нескольких столбцов одновременно:</p>
<pre><code>UPDATE customers
SET email = 'new.email@example.com',
    last_updated = CURRENT_TIMESTAMP
WHERE id = 5;</code></pre>

<p>Обновление на основе вычислений:</p>
<pre><code>UPDATE products
SET price = price * 1.1
WHERE category = 'Electronics';</code></pre>

<p>Использование сложных условий:</p>
<pre><code>UPDATE customers
SET status = 'inactive'
WHERE last_login < DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
AND subscription_type = 'free';</code></pre>

<h4>UPDATE с подзапросами:</h4>
<p>Можно использовать подзапросы для определения значений или условий:</p>
<pre><code>UPDATE employees
SET salary = salary * 1.1
WHERE department_id IN (
    SELECT id FROM departments WHERE location = 'New York'
);</code></pre>

<p>Обновление с использованием данных из другой таблицы (синтаксис MySQL):</p>
<pre><code>UPDATE customers c
JOIN orders o ON c.id = o.customer_id
SET c.status = 'premium'
WHERE o.total_amount > 1000;</code></pre>

<p>Альтернативный способ для других СУБД:</p>
<pre><code>UPDATE customers
SET status = 'premium'
WHERE id IN (
    SELECT customer_id 
    FROM orders 
    WHERE total_amount > 1000
);</code></pre>

<h4>Ограничение количества обновляемых строк:</h4>
<p>В MySQL и некоторых других СУБД можно ограничить количество обновляемых строк:</p>
<pre><code>UPDATE customers
SET status = 'review'
WHERE created_at < '2023-01-01'
LIMIT 100;</code></pre>

<p><strong>Рекомендации по безопасному использованию UPDATE:</strong></p>
<ul>
    <li>Всегда используйте условие WHERE, чтобы избежать обновления всех строк</li>
    <li>Сначала выполните SELECT с тем же условием WHERE, чтобы увидеть, какие строки будут обновлены</li>
    <li>Используйте транзакции (BEGIN/COMMIT/ROLLBACK) для возможности отмены изменений</li>
    <li>Применяйте подготовленные выражения (prepared statements) для защиты от SQL-инъекций</li>
</ul>`,
			8: `<p>DELETE - команда SQL, используемая для удаления существующих строк из таблицы.</p>

<h4>Основной синтаксис команды DELETE:</h4>
<pre><code>DELETE FROM table_name
WHERE condition;</code></pre>

<p><strong>Важно:</strong> Если не указать условие WHERE, команда DELETE удалит все строки из таблицы!</p>

<h4>Примеры использования DELETE:</h4>
<p>Удаление одной строки по первичному ключу:</p>
<pre><code>DELETE FROM customers
WHERE id = 5;</code></pre>

<p>Удаление нескольких строк по условию:</p>
<pre><code>DELETE FROM customers
WHERE status = 'inactive';</code></pre>

<p>Удаление с использованием сложных условий:</p>
<pre><code>DELETE FROM customers
WHERE last_login < DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR)
AND status = 'inactive';</code></pre>

<h4>DELETE с подзапросами:</h4>
<p>Можно использовать подзапросы для определения условий:</p>
<pre><code>DELETE FROM orders
WHERE customer_id IN (
    SELECT id FROM customers WHERE status = 'blocked'
);</code></pre>

<h4>Ограничение количества удаляемых строк:</h4>
<p>В MySQL и некоторых других СУБД можно ограничить количество удаляемых строк:</p>
<pre><code>DELETE FROM log_entries
WHERE created_at < '2023-01-01'
LIMIT 1000;</code></pre>

<h4>TRUNCATE TABLE - альтернатива DELETE:</h4>
<p>Если нужно удалить все строки из таблицы, лучше использовать команду TRUNCATE TABLE:</p>
<pre><code>TRUNCATE TABLE log_entries;</code></pre>
<p>TRUNCATE работает быстрее DELETE, так как не генерирует журнальные записи для каждой удаляемой строки. Однако TRUNCATE сбрасывает автоинкрементные счетчики и не может использоваться с условиями WHERE.</p>

<h4>Каскадное удаление и ограничения внешних ключей:</h4>
<p>При наличии ограничений внешних ключей, удаление строки может привести к разным результатам в зависимости от настроек:</p>
<ul>
    <li><strong>ON DELETE CASCADE</strong> - автоматически удаляет связанные строки в дочерних таблицах</li>
    <li><strong>ON DELETE RESTRICT</strong> или <strong>NO ACTION</strong> - запрещает удаление, если существуют связанные строки</li>
    <li><strong>ON DELETE SET NULL</strong> - устанавливает NULL в столбцах внешнего ключа связанных строк</li>
</ul>

<p><strong>Рекомендации по безопасному использованию DELETE:</strong></p>
<ul>
    <li>Всегда используйте условие WHERE, чтобы избежать удаления всех строк</li>
    <li>Сначала выполните SELECT с тем же условием WHERE, чтобы увидеть, какие строки будут удалены</li>
    <li>Используйте транзакции (BEGIN/COMMIT/ROLLBACK) для возможности отмены изменений</li>
    <li>Понимайте, как настроены ограничения внешних ключей и как они повлияют на удаление</li>
    <li>Для больших таблиц удаляй
	<li>Для больших таблиц удаляйте данные небольшими порциями (например, по 1000 строк), чтобы избежать блокировок и проблем с производительностью</li>

<p><strong>Примеры DELETE с различными условиями:</strong></p>
-- Удаление одной строки по первичному ключу
DELETE FROM customers WHERE customer_id = 145;

-- Удаление по диапазону дат
DELETE FROM orders WHERE order_date < '2020-01-01';

-- Удаление с использованием подзапроса
DELETE FROM products 
WHERE category_id IN (SELECT category_id FROM categories WHERE discontinued = 1);

-- Удаление с join-условием (синтаксис MySQL)
DELETE orders FROM orders 
JOIN customers ON orders.customer_id = customers.customer_id
WHERE customers.status = 'inactive';

-- Удаление с join-условием (синтаксис SQL Server)
DELETE FROM orders
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE c.status = 'inactive';
<p><strong>Контроль и логирование операций удаления:</strong></p>

Для критически важных систем рекомендуется:

Создавать триггеры, записывающие информацию об удаляемых строках в отдельную таблицу логов
Реализовать программный архив важных данных перед удалением
Разрабатывать механизмы "мягкого удаления" (soft delete), где данные помечаются как удаленные, но физически остаются в базе
<p><strong>Альтернативы DELETE для определенных сценариев:</strong></p>

Партиционирование и отсоединение разделов (DETACH PARTITION) для массового удаления исторических данных
Команда TRUNCATE TABLE для полной очистки таблицы (быстрее DELETE, но не поддерживает WHERE)
Временные решения с переименованием таблиц (создание новой таблицы с нужными данными и замена старой)
Понимание особенностей и последствий операции DELETE в вашей конкретной СУБД поможет избежать потери данных и обеспечит стабильную работу приложений.`,
			9: `<p>Ограничения (CONSTRAINTS) в SQL — это правила, применяемые к столбцам таблицы для обеспечения целостности и точности данных.</p>

<h4>Основные типы ограничений:</h4>
<ul>
<li><strong>NOT NULL</strong> - запрещает иметь значение NULL в столбце</li>
<li><strong>UNIQUE</strong> - гарантирует уникальность значений в столбце</li>
<li><strong>PRIMARY KEY</strong> - комбинация NOT NULL и UNIQUE, уникальный идентификатор</li>
<li><strong>FOREIGN KEY</strong> - обеспечивает ссылочную целостность между таблицами</li>
<li><strong>CHECK</strong> - гарантирует, что значения в столбце соответствуют условию</li>
<li><strong>DEFAULT</strong> - задаёт значение по умолчанию при отсутствии явно указанного значения</li>
</ul>

<h4>Примеры использования ограничений:</h4>

<p>Создание таблицы с различными ограничениями:</p>
<pre><code>CREATE TABLE products (
product_id INT PRIMARY KEY,
product_name VARCHAR(100) NOT NULL,
price DECIMAL(10, 2) CHECK (price > 0),
stock INT NOT NULL DEFAULT 0,
category_id INT,
sku VARCHAR(50) UNIQUE,
FOREIGN KEY (category_id) REFERENCES categories(category_id)
);</code></pre>

<h4>Добавление ограничений к существующей таблице:</h4>
<pre><code>-- Добавление ограничения NOT NULL
ALTER TABLE products
MODIFY product_name VARCHAR(100) NOT NULL;

-- Добавление ограничения UNIQUE
ALTER TABLE products
ADD CONSTRAINT unique_sku UNIQUE (sku);

-- Добавление ограничения CHECK
ALTER TABLE products
ADD CONSTRAINT price_positive CHECK (price > 0);

-- Добавление значения по умолчанию
ALTER TABLE products
ALTER COLUMN stock SET DEFAULT 0;</code></pre>

<h4>Удаление ограничений:</h4>
<pre><code>-- Удаление ограничения UNIQUE
ALTER TABLE products
DROP CONSTRAINT unique_sku;

-- Удаление ограничения CHECK
ALTER TABLE products
DROP CONSTRAINT price_positive;</code></pre>

<p><strong>Преимущества использования ограничений:</strong></p>
<ul>
<li>Обеспечение целостности данных</li>
<li>Предотвращение ввода недопустимых значений</li>
<li>Улучшение производительности запросов</li>
<li>Поддержание бизнес-правил на уровне базы данных</li>
</ul>`,
			10: `<p>Первичный ключ (PRIMARY KEY) — это специальное ограничение, которое однозначно идентифицирует каждую запись в таблице базы данных.</p>

<h4>Характеристики первичного ключа:</h4>
<ul>
<li><strong>Уникальность</strong> - значения первичного ключа должны быть уникальными</li>
<li><strong>Не NULL</strong> - первичный ключ не может содержать значение NULL</li>
<li><strong>Неизменяемость</strong> - хорошей практикой считается не изменять значения первичного ключа</li>
<li><strong>Стабильность</strong> - значения не должны меняться со временем</li>
</ul>

<h4>Создание таблицы с первичным ключом:</h4>
<pre><code>-- Одностолбцовый первичный ключ
CREATE TABLE customers (
customer_id INT PRIMARY KEY,
first_name VARCHAR(50),
last_name VARCHAR(50),
email VARCHAR(100)
);

-- Альтернативный синтаксис
CREATE TABLE customers (
customer_id INT,
first_name VARCHAR(50),
last_name VARCHAR(50),
email VARCHAR(100),
PRIMARY KEY (customer_id)
);

-- Составной первичный ключ (из нескольких столбцов)
CREATE TABLE order_items (
order_id INT,
product_id INT,
quantity INT,
price DECIMAL(10, 2),
PRIMARY KEY (order_id, product_id)
);</code></pre>

<h4>Добавление первичного ключа к существующей таблице:</h4>
<pre><code>ALTER TABLE customers
ADD PRIMARY KEY (customer_id);

-- Для составного первичного ключа
ALTER TABLE order_items
ADD PRIMARY KEY (order_id, product_id);</code></pre>

<h4>Удаление первичного ключа:</h4>
<pre><code>ALTER TABLE customers
DROP PRIMARY KEY;</code></pre>

<h4>Типы первичных ключей:</h4>
<ul>
<li><strong>Натуральные ключи</strong> - существующие атрибуты данных (например, номер паспорта)</li>
<li><strong>Суррогатные ключи</strong> - искусственно созданные значения, не имеющие бизнес-значения</li>
</ul>

<h4>Автоинкрементные первичные ключи:</h4>
<pre><code>-- MySQL
CREATE TABLE customers (
customer_id INT AUTO_INCREMENT PRIMARY KEY,
first_name VARCHAR(50),
last_name VARCHAR(50)
);

-- PostgreSQL
CREATE TABLE customers (
customer_id SERIAL PRIMARY KEY,
first_name VARCHAR(50),
last_name VARCHAR(50)
);

-- SQL Server
CREATE TABLE customers (
customer_id INT IDENTITY(1,1) PRIMARY KEY,
first_name VARCHAR(50),
last_name VARCHAR(50)
);</code></pre>

<p><strong>Лучшие практики:</strong></p>
<ul>
<li>Всегда определяйте первичный ключ для каждой таблицы</li>
<li>Используйте числовые типы данных для суррогатных ключей (INT, BIGINT)</li>
<li>Предпочитайте простые (одностолбцовые) первичные ключи составным</li>
<li>Для больших таблиц помните о размере первичного ключа (влияет на индексы)</li>
</ul>`,
			11: `<p>Внешний ключ (FOREIGN KEY) — это столбец или группа столбцов в таблице, который ссылается на первичный ключ в другой таблице. Внешние ключи необходимы для создания связей между таблицами и обеспечения ссылочной целостности.</p>

<h4>Назначение внешних ключей:</h4>
<ul>
<li>Создание связей между таблицами</li>
<li>Поддержание целостности данных</li>
<li>Предотвращение создания "сирот" - строк-потомков без родительских строк</li>
<li>Формирование структуры реляционной базы данных</li>
</ul>

<h4>Создание таблицы с внешним ключом:</h4>
<pre><code>-- Создание родительской таблицы
CREATE TABLE categories (
category_id INT PRIMARY KEY,
category_name VARCHAR(100) NOT NULL
);

-- Создание дочерней таблицы с внешним ключом
CREATE TABLE products (
product_id INT PRIMARY KEY,
product_name VARCHAR(100) NOT NULL,
category_id INT,
price DECIMAL(10, 2),
FOREIGN KEY (category_id) REFERENCES categories(category_id)
);</code></pre>

<h4>Добавление внешнего ключа к существующей таблице:</h4>
<pre><code>ALTER TABLE products
ADD CONSTRAINT fk_category
FOREIGN KEY (category_id) REFERENCES categories(category_id);</code></pre>

<h4>Действия при удалении/обновлении (ON DELETE/ON UPDATE):</h4>
<pre><code>-- CASCADE: автоматически удаляет или обновляет связанные строки
CREATE TABLE products (
product_id INT PRIMARY KEY,
product_name VARCHAR(100),
category_id INT,
FOREIGN KEY (category_id) REFERENCES categories(category_id)
ON DELETE CASCADE
ON UPDATE CASCADE
);

-- SET NULL: устанавливает столбец внешнего ключа в NULL
CREATE TABLE products (
product_id INT PRIMARY KEY,
product_name VARCHAR(100),
category_id INT,
FOREIGN KEY (category_id) REFERENCES categories(category_id)
ON DELETE SET NULL
ON UPDATE SET NULL
);

-- RESTRICT/NO ACTION: запрещает удаление родительской строки
CREATE TABLE products (
product_id INT PRIMARY KEY,
product_name VARCHAR(100),
category_id INT,
FOREIGN KEY (category_id) REFERENCES categories(category_id)
ON DELETE RESTRICT
ON UPDATE RESTRICT
);

-- SET DEFAULT: устанавливает столбец внешнего ключа в значение по умолчанию
CREATE TABLE products (
product_id INT PRIMARY KEY,
product_name VARCHAR(100),
category_id INT DEFAULT 1,
FOREIGN KEY (category_id) REFERENCES categories(category_id)
ON DELETE SET DEFAULT
ON UPDATE SET DEFAULT
);</code></pre>

<h4>Удаление внешнего ключа:</h4>
<pre><code>ALTER TABLE products
DROP CONSTRAINT fk_category;</code></pre>

<p><strong>Типы связей между таблицами:</strong></p>
<ul>
<li><strong>Один к одному (1:1)</strong> - каждая запись в таблице A связана с единственной записью в таблице B</li>
<li><strong>Один ко многим (1:N)</strong> - одна запись в таблице A связана с несколькими записями в таблице B</li>
<li><strong>Многие ко многим (M:N)</strong> - реализуется через промежуточную таблицу с внешними ключами к обеим исходным таблицам</li>
</ul>

<p><strong>Рекомендации по использованию внешних ключей:</strong></p>
<ul>
<li>Всегда создавайте индексы для столбцов внешнего ключа</li>
<li>Выбирайте правильное действие ON DELETE/ON UPDATE в зависимости от бизнес-правил</li>
<li>Учитывайте влияние каскадных действий на производительность</li>
<li>Рассмотрите создание внешних ключей, допускающих NULL, если связь необязательна</li>
</ul>`,
			12: `<p>Индексы в SQL — это структуры данных, которые улучшают скорость операций поиска в базе данных. Они работают аналогично индексу в книге, позволяя быстро находить нужные данные без необходимости сканировать всю таблицу.</p>

<h4>Преимущества использования индексов:</h4>
<ul>
<li>Ускорение операций выборки данных</li>
<li>Повышение эффективности сортировки</li>
<li>Оптимизация объединений таблиц (JOIN)</li>
<li>Обеспечение уникальности данных</li>
</ul>

<h4>Недостатки индексов:</h4>
<ul>
<li>Занимают дополнительное дисковое пространство</li>
<li>Замедляют операции вставки, обновления и удаления</li>
<li>Требуют обслуживания и анализа</li>
</ul>

<h4>Создание индексов:</h4>
<pre><code>-- Создание простого индекса
CREATE INDEX idx_customers_last_name
ON customers (last_name);

-- Создание составного индекса (по нескольким столбцам)
CREATE INDEX idx_customers_name
ON customers (last_name, first_name);

-- Создание уникального индекса
CREATE UNIQUE INDEX idx_products_sku
ON products (sku);

-- Создание индекса с условием (частичный индекс в PostgreSQL)
CREATE INDEX idx_orders_status
ON orders (status)
WHERE status = 'Processing';</code></pre>

<h4>Типы индексов:</h4>
<ul>
<li><strong>B-tree индексы</strong> - стандартный тип, подходит для большинства случаев</li>
<li><strong>Hash индексы</strong> - эффективны для точного сравнения, но не для диапазонов</li>
<li><strong>GiST/GIN индексы</strong> - специализированные индексы для полнотекстового поиска, геоданных и т.д.</li>
<li><strong>BRIN индексы</strong> - блочно-диапазонные индексы для очень больших таблиц с упорядоченными данными</li>
</ul>

<h4>Просмотр существующих индексов:</h4>
<pre><code>-- PostgreSQL
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'customers';

-- MySQL
SHOW INDEX FROM customers;

-- SQL Server
EXEC sp_helpindex 'customers';</code></pre>

<h4>Удаление индексов:</h4>
<pre><code>DROP INDEX idx_customers_last_name ON customers;</code>
-- В PostgreSQL также можно так:
DROP INDEX idx_customers_last_name;

-- В MySQL:
ALTER TABLE customers DROP INDEX idx_customers_last_name;</code></pre>

<h3>Анализ и оптимизация запросов</h3>

<h4>План выполнения запроса:</h4>
<pre><code>-- PostgreSQL
EXPLAIN ANALYZE
SELECT * FROM customers
WHERE last_name = 'Smith';

-- MySQL
EXPLAIN
SELECT * FROM customers
WHERE last_name = 'Smith';

-- SQL Server
SET STATISTICS IO, TIME ON;
SELECT * FROM customers
WHERE last_name = 'Smith';</code></pre>

<h4>Оптимизация JOIN-операций:</h4>

<p>Правильный порядок таблиц в JOIN-операциях имеет значение. Обычно эффективнее начинать с меньшей таблицы:</p>

<pre><code>-- Менее эффективно (если orders намного больше customers)
SELECT c.name, o.order_date
FROM orders o
JOIN customers c ON o.customer_id = c.id;

-- Более эффективно
SELECT c.name, o.order_date
FROM customers c
JOIN orders o ON c.id = o.customer_id;</code></pre>

<h4>Денормализация для производительности:</h4>

<p>В некоторых случаях хранение предварительно вычисленных или дублированных данных может значительно повысить производительность:</p>

<pre><code>-- Добавление суммарного поля в таблицу orders
ALTER TABLE orders ADD COLUMN total_amount DECIMAL(10, 2);

-- Обновление с помощью триггера при добавлении/обновлении деталей заказа
CREATE TRIGGER update_order_total
AFTER INSERT OR UPDATE ON order_items
FOR EACH ROW
BEGIN
UPDATE orders
SET total_amount = (
SELECT SUM(price * quantity)
FROM order_items
WHERE order_id = NEW.order_id
)
WHERE id = NEW.order_id;
END;</code></pre>

<h4>Партиционирование таблиц:</h4>

<p>Разделение большой таблицы на логические части по определенному критерию:</p>

<pre><code>-- PostgreSQL
CREATE TABLE orders (
id SERIAL,
order_date DATE NOT NULL,
customer_id INT,
amount DECIMAL(10, 2)
) PARTITION BY RANGE (order_date);

CREATE TABLE orders_2023 PARTITION OF orders
FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

CREATE TABLE orders_2024 PARTITION OF orders
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');</code></pre>

<h4>Материализованные представления:</h4>

<p>Кэширование результатов сложных запросов:</p>

<pre><code>-- PostgreSQL
CREATE MATERIALIZED VIEW monthly_sales AS
SELECT
DATE_TRUNC('month', order_date) AS month,
SUM(amount) AS total_sales
FROM orders
GROUP BY DATE_TRUNC('month', order_date);

-- Обновление материализованного представления
REFRESH MATERIALIZED VIEW monthly_sales;</code></pre>

<h4>Кэширование на уровне приложения:</h4>

<p>Использование Redis, Memcached или других систем кэширования для часто запрашиваемых данных.</p>

<h4>Оптимизация конфигурации СУБД:</h4>

<p>Основные параметры для настройки в PostgreSQL:</p>
<ul>
<li><strong>shared_buffers</strong> - обычно 25% от RAM</li>
<li><strong>work_mem</strong> - память для операций сортировки</li>
<li><strong>maintenance_work_mem</strong> - память для операций обслуживания</li>
<li><strong>effective_cache_size</strong> - оценка доступной памяти для кэширования</li>
<li><strong>max_connections</strong> - максимальное количество соединений</li>
</ul>

<h4>Регулярное обслуживание:</h4>

<pre><code>-- PostgreSQL
VACUUM ANALYZE; -- Очистка "мертвых" строк и обновление статистики
REINDEX TABLE large_table; -- Перестроение индексов

-- MySQL
OPTIMIZE TABLE large_table; -- Дефрагментация таблицы
ANALYZE TABLE large_table; -- Обновление статистики</code></pre>

<p>Эти методы оптимизации помогут значительно улучшить производительность вашей базы данных при правильном применении к конкретным ситуациям.</p>`,
			13: `<p>Импорт и экспорт данных – критически важные операции при работе с базами данных, позволяющие переносить информацию между системами или создавать резервные копии.</p>

<h4>Импорт данных в SQL базы данных:</h4>

<p><strong>CSV файлы (наиболее распространенный формат)</strong></p>
<pre><code>-- MySQL
LOAD DATA INFILE 'path/to/file.csv'
INTO TABLE table_name
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS; -- пропустить заголовок

-- PostgreSQL
COPY table_name(column1, column2, column3)
FROM 'path/to/file.csv'
DELIMITER ','
CSV HEADER;

-- SQL Server
BULK INSERT table_name
FROM 'path/to/file.csv'
WITH (
FIELDTERMINATOR = ',',
ROWTERMINATOR = '\n',
FIRSTROW = 2 -- пропустить заголовок
);</code></pre>

<p><strong>Импорт из SQL дампа</strong></p>
<pre><code>-- MySQL в командной строке
mysql -u username -p database_name < backup.sql

-- PostgreSQL в командной строке
psql -U username -d database_name -f backup.sql

-- SQL Server в командной строке
sqlcmd -S server_name -U username -P password -d database_name -i backup.sql</code></pre>

<h4>Экспорт данных из SQL баз данных:</h4>

<pre><code>-- MySQL экспорт в CSV
SELECT *
INTO OUTFILE 'path/to/output.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
FROM table_name;

-- PostgreSQL экспорт в CSV
COPY table_name TO 'path/to/output.csv' CSV HEADER;

-- SQL Server экспорт в CSV
SELECT *
FROM table_name
ORDER BY id
FOR XML PATH('row'), ROOT('root');</code></pre>

<p><strong>Создание SQL дампа (резервной копии)</strong></p>
<pre><code>-- MySQL в командной строке
mysqldump -u username -p database_name > backup.sql

-- PostgreSQL в командной строке
pg_dump -U username database_name > backup.sql

-- SQL Server в командной строке
sqlcmd -S server_name -U username -P password -Q "BACKUP DATABASE database_name TO DISK='backup.bak'"</code></pre>

<h4>Импорт с преобразованием данных:</h4>

<p>Часто необходимо трансформировать данные при импорте:</p>
<pre><code>-- Импорт с преобразованием дат
INSERT INTO target_table (name, birth_date)
SELECT name, STR_TO_DATE(birth_date, '%d/%m/%Y')
FROM temp_import_table;</code></pre>

<h4>Инструменты для работы с данными:</h4>
<ul>
<li><strong>MySQL Workbench</strong> - визуальное управление импортом/экспортом</li>
<li><strong>pgAdmin</strong> - GUI для PostgreSQL с функциями импорта/экспорта</li>
<li><strong>SQL Server Management Studio</strong> - мастер импорта/экспорта</li>
<li><strong>DBeaver</strong> - универсальный клиент с поддержкой множества СУБД</li>
<li><strong>Python с библиотеками pandas/SQLAlchemy</strong> - гибкие возможности ETL</li>
</ul>

<p><strong>Рекомендации по импорту/экспорту больших данных:</strong></p>
<ul>
<li>Делите большие файлы на части для поэтапной загрузки</li>
<li>Отключайте индексы и ограничения перед массовым импортом</li>
<li>Используйте транзакции для обеспечения целостности данных</li>
<li>Применяйте многопоточность для ускорения процесса</li>
<li>Следите за журналами операций и свободным пространством</li>
</ul>`,
			14: `<p>Нормализация данных — это процесс организации данных в базе данных путем создания таблиц и установления связей между ними с целью уменьшения избыточности и улучшения целостности данных.</p>

<h4>Зачем нужна нормализация?</h4>
<ul>
<li>Устранение избыточности данных (одни и те же данные не повторяются в нескольких местах)</li>
<li>Минимизация аномалий обновления (изменение данных происходит только в одном месте)</li>
<li>Обеспечение целостности данных (данные остаются согласованными)</li>
<li>Упрощение запросов (более логичная структура данных)</li>
</ul>

<h4>Нормальные формы:</h4>

<p><strong>Первая нормальная форма (1NF):</strong></p>
<ul>
<li>Каждая таблица имеет первичный ключ</li>
<li>Каждый столбец содержит только атомарные (неделимые) значения</li>
<li>Нет повторяющихся групп или массивов данных</li>
</ul>

<p>Пример ненормализованной таблицы:</p>
<pre><code>| client_id | client_name | phone_numbers           | products                       |
|-----------|-------------|-------------------------|--------------------------------|
| 1         | Иван Петров | 123-456, 789-012       | Монитор, Клавиатура, Мышь      |
| 2         | Анна Иванова| 345-678                | Ноутбук                        |</code></pre>

<p>Приведение к 1NF:</p>
<pre><code>-- Таблица клиентов
| client_id | client_name  |
|-----------|--------------|
| 1         | Иван Петров  |
| 2         | Анна Иванова |

-- Таблица телефонов
| phone_id | client_id | phone_number |
|----------|-----------|--------------|
| 1        | 1         | 123-456      |
| 2        | 1         | 789-012      |
| 3        | 2         | 345-678      |

-- Таблица заказов клиентов
| order_id | client_id | product_id |
|----------|-----------|------------|
| 1        | 1         | 1          |
| 2        | 1         | 2          |
| 3        | 1         | 3          |
| 4        | 2         | 4          |</code></pre>

<p><strong>Вторая нормальная форма (2NF):</strong></p>
<ul>
<li>Таблица уже в 1NF</li>
<li>Все неключевые атрибуты полностью зависят от первичного ключа</li>
<li>Устранены частичные зависимости (важно для составных ключей)</li>
</ul>

<p>Пример таблицы, не находящейся в 2NF:</p>
<pre><code>| order_id | product_id | client_id | quantity | product_name | client_name |
|----------|------------|-----------|----------|--------------|-------------|
| 1        | 101        | 1         | 2        | Монитор      | Иван Петров |
| 2        | 102        | 1         | 1        | Клавиатура   | Иван Петров |</code></pre>

<p>Проблема: product_name зависит только от product_id, а client_name — только от client_id</p>

<p>Приведение к 2NF:</p>
<pre><code>-- Таблица заказов
| order_id | product_id | client_id | quantity |
|----------|------------|-----------|----------|
| 1        | 101        | 1         | 2        |
| 2        | 102        | 1         | 1        |

-- Таблица продуктов
| product_id | product_name |
|------------|--------------|
| 101        | Монитор      |
| 102        | Клавиатура   |

-- Таблица клиентов
| client_id | client_name  |
|-----------|--------------|
| 1         | Иван Петров  |</code></pre>

<p><strong>Третья нормальная форма (3NF):</strong></p>
<ul>
<li>Таблица уже в 2NF</li>
<li>Нет транзитивных зависимостей</li>
<li>Все неключевые атрибуты зависят только от первичного ключа, а не от других неключевых атрибутов</li>
</ul>

<p>Пример таблицы, не находящейся в 3NF:</p>
<pre><code>| order_id | product_id | quantity | product_price | total_price |
|----------|------------|----------|--------------|-------------|
| 1        | 101        | 2        | 5000         | 10000       |
| 2        | 102        | 3        | 1500         | 4500        |</code></pre>

<p>Проблема: total_price зависит от product_price и quantity, а не напрямую от первичного ключа</p>

<p>Приведение к 3NF:</p>
<pre><code>| order_id | product_id | quantity | product_price |
|----------|------------|----------|--------------|
| 1        | 101        | 2        | 5000         |
| 2        | 102        | 3        | 1500         |</code></pre>

<p>Total_price можно вычислить: product_price * quantity</p>

<h4>Нормальная форма Бойса-Кодда (BCNF):</h4>
<ul>
<li>Строгая версия 3NF</li>
<li>Для любой нетривиальной функциональной зависимости X → A, X должен быть суперключом</li>
</ul>

<h4>Четвертая и пятая нормальные формы:</h4>
<p>Эти формы рассматривают многозначные зависимости и зависимости соединения, но используются реже.</p>

<h4>Денормализация:</h4>
<p>В некоторых случаях полная нормализация может негативно влиять на производительность. Денормализация — это процесс намеренного добавления избыточности для повышения производительности.</p>

<p>Случаи, когда может быть оправдана денормализация:</p>
<ul>
<li>Часто выполняемые сложные JOIN-операции</li>
<li>Таблицы, которые редко обновляются, но часто читаются</li>
<li>Необходимость в быстром получении агрегированных данных</li>
</ul>

<p><strong>Важно помнить:</strong> Всегда сначала нормализуйте базу данных, а затем, если необходимо, выборочно денормализуйте для решения конкретных проблем производительности.</p>`,
			15: `<p>Оптимизация запросов SQL – ключевой навык для повышения производительности баз данных. Эффективные запросы обеспечивают быстрый отклик и экономию ресурсов сервера.</p>

<h4>Основные принципы оптимизации запросов:</h4>

<p><strong>1. Используйте правильные индексы</strong></p>
<pre><code>-- Создание подходящего индекса для часто используемых столбцов в WHERE
CREATE INDEX idx_customers_last_name ON customers(last_name);

-- Составной индекс для фильтрации по нескольким столбцам
CREATE INDEX idx_orders_date_status ON orders(order_date, status);

-- Проверка использования индексов
EXPLAIN SELECT * FROM customers WHERE last_name = 'Smith';</code></pre>

<p><strong>2. Избегайте выборки ненужных столбцов (SELECT *)</strong></p>
<pre><code>-- Плохо (возвращает все столбцы)
SELECT * FROM products WHERE category_id = 5;

-- Хорошо (возвращает только нужные столбцы)
SELECT product_id, product_name, price
FROM products WHERE category_id = 5;</code></pre>

<p><strong>3. Используйте эффективные условия WHERE</strong></p>
<pre><code>-- Индексы не будут использоваться
SELECT * FROM customers WHERE YEAR(registration_date) = 2023;

-- Лучший вариант (может использовать индекс)
SELECT * FROM customers
WHERE registration_date BETWEEN '2023-01-01' AND '2023-12-31';</code></pre>

<p><strong>4. Избегайте функций в WHERE для индексированных столбцов</strong></p>
<pre><code>-- Плохо (не использует индекс)
SELECT * FROM customers WHERE LOWER(email) = 'mailto:example@mail.com';

-- Хорошо (может использовать индекс)
SELECT * FROM customers WHERE email = 'mailto:example@mail.com';</code></pre>

<p><strong>5. Используйте JOIN вместо подзапросов</strong></p>
<pre><code>-- Менее эффективно (подзапрос)
SELECT * FROM orders
WHERE customer_id IN (SELECT customer_id FROM customers WHERE city = 'New York');

-- Более эффективно (JOIN)
SELECT o.*
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE c.city = 'New York';</code></pre>

<p><strong>6. Используйте EXISTS вместо IN для больших наборов данных</strong></p>
<pre><code>-- Менее эффективно для больших списков
SELECT * FROM customers
WHERE customer_id IN (SELECT customer_id FROM orders WHERE total > 1000);

-- Более эффективно
SELECT * FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o
WHERE o.customer_id = c.customer_id AND o.total > 1000);</code></pre>

<p><strong>7. Оптимизируйте сортировку с помощью индексов</strong></p>
<pre><code>-- Создайте индекс для часто используемых столбцов сортировки
CREATE INDEX idx_products_price ON products(price);

-- Теперь сортировка может использовать индекс
SELECT * FROM products ORDER BY price DESC LIMIT 10;</code></pre>

<p><strong>8. Используйте LIMIT для ограничения результатов</strong></p>
<pre><code>-- Без ограничения (возвращает все строки)
SELECT * FROM log_entries ORDER BY created_at DESC;

-- С ограничением (возвращает только 100 строк)
SELECT * FROM log_entries ORDER BY created_at DESC LIMIT 100;</code></pre>

<p><strong>9. Оптимизируйте запросы с GROUP BY</strong></p>
<pre><code>-- Добавьте индексы для столбцов, используемых в GROUP BY
CREATE INDEX idx_orders_customer_id ON orders(customer_id);

-- Запрос будет выполняться быстрее
SELECT customer_id, COUNT(*), SUM(total)
FROM orders
GROUP BY customer_id;</code></pre>

<p><strong>10. Используйте временные таблицы для сложных запросов</strong></p>
<pre><code>-- Создайте временную таблицу
CREATE TEMPORARY TABLE high_value_customers AS
SELECT customer_id, SUM(total) as total_spent
FROM orders
GROUP BY customer_id
HAVING SUM(total) > 10000;

-- Используйте временную таблицу в последующих запросах
SELECT c.*, hvc.total_spent
FROM customers c
JOIN high_value_customers hvc ON c.customer_id = hvc.customer_id;</code></pre>

<p><strong>11. Минимизируйте использование OR в WHERE</strong></p>
<pre><code>-- Менее эффективно
SELECT * FROM products
WHERE category_id = 5 OR category_id = 7;

-- Более эффективно
SELECT * FROM products
WHERE category_id IN (5, 7);</code></pre>

<p><strong>12. Используйте UNION ALL вместо UNION, когда возможно</strong></p>
<pre><code>-- UNION выполняет удаление дубликатов (медленнее)
SELECT * FROM products_2022
UNION
SELECT * FROM products_2023;

-- UNION ALL не выполняет удаление дубликатов (быстрее)
SELECT * FROM products_2022
UNION ALL
SELECT * FROM products_2023;</code></pre>`,
			16: `<p>Проектирование базы данных — это процесс создания схемы данных, определения таблиц, их структуры и связей между ними. В этом практическом уроке мы рассмотрим полный процесс проектирования базы данных для интернет-магазина.</p>

<h4>Этапы проектирования базы данных:</h4>
<ul>
<li>Анализ требований</li>
<li>Концептуальное проектирование</li>
<li>Логическое проектирование</li>
<li>Физическое проектирование</li>
<li>Реализация и тестирование</li>
</ul>

<h4>Шаг 1: Анализ требований для интернет-магазина</h4>

<p>Определим основные сущности и их атрибуты:</p>
<ul>
<li><strong>Пользователи</strong>: id, имя, email, пароль, адрес, телефон, дата регистрации</li>
<li><strong>Товары</strong>: id, название, описание, цена, остаток на складе, категория</li>
<li><strong>Категории</strong>: id, название, описание, родительская категория</li>
<li><strong>Заказы</strong>: id, пользователь, статус, дата создания, общая сумма</li>
<li><strong>Элементы заказа</strong>: id заказа, id товара, количество, цена на момент заказа</li>
</ul>

<h4>Шаг 2: Создание ER-диаграммы (Entity-Relationship)</h4>

<p>ER-диаграмма показывает связи между сущностями:</p>
<ul>
<li>Пользователь (1) → Заказы (∞): один пользователь может иметь множество заказов</li>
<li>Категория (1) → Товары (∞): одна категория может содержать множество товаров</li>
<li>Товары (∞) ↔ Заказы (∞): связь "многие ко многим" через таблицу элементов заказа</li>
<li>Категория (1) → Категории (∞): самоссылающееся отношение для иерархии категорий</li>
</ul>

<h4>Шаг 3: Создание таблиц и определение связей</h4>

<pre><code>-- Создание таблицы пользователей
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Создание таблицы категорий (с самоссылкой для иерархии)
CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INT,
    FOREIGN KEY (parent_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

-- Создание таблицы товаров
CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    category_id INT,
    image_url VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    INDEX idx_category (category_id),
    INDEX idx_name (name)
);

-- Создание таблицы заказов
CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'canceled') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    shipping_address TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
	);

-- Создание таблицы элементов заказа
CREATE TABLE order_items (
order_item_id INT PRIMARY KEY AUTO_INCREMENT,
order_id INT NOT NULL,
product_id INT NOT NULL,
quantity INT NOT NULL CHECK (quantity > 0),
price_per_unit DECIMAL(10, 2) NOT NULL,
FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
INDEX idx_order (order_id),
INDEX idx_product (product_id)
);

-- Создание таблицы отзывов о продуктах
CREATE TABLE reviews (
review_id INT PRIMARY KEY AUTO_INCREMENT,
product_id INT NOT NULL,
user_id INT NOT NULL,
rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
comment TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
UNIQUE KEY unique_review (product_id, user_id),
INDEX idx_product (product_id),
INDEX idx_user (user_id)
);

-- Создание таблицы для корзины покупок
CREATE TABLE cart_items (
cart_item_id INT PRIMARY KEY AUTO_INCREMENT,
user_id INT NOT NULL,
product_id INT NOT NULL,
quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
UNIQUE KEY unique_cart_item (user_id, product_id),
INDEX idx_user (user_id)
);

-- Создание таблицы для платежей
CREATE TABLE payments (
payment_id INT PRIMARY KEY AUTO_INCREMENT,
order_id INT NOT NULL,
amount DECIMAL(10, 2) NOT NULL,
payment_method ENUM('credit_card', 'debit_card', 'paypal', 'bank_transfer') NOT NULL,
status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
transaction_id VARCHAR(100),
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
INDEX idx_order (order_id),
INDEX idx_status (status)
);

-- Создание таблицы для списка желаний пользователя
CREATE TABLE wishlist (
wishlist_id INT PRIMARY KEY AUTO_INCREMENT,
user_id INT NOT NULL,
product_id INT NOT NULL,
added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
UNIQUE KEY unique_wishlist_item (user_id, product_id),
INDEX idx_user (user_id)
);

-- Создание таблицы для хранения информации о доставке
CREATE TABLE shipping (
shipping_id INT PRIMARY KEY AUTO_INCREMENT,
order_id INT NOT NULL,
carrier VARCHAR(100),
tracking_number VARCHAR(100),
status ENUM('pending', 'in_transit', 'delivered') DEFAULT 'pending',
estimated_delivery DATETIME,
shipped_at DATETIME,
delivered_at DATETIME,
FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
INDEX idx_order (order_id),
INDEX idx_status (status)
);

-- Добавление процедур и триггеров

-- Триггер для обновления общей суммы заказа при добавлении или изменении элементов заказа
DELIMITER //
CREATE TRIGGER update_order_total AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
UPDATE orders SET total_amount = (
SELECT SUM(price_per_unit * quantity)
FROM order_items
WHERE order_id = NEW.order_id
)
WHERE order_id = NEW.order_id;
END;
//
DELIMITER ;

-- Триггер для уменьшения количества товара при создании заказа
DELIMITER //
CREATE TRIGGER reduce_stock_quantity AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
UPDATE products
SET stock_quantity = stock_quantity - NEW.quantity
WHERE product_id = NEW.product_id;
END;
//
DELIMITER ;`
        },
        2: {
            1: `<p>JOIN используется для объединения данных из двух или более таблиц.</p>
                <p>Основные типы JOIN:</p>
                <ul>
                    <li>INNER JOIN - возвращает строки, где есть совпадения в обеих таблицах</li>
                    <li>LEFT JOIN - возвращает все строки из левой таблицы и совпадения из правой</li>
                    <li>RIGHT JOIN - возвращает все строки из правой таблицы и совпадения из левой</li>
                    <li>FULL JOIN - возвращает строки, когда есть совпадение в одной из таблиц</li>
                </ul>
                <p>Пример INNER JOIN:</p>
                <pre><code>SELECT e.first_name, e.last_name, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id;</code></pre>`,
            2: `<p>GROUP BY группирует строки по значениям указанных столбцов.</p>
                <p>Пример:</p>
                <pre><code>SELECT department_id, COUNT(*) as employee_count
FROM employees
GROUP BY department_id;</code></pre>
                <p>HAVING используется для фильтрации групп (аналог WHERE для GROUP BY):</p>
                <pre><code>SELECT department_id, COUNT(*) as employee_count
FROM employees
GROUP BY department_id
HAVING COUNT(*) > 5;</code></pre>`,
            3: `<p>Агрегатные функции выполняют вычисления на наборе значений:</p>
                <ul>
                    <li>COUNT() - подсчет строк</li>
                    <li>SUM() - сумма значений</li>
                    <li>AVG() - среднее значение</li>
                    <li>MIN() - минимальное значение</li>
                    <li>MAX() - максимальное значение</li>
                </ul>
                <p>Примеры:</p>
                <pre><code>SELECT COUNT(*) FROM employees;</code></pre>
                <pre><code>SELECT AVG(salary) FROM employees;</code></pre>
                <pre><code>SELECT department_id, MAX(salary) 
FROM employees GROUP BY department_id;</code></pre>`,
            4: `<p>Подзапросы - это запросы, вложенные в другие запросы.</p>
                <p>Пример подзапроса в WHERE:</p>
                <pre><code>SELECT first_name, last_name 
FROM employees 
WHERE salary > (SELECT AVG(salary) FROM employees);</code></pre>
                <p>Подзапрос в FROM:</p>
                <pre><code>SELECT dept.department_name, emp_count.count
FROM departments dept
JOIN (SELECT department_id, COUNT(*) as count 
      FROM employees GROUP BY department_id) emp_count
ON dept.department_id = emp_count.department_id;</code></pre>`,
            5: `<p>UNION объединяет результаты двух или более SELECT-запросов в один набор данных.</p>

<h4>Типы операций объединения:</h4>
<ul>
<li><strong>UNION</strong> - объединяет результаты и удаляет дубликаты</li>
<li><strong>UNION ALL</strong> - объединяет результаты без удаления дубликатов (быстрее)</li>
<li><strong>INTERSECT</strong> - возвращает общие строки (поддерживается не всеми СУБД)</li>
<li><strong>EXCEPT/MINUS</strong> - возвращает строки из первого запроса, отсутствующие во втором</li>
</ul>

<h4>Основные правила UNION:</h4>
<ul>
<li>Количество столбцов в запросах должно совпадать</li>
<li>Типы данных соответствующих столбцов должны быть совместимы</li>
<li>Имена столбцов берутся из первого запроса</li>
<li>ORDER BY применяется к итоговому результату</li>
</ul>

<h4>Примеры использования UNION:</h4>
<p>Объединение списков клиентов и поставщиков:</p>
<pre><code>SELECT name, email, 'Customer' as type FROM customers
UNION
SELECT company_name, contact_email, 'Supplier' as type FROM suppliers
ORDER BY name;</code></pre>

<p>Получение продаж за разные периоды:</p>
<pre><code>SELECT 'Q1 2023' as period, SUM(amount) as total
FROM sales WHERE date BETWEEN '2023-01-01' AND '2023-03-31'
UNION ALL
SELECT 'Q2 2023' as period, SUM(amount) as total
FROM sales WHERE date BETWEEN '2023-04-01' AND '2023-06-30';</code></pre>

<p>Поиск неактивных пользователей:</p>
<pre><code>SELECT customer_id, last_name, first_name FROM customers
WHERE last_login < DATE_SUB(NOW(), INTERVAL 6 MONTH)
UNION
SELECT customer_id, last_name, first_name FROM customers
WHERE registration_date < DATE_SUB(NOW(), INTERVAL 1 YEAR)
AND total_orders = 0;</code></pre>

<h4>INTERSECT - пересечение множеств:</h4>
<pre><code>-- PostgreSQL, SQL Server
SELECT customer_id FROM customers_2022
INTERSECT
SELECT customer_id FROM customers_2023;</code></pre>

<h4>EXCEPT/MINUS - разность множеств:</h4>
<pre><code>-- Клиенты, которые были в 2022, но нет в 2023
SELECT customer_id FROM customers_2022
EXCEPT
SELECT customer_id FROM customers_2023;</code></pre>`,
            6: `<p>Оконные функции (Window Functions) позволяют выполнять вычисления над набором строк, связанных с текущей строкой, без группировки данных.</p>

<h4>Основные оконные функции:</h4>
<ul>
<li><strong>ROW_NUMBER()</strong> - порядковый номер строки</li>
<li><strong>RANK()</strong> - ранг с пропусками</li>
<li><strong>DENSE_RANK()</strong> - плотный ранг без пропусков</li>
<li><strong>NTILE(n)</strong> - разделение на n групп</li>
<li><strong>LAG()/LEAD()</strong> - доступ к предыдущей/следующей строке</li>
<li><strong>FIRST_VALUE()/LAST_VALUE()</strong> - первое/последнее значение в окне</li>
</ul>

<h4>Синтаксис оконных функций:</h4>
<pre><code>SELECT column1, column2,
       window_function() OVER (
           PARTITION BY column1 
           ORDER BY column2 
           ROWS/RANGE frame_specification
       )
FROM table_name;</code></pre>

<h4>Примеры использования:</h4>
<p>Нумерация строк:</p>
<pre><code>SELECT 
    employee_id,
    first_name,
    last_name,
    salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC) as row_num
FROM employees;</code></pre>

<p>Ранжирование по отделам:</p>
<pre><code>SELECT 
    employee_id,
    department_id,
    salary,
    RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as dept_rank,
    DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as dense_rank
FROM employees;</code></pre>

<p>Сравнение с предыдущим значением:</p>
<pre><code>SELECT 
    order_date,
    total_amount,
    LAG(total_amount, 1) OVER (ORDER BY order_date) as prev_amount,
    total_amount - LAG(total_amount, 1) OVER (ORDER BY order_date) as difference
FROM daily_sales;</code></pre>

<p>Накопительная сумма:</p>
<pre><code>SELECT 
    order_date,
    daily_total,
    SUM(daily_total) OVER (ORDER BY order_date ROWS UNBOUNDED PRECEDING) as running_total
FROM daily_sales;</code></pre>

<p>Процентиль от общей суммы:</p>
<pre><code>SELECT 
    employee_id,
    salary,
    ROUND(salary * 100.0 / SUM(salary) OVER (), 2) as percentage_of_total
FROM employees;</code></pre>

<h4>Рамки окна (Window Frames):</h4>
<ul>
<li><strong>ROWS UNBOUNDED PRECEDING</strong> - от начала до текущей строки</li>
<li><strong>ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING</strong> - текущая строка и соседние</li>
<li><strong>RANGE BETWEEN INTERVAL '7' DAY PRECEDING AND CURRENT ROW</strong> - диапазон по значениям</li>
</ul>`,
            7: `<p>CTE (Common Table Expressions) или "обычные табличные выражения" позволяют создавать временные именованные результирующие наборы в рамках одного запроса.</p>

<h4>Преимущества CTE:</h4>
<ul>
<li>Улучшение читаемости сложных запросов</li>
<li>Возможность рекурсивных запросов</li>
<li>Повторное использование в рамках одного запроса</li>
<li>Альтернатива вложенным подзапросам</li>
</ul>

<h4>Синтаксис простого CTE:</h4>
<pre><code>WITH cte_name (column1, column2, ...) AS (
    SELECT ...
    FROM ...
    WHERE ...
)
SELECT ...
FROM cte_name
WHERE ...;</code></pre>

<h4>Примеры использования CTE:</h4>
<p>Простой CTE для расчета средней зарплаты:</p>
<pre><code>WITH avg_salaries AS (
    SELECT 
        department_id,
        AVG(salary) as avg_dept_salary
    FROM employees
    GROUP BY department_id
)
SELECT 
    e.employee_id,
    e.first_name,
    e.salary,
    a.avg_dept_salary,
    e.salary - a.avg_dept_salary as salary_diff
FROM employees e
JOIN avg_salaries a ON e.department_id = a.department_id;</code></pre>

<p>Множественные CTE:</p>
<pre><code>WITH 
high_performers AS (
    SELECT employee_id, first_name, last_name, salary
    FROM employees 
    WHERE salary > 50000
),
department_stats AS (
    SELECT 
        department_id,
        COUNT(*) as total_employees,
        AVG(salary) as avg_salary
    FROM employees
    GROUP BY department_id
)
SELECT 
    hp.first_name,
    hp.last_name,
    hp.salary,
    ds.avg_salary
FROM high_performers hp
JOIN employees e ON hp.employee_id = e.employee_id
JOIN department_stats ds ON e.department_id = ds.department_id;</code></pre>

<h4>Рекурсивные CTE:</h4>
<p>Обход иерархических данных (например, организационная структура):</p>
<pre><code>WITH RECURSIVE employee_hierarchy AS (
    -- Базовый случай: топ-менеджеры
    SELECT 
        employee_id,
        first_name,
        last_name,
        manager_id,
        1 as level,
        CAST(first_name + ' ' + last_name AS VARCHAR(1000)) as path
    FROM employees 
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Рекурсивная часть
    SELECT 
        e.employee_id,
        e.first_name,
        e.last_name,
        e.manager_id,
        eh.level + 1,
        eh.path + ' -> ' + e.first_name + ' ' + e.last_name
    FROM employees e
    JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id
)
SELECT 
    employee_id,
    REPLICATE('  ', level - 1) + first_name + ' ' + last_name as hierarchy,
    level,
    path
FROM employee_hierarchy
ORDER BY path;</code></pre>

<p>Генерация последовательности дат:</p>
<pre><code>WITH RECURSIVE date_series AS (
    SELECT DATE '2023-01-01' as date_value
    UNION ALL
    SELECT date_value + INTERVAL 1 DAY
    FROM date_series 
    WHERE date_value < DATE '2023-12-31'
)
SELECT 
    ds.date_value,
    COALESCE(s.total_sales, 0) as daily_sales
FROM date_series ds
LEFT JOIN daily_sales s ON ds.date_value = s.sale_date
ORDER BY ds.date_value;</code></pre>`,
            8: `<p>Агрегатные оконные функции позволяют выполнять вычисления агрегатов в рамках определенного окна без группировки всего результата.</p>

<h4>Основные агрегатные оконные функции:</h4>
<ul>
<li><strong>SUM() OVER</strong> - накопительная сумма</li>
<li><strong>AVG() OVER</strong> - скользящее среднее</li>
<li><strong>COUNT() OVER</strong> - накопительный счетчик</li>
<li><strong>MIN()/MAX() OVER</strong> - минимум/максимум в окне</li>
</ul>

<h4>Накопительная сумма (Running Total):</h4>
<pre><code>SELECT 
    order_date,
    order_amount,
    SUM(order_amount) OVER (
        ORDER BY order_date 
        ROWS UNBOUNDED PRECEDING
    ) as running_total
FROM orders
ORDER BY order_date;</code></pre>

<h4>Скользящее среднее за 3 месяца:</h4>
<pre><code>SELECT 
    month_year,
    monthly_sales,
    AVG(monthly_sales) OVER (
        ORDER BY month_year 
        ROWS 2 PRECEDING
    ) as moving_avg_3months
FROM monthly_sales;</code></pre>

<h4>Процент от общей суммы по категориям:</h4>
<pre><code>SELECT 
    category,
    product_name,
    sales_amount,
    ROUND(
        sales_amount * 100.0 / 
        SUM(sales_amount) OVER (PARTITION BY category), 2
    ) as percent_of_category
FROM product_sales;</code></pre>

<h4>Накопительный процент:</h4>
<pre><code>SELECT 
    product_name,
    sales_amount,
    SUM(sales_amount) OVER (ORDER BY sales_amount DESC) as running_total,
    ROUND(
        SUM(sales_amount) OVER (ORDER BY sales_amount DESC) * 100.0 / 
        SUM(sales_amount) OVER (), 2
    ) as cumulative_percent
FROM product_sales
ORDER BY sales_amount DESC;</code></pre>`,
            9: `<p>Функции ранжирования позволяют присваивать ранги строкам на основе значений в указанных столбцах.</p>

<h4>Основные функции ранжирования:</h4>
<ul>
<li><strong>ROW_NUMBER()</strong> - уникальный номер строки</li>
<li><strong>RANK()</strong> - ранг с пропусками при одинаковых значениях</li>
<li><strong>DENSE_RANK()</strong> - плотный ранг без пропусков</li>
<li><strong>NTILE(n)</strong> - разделение на n равных групп</li>
<li><strong>PERCENT_RANK()</strong> - процентильный ранг</li>
<li><strong>CUME_DIST()</strong> - кумулятивное распределение</li>
</ul>

<h4>Сравнение функций ранжирования:</h4>
<pre><code>SELECT 
    employee_name,
    salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC) as row_num,
    RANK() OVER (ORDER BY salary DESC) as rank_gaps,
    DENSE_RANK() OVER (ORDER BY salary DESC) as dense_rank,
    NTILE(4) OVER (ORDER BY salary DESC) as quartile
FROM employees;</code></pre>

<h4>Топ-3 в каждом отделе:</h4>
<pre><code>WITH ranked_employees AS (
    SELECT 
        department_id,
        employee_name,
        salary,
        DENSE_RANK() OVER (
            PARTITION BY department_id 
            ORDER BY salary DESC
        ) as dept_rank
    FROM employees
)
SELECT department_id, employee_name, salary
FROM ranked_employees
WHERE dept_rank <= 3;</code></pre>

<h4>Процентили и распределения:</h4>
<pre><code>SELECT 
    product_name,
    price,
    PERCENT_RANK() OVER (ORDER BY price) as percent_rank,
    CUME_DIST() OVER (ORDER BY price) as cumulative_dist,
    CASE 
        WHEN PERCENT_RANK() OVER (ORDER BY price) < 0.25 THEN 'Дешевые'
        WHEN PERCENT_RANK() OVER (ORDER BY price) < 0.75 THEN 'Средние'
        ELSE 'Дорогие'
    END as price_category
FROM products;</code></pre>

<h4>Медиана с помощью PERCENTILE_CONT:</h4>
<pre><code>SELECT 
    department_id,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) as median_salary,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY salary) as q1,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY salary) as q3
FROM employees
GROUP BY department_id;</code></pre>`,
            10: `<p>CTE (Common Table Expressions) уже был рассмотрен в предыдущем уроке. Здесь представлены дополнительные техники.</p>

<h4>Множественные CTE для сложной аналитики:</h4>
<pre><code>WITH 
sales_by_month AS (
    SELECT 
        DATE_FORMAT(order_date, '%Y-%m') as month,
        SUM(amount) as monthly_sales
    FROM orders
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
),
sales_growth AS (
    SELECT 
        month,
        monthly_sales,
        LAG(monthly_sales) OVER (ORDER BY month) as prev_month_sales,
        monthly_sales - LAG(monthly_sales) OVER (ORDER BY month) as growth
    FROM sales_by_month
),
performance_rating AS (
    SELECT 
        month,
        monthly_sales,
        growth,
        CASE 
            WHEN growth > 0 THEN 'Рост'
            WHEN growth < 0 THEN 'Спад'
            ELSE 'Стабильно'
        END as trend
    FROM sales_growth
)
SELECT * FROM performance_rating
WHERE growth IS NOT NULL
ORDER BY month;</code></pre>`,
            11: `<p>Рекурсивные CTE позволяют обрабатывать иерархические данные и создавать циклические запросы.</p>

<h4>Структура рекурсивного CTE:</h4>
<ul>
<li><strong>Якорная часть</strong> - начальные условия (базовый случай)</li>
<li><strong>UNION ALL</strong> - объединение</li>
<li><strong>Рекурсивная часть</strong> - ссылка на само CTE</li>
</ul>

<h4>Обход дерева организации:</h4>
<pre><code>WITH RECURSIVE org_tree AS (
    -- Якорная часть: находим корневые элементы
    SELECT 
        employee_id,
        name,
        manager_id,
        1 as level,
        CAST(name AS VARCHAR(1000)) as path
    FROM employees 
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Рекурсивная часть
    SELECT 
        e.employee_id,
        e.name,
        e.manager_id,
        ot.level + 1,
        CONCAT(ot.path, ' -> ', e.name)
    FROM employees e
    INNER JOIN org_tree ot ON e.manager_id = ot.employee_id
    WHERE ot.level < 10  -- Защита от бесконечной рекурсии
)
SELECT 
    employee_id,
    REPEAT('  ', level - 1) || name as hierarchy,
    level,
    path
FROM org_tree
ORDER BY path;</code></pre>

<h4>Построение последовательности чисел:</h4>
<pre><code>WITH RECURSIVE number_series AS (
    SELECT 1 as n
    UNION ALL
    SELECT n + 1
    FROM number_series
    WHERE n < 100
)
SELECT n FROM number_series;</code></pre>

<h4>Факториал с рекурсией:</h4>
<pre><code>WITH RECURSIVE factorial AS (
    SELECT 1 as n, 1 as fact
    UNION ALL
    SELECT n + 1, (n + 1) * fact
    FROM factorial
    WHERE n < 10
)
SELECT n, fact FROM factorial;</code></pre>

<h4>Обход графа связей (друзья друзей):</h4>
<pre><code>WITH RECURSIVE friend_network AS (
    SELECT 
        user_id,
        friend_id,
        1 as degree,
        ARRAY[user_id] as path
    FROM friendships
    WHERE user_id = 123  -- Начальный пользователь
    
    UNION ALL
    
    SELECT 
        fn.user_id,
        f.friend_id,
        fn.degree + 1,
        fn.path || f.user_id
    FROM friend_network fn
    JOIN friendships f ON fn.friend_id = f.user_id
    WHERE fn.degree < 3  -- Максимум 3 степени разделения
    AND NOT (f.user_id = ANY(fn.path))  -- Избегаем циклов
)
SELECT DISTINCT friend_id, MIN(degree) as closest_degree
FROM friend_network
GROUP BY friend_id
ORDER BY closest_degree;</code></pre>`,
            12: `<p>Динамический SQL позволяет создавать и выполнять SQL-запросы во время выполнения программы.</p>

<h4>Основные методы динамического SQL:</h4>
<ul>
<li><strong>EXECUTE</strong> - выполнение строки как SQL-команды</li>
<li><strong>Подготовленные выражения (PREPARE/EXECUTE)</strong></li>
<li><strong>Конкатенация строк для построения запросов</strong></li>
</ul>

<h4>Простой пример динамического SQL (PostgreSQL):</h4>
<pre><code>DO $$
DECLARE
    table_name TEXT := 'employees';
    sql_query TEXT;
BEGIN
    sql_query := 'SELECT COUNT(*) FROM ' || table_name;
    EXECUTE sql_query;
END $$;</code></pre>

<h4>Динамическое создание сводной таблицы:</h4>
<pre><code>-- SQL Server
DECLARE @sql NVARCHAR(MAX) = ''
DECLARE @columns NVARCHAR(MAX) = ''

-- Получаем список уникальных значений для PIVOT
SELECT @columns = STRING_AGG(QUOTENAME(category), ',')
FROM (SELECT DISTINCT category FROM products) as categories

-- Строим динамический PIVOT запрос
SET @sql = '
SELECT vendor_name, ' + @columns + '
FROM (
    SELECT vendor_name, category, price
    FROM products
) as source_table
PIVOT (
    AVG(price) FOR category IN (' + @columns + ')
) as pivot_table'

EXEC sp_executesql @sql</code></pre>

<h4>Динамическая фильтрация:</h4>
<pre><code>-- MySQL
SET @where_clause = '';
SET @order_clause = 'ORDER BY employee_id';

-- Условно добавляем фильтры
SET @department_filter = 'IT';
IF @department_filter IS NOT NULL THEN
    SET @where_clause = CONCAT('WHERE department = "', @department_filter, '"');
END IF;

-- Строим запрос
SET @sql = CONCAT(
    'SELECT employee_id, name, salary FROM employees ',
    @where_clause, ' ',
    @order_clause
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;</code></pre>

<h4>Параметризованный динамический SQL:</h4>
<pre><code>-- PostgreSQL
CREATE OR REPLACE FUNCTION get_top_employees(
    dept_name VARCHAR DEFAULT NULL,
    top_count INTEGER DEFAULT 10
)
RETURNS TABLE(employee_id INTEGER, name VARCHAR, salary DECIMAL)
AS $$
DECLARE
    sql_query TEXT;
BEGIN
    sql_query := 'SELECT employee_id, name, salary FROM employees';
    
    IF dept_name IS NOT NULL THEN
        sql_query := sql_query || ' WHERE department = $1';
    END IF;
    
    sql_query := sql_query || ' ORDER BY salary DESC LIMIT $2';
    
    IF dept_name IS NOT NULL THEN
        RETURN QUERY EXECUTE sql_query USING dept_name, top_count;
    ELSE
        RETURN QUERY EXECUTE sql_query USING top_count;
    END IF;
END;
$$ LANGUAGE plpgsql;</code></pre>

<h4>⚠️ Важные предупреждения:</h4>
<ul>
<li>Всегда валидируйте входные данные</li>
<li>Используйте параметризованные запросы</li>
<li>Остерегайтесь SQL-инъекций</li>
<li>Кэшируйте подготовленные выражения когда возможно</li>
</ul>`,
            13: `<p>Хранимые процедуры и функции - это предварительно скомпилированные блоки SQL-кода, которые можно выполнять многократно с различными параметрами.</p>

<h4>Преимущества хранимых процедур:</h4>
<ul>
<li>Повышение производительности за счет предварительной компиляции</li>
<li>Централизация бизнес-логики</li>
<li>Повышение безопасности</li>
<li>Уменьшение сетевого трафика</li>
<li>Возможность повторного использования кода</li>
</ul>

<h4>Создание хранимой процедуры (MySQL):</h4>
<pre><code>DELIMITER //
CREATE PROCEDURE GetEmployeesByDepartment(
    IN dept_id INT,
    IN min_salary DECIMAL(10,2)
)
BEGIN
    SELECT employee_id, first_name, last_name, salary
    FROM employees 
    WHERE department_id = dept_id 
    AND salary >= min_salary
    ORDER BY salary DESC;
END //
DELIMITER ;</code></pre>

<h4>Вызов хранимой процедуры:</h4>
<pre><code>CALL GetEmployeesByDepartment(5, 50000);</code></pre>

<h4>Процедура с выходными параметрами:</h4>
<pre><code>DELIMITER //
CREATE PROCEDURE GetDepartmentStats(
    IN dept_id INT,
    OUT emp_count INT,
    OUT avg_salary DECIMAL(10,2),
    OUT max_salary DECIMAL(10,2)
)
BEGIN
    SELECT 
        COUNT(*),
        AVG(salary),
        MAX(salary)
    INTO emp_count, avg_salary, max_salary
    FROM employees 
    WHERE department_id = dept_id;
END //
DELIMITER ;</code></pre>

<h4>Использование с выходными параметрами:</h4>
<pre><code>CALL GetDepartmentStats(5, @count, @avg, @max);
SELECT @count as employee_count, @avg as average_salary, @max as max_salary;</code></pre>

<h4>Создание функций:</h4>
<pre><code>DELIMITER //
CREATE FUNCTION CalculateBonus(salary DECIMAL(10,2), performance_rating INT)
RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE bonus DECIMAL(10,2) DEFAULT 0;
    
    CASE performance_rating
        WHEN 5 THEN SET bonus = salary * 0.15;
        WHEN 4 THEN SET bonus = salary * 0.10;
        WHEN 3 THEN SET bonus = salary * 0.05;
        ELSE SET bonus = 0;
    END CASE;
    
    RETURN bonus;
END //
DELIMITER ;</code></pre>

<h4>Использование функции:</h4>
<pre><code>SELECT 
    employee_id,
    first_name,
    salary,
    performance_rating,
    CalculateBonus(salary, performance_rating) as bonus
FROM employees;</code></pre>

<h4>Условная логика в процедурах:</h4>
<pre><code>DELIMITER //
CREATE PROCEDURE ProcessSalaryIncrease(
    IN emp_id INT,
    IN increase_percent DECIMAL(5,2)
)
BEGIN
    DECLARE current_salary DECIMAL(10,2);
    DECLARE new_salary DECIMAL(10,2);
    DECLARE done INT DEFAULT FALSE;
    
    -- Получаем текущую зарплату
    SELECT salary INTO current_salary 
    FROM employees 
    WHERE employee_id = emp_id;
    
    -- Проверяем существование сотрудника
    IF current_salary IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Employee not found';
    END IF;
    
    -- Рассчитываем новую зарплату
    SET new_salary = current_salary * (1 + increase_percent / 100);
    
    -- Проверяем разумность увеличения
    IF increase_percent > 50 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Salary increase too large';
    END IF;
    
    -- Обновляем зарплату
    UPDATE employees 
    SET salary = new_salary 
    WHERE employee_id = emp_id;
    
    -- Логируем изменение
    INSERT INTO salary_changes (employee_id, old_salary, new_salary, change_date)
    VALUES (emp_id, current_salary, new_salary, NOW());
END //
DELIMITER ;</code></pre>`,
            14: `<p>Триггеры - это специальные хранимые процедуры, которые автоматически выполняются (срабатывают) в ответ на определенные события в базе данных.</p>

<h4>Типы триггеров по времени срабатывания:</h4>
<ul>
<li><strong>BEFORE</strong> - выполняется до события</li>
<li><strong>AFTER</strong> - выполняется после события</li>
<li><strong>INSTEAD OF</strong> - заменяет событие (только для представлений)</li>
</ul>

<h4>Типы триггеров по событиям:</h4>
<ul>
<li><strong>INSERT</strong> - при добавлении записей</li>
<li><strong>UPDATE</strong> - при обновлении записей</li>
<li><strong>DELETE</strong> - при удалении записей</li>
</ul>

<h4>Создание триггера для аудита изменений:</h4>
<pre><code>DELIMITER //
CREATE TRIGGER employee_audit_trigger
AFTER UPDATE ON employees
FOR EACH ROW
BEGIN
    INSERT INTO employee_audit (
        employee_id,
        field_name,
        old_value,
        new_value,
        changed_by,
        change_date
    )
    VALUES 
    (NEW.employee_id, 'salary', OLD.salary, NEW.salary, USER(), NOW()),
    (NEW.employee_id, 'department_id', OLD.department_id, NEW.department_id, USER(), NOW());
END //
DELIMITER ;</code></pre>

<h4>Триггер для автоматического обновления timestamp:</h4>
<pre><code>DELIMITER //
CREATE TRIGGER update_modified_date
BEFORE UPDATE ON products
FOR EACH ROW
BEGIN
    SET NEW.modified_date = NOW();
    SET NEW.modified_by = USER();
END //
DELIMITER ;</code></pre>

<h4>Триггер для проверки бизнес-правил:</h4>
<pre><code>DELIMITER //
CREATE TRIGGER check_salary_increase
BEFORE UPDATE ON employees
FOR EACH ROW
BEGIN
    DECLARE salary_increase_percent DECIMAL(5,2);
    
    -- Вычисляем процент увеличения зарплаты
    IF OLD.salary > 0 THEN
        SET salary_increase_percent = ((NEW.salary - OLD.salary) / OLD.salary) * 100;
        
        -- Проверяем, не превышает ли увеличение 50%
        IF salary_increase_percent > 50 THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Salary increase cannot exceed 50%';
        END IF;
        
        -- Проверяем, что зарплата не уменьшается более чем на 20%
        IF salary_increase_percent < -20 THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Salary decrease cannot exceed 20%';
        END IF;
    END IF;
END //
DELIMITER ;</code></pre>

<h4>Триггер для обновления связанных таблиц:</h4>
<pre><code>DELIMITER //
CREATE TRIGGER update_order_total
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders 
    SET total_amount = (
        SELECT SUM(quantity * unit_price) 
        FROM order_items 
        WHERE order_id = NEW.order_id
    )
    WHERE order_id = NEW.order_id;
END //
DELIMITER ;</code></pre>

<h4>Триггер для логирования удалений:</h4>
<pre><code>DELIMITER //
CREATE TRIGGER log_employee_deletion
BEFORE DELETE ON employees
FOR EACH ROW
BEGIN
    INSERT INTO deleted_employees (
        employee_id,
        first_name,
        last_name,
        department_id,
        salary,
        deleted_date,
        deleted_by
    )
    VALUES (
        OLD.employee_id,
        OLD.first_name,
        OLD.last_name,
        OLD.department_id,
        OLD.salary,
        NOW(),
        USER()
    );
END //
DELIMITER ;</code></pre>

<h4>Управление триггерами:</h4>
<pre><code>-- Просмотр существующих триггеров
SHOW TRIGGERS;

-- Просмотр триггеров для конкретной таблицы
SHOW TRIGGERS WHERE \`Table\` = 'employees';

-- Удаление триггера
DROP TRIGGER IF EXISTS employee_audit_trigger;</code></pre>

<h4>⚠️ Важные замечания:</h4>
<ul>
<li>Триггеры выполняются автоматически и не могут быть пропущены</li>
<li>Избегайте сложной логики в триггерах - это может замедлить операции</li>
<li>Будьте осторожны с рекурсивными триггерами</li>
<li>Триггеры не срабатывают при операциях TRUNCATE</li>
<li>Тестируйте триггеры тщательно перед внедрением в production</li>
</ul>`,
            15: `<p>Пользовательские функции позволяют создавать собственную логику обработки данных, которую можно многократно использовать в запросах.</p>

<h4>Типы пользовательских функций:</h4>
<ul>
<li><strong>Скалярные функции</strong> - возвращают одно значение</li>
<li><strong>Табличные функции</strong> - возвращают таблицу</li>
<li><strong>Агрегатные функции</strong> - работают с множеством значений</li>
<li><strong>Оконные функции</strong> - пользовательские оконные функции</li>
</ul>

<h4>Создание скалярной функции:</h4>
<pre><code>-- SQL Server/PostgreSQL
CREATE FUNCTION calculate_age(@birth_date DATE)
RETURNS INT
AS
BEGIN
    RETURN DATEDIFF(YEAR, @birth_date, GETDATE()) - 
           CASE WHEN DATEADD(YEAR, DATEDIFF(YEAR, @birth_date, GETDATE()), @birth_date) > GETDATE()
                THEN 1 ELSE 0 END
END;

-- Использование
SELECT first_name, last_name, dbo.calculate_age(birth_date) as age
FROM employees;</code></pre>

<h4>Табличная функция:</h4>
<pre><code>CREATE FUNCTION get_employees_by_department(@dept_id INT)
RETURNS TABLE
AS
RETURN (
    SELECT employee_id, first_name, last_name, salary
    FROM employees
    WHERE department_id = @dept_id
    AND status = 'Active'
);

-- Использование
SELECT * FROM get_employees_by_department(5);</code></pre>

<h4>Функция с множественными параметрами:</h4>
<pre><code>CREATE FUNCTION format_employee_name(@first_name NVARCHAR(50), @last_name NVARCHAR(50), @format INT = 1)
RETURNS NVARCHAR(100)
AS
BEGIN
    RETURN CASE @format
        WHEN 1 THEN @first_name + ' ' + @last_name
        WHEN 2 THEN @last_name + ', ' + @first_name
        WHEN 3 THEN UPPER(@last_name) + ', ' + @first_name
        ELSE @first_name + ' ' + @last_name
    END
END;</code></pre>

<h4>Рекурсивная функция (PostgreSQL):</h4>
<pre><code>CREATE OR REPLACE FUNCTION factorial(n INTEGER)
RETURNS INTEGER AS $$
BEGIN
    IF n <= 1 THEN
        RETURN 1;
    ELSE
        RETURN n * factorial(n - 1);
    END IF;
END;
$$ LANGUAGE plpgsql;</code></pre>`,
            16: `<p>Транзакции обеспечивают целостность данных при выполнении группы операций, а уровни изоляции определяют степень изолированности параллельных транзакций.</p>

<h4>Свойства ACID транзакций:</h4>
<ul>
<li><strong>Atomicity (Атомарность)</strong> - либо все операции выполняются, либо ни одна</li>
<li><strong>Consistency (Согласованность)</strong> - база данных остается в корректном состоянии</li>
<li><strong>Isolation (Изолированность)</strong> - транзакции не влияют друг на друга</li>
<li><strong>Durability (Долговечность)</strong> - изменения сохраняются после завершения</li>
</ul>

<h4>Основные команды управления транзакциями:</h4>
<pre><code>-- Начало транзакции
BEGIN TRANSACTION;
-- или просто
BEGIN;

-- Подтверждение изменений
COMMIT;

-- Откат изменений
ROLLBACK;

-- Точки сохранения
SAVEPOINT point1;
ROLLBACK TO point1;</code></pre>

<h4>Пример использования транзакции:</h4>
<pre><code>BEGIN TRANSACTION;

UPDATE accounts 
SET balance = balance - 1000 
WHERE account_id = 1;

UPDATE accounts 
SET balance = balance + 1000 
WHERE account_id = 2;

-- Проверка корректности операции
IF @@ERROR = 0 AND (SELECT balance FROM accounts WHERE account_id = 1) >= 0
    COMMIT;
ELSE
    ROLLBACK;</code></pre>

<h4>Уровни изоляции транзакций:</h4>
<ul>
<li><strong>READ UNCOMMITTED</strong> - самый низкий уровень, возможны "грязные" чтения</li>
<li><strong>READ COMMITTED</strong> - чтение только подтвержденных данных</li>
<li><strong>REPEATABLE READ</strong> - повторяемые чтения в рамках транзакции</li>
<li><strong>SERIALIZABLE</strong> - полная изоляция, как при последовательном выполнении</li>
</ul>

<h4>Установка уровня изоляции:</h4>
<pre><code>-- Для текущей транзакции
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Для сессии
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- Пример с проблемой "фантомных" чтений
-- Транзакция 1
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
SELECT COUNT(*) FROM orders WHERE amount > 1000; -- Результат: 5

-- В это время Транзакция 2 добавляет новую запись
INSERT INTO orders (amount) VALUES (1500);
COMMIT;

-- Продолжение Транзакции 1
SELECT COUNT(*) FROM orders WHERE amount > 1000; -- Все еще: 5 (в REPEATABLE READ)
COMMIT;</code></pre>

<h4>Обработка блокировок и взаимоблокировок:</h4>
<pre><code>-- Явная блокировка
SELECT * FROM products WHERE product_id = 1 FOR UPDATE;

-- Обработка взаимоблокировок
BEGIN TRY
    BEGIN TRANSACTION;
    
    UPDATE table1 SET value = value + 1 WHERE id = 1;
    UPDATE table2 SET value = value - 1 WHERE id = 2;
    
    COMMIT;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK;
    
    IF ERROR_NUMBER() = 1205 -- Deadlock
        WAITFOR DELAY '00:00:01'; -- Пауза перед повтором
    
    THROW;
END CATCH;</code></pre>`,
            17: `<p>Индексы - это структуры данных, которые значительно ускоряют поиск и сортировку данных в базе данных за счет создания упорядоченных ссылок на строки таблицы.</p>

<h4>Типы индексов:</h4>
<ul>
<li><strong>Кластерный индекс</strong> - определяет физический порядок хранения данных</li>
<li><strong>Некластерный индекс</strong> - содержит указатели на строки данных</li>
<li><strong>Уникальный индекс</strong> - гарантирует уникальность значений</li>
<li><strong>Композитный индекс</strong> - построен на нескольких столбцах</li>
<li><strong>Частичный индекс</strong> - индексирует только часть данных</li>
<li><strong>Функциональный индекс</strong> - построен на результате функции</li>
</ul>

<h4>Создание индексов:</h4>
<pre><code>-- Простой индекс
CREATE INDEX idx_employee_last_name ON employees(last_name);

-- Уникальный индекс
CREATE UNIQUE INDEX idx_employee_email ON employees(email);

-- Композитный индекс
CREATE INDEX idx_employee_dept_salary ON employees(department_id, salary DESC);

-- Частичный индекс (PostgreSQL)
CREATE INDEX idx_active_employees ON employees(last_name) 
WHERE status = 'Active';

-- Функциональный индекс
CREATE INDEX idx_employee_full_name ON employees(LOWER(first_name + ' ' + last_name));</code></pre>

<h4>Кластерный индекс:</h4>
<pre><code>-- Создание кластерного индекса (SQL Server)
CREATE CLUSTERED INDEX idx_employee_id ON employees(employee_id);

-- В PostgreSQL аналог - CLUSTER
CREATE INDEX idx_employee_dept ON employees(department_id);
CLUSTER employees USING idx_employee_dept;</code></pre>

<h4>Анализ использования индексов:</h4>
<pre><code>-- SQL Server - план выполнения
SET STATISTICS IO ON;
SELECT * FROM employees WHERE last_name = 'Smith';

-- PostgreSQL - анализ запроса
EXPLAIN ANALYZE SELECT * FROM employees WHERE last_name = 'Smith';

-- Статистика использования индексов (PostgreSQL)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;</code></pre>

<h4>Оптимальные практики создания индексов:</h4>
<pre><code>-- Хороший композитный индекс для запроса
-- SELECT * FROM orders WHERE customer_id = 123 AND order_date >= '2023-01-01'
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);

-- Покрывающий индекс (включает все нужные столбцы)
CREATE INDEX idx_orders_covering 
ON orders(customer_id, order_date) 
INCLUDE (total_amount, status);

-- Индекс для сортировки
CREATE INDEX idx_products_category_price ON products(category_id, price DESC);</code></pre>

<h4>Мониторинг и обслуживание индексов:</h4>
<pre><code>-- Проверка фрагментации индекса (SQL Server)
SELECT 
    object_name(object_id) as table_name,
    name as index_name,
    avg_fragmentation_in_percent
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'SAMPLED') s
JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE avg_fragmentation_in_percent > 10;

-- Перестроение индекса
ALTER INDEX idx_employee_last_name ON employees REBUILD;

-- Реорганизация индекса
ALTER INDEX idx_employee_last_name ON employees REORGANIZE;</code></pre>

<h4>Когда НЕ нужно создавать индексы:</h4>
<ul>
<li>На маленьких таблицах (< 1000 строк)</li>
<li>На столбцах, которые часто изменяются</li>
<li>На столбцах с низкой селективностью</li>
<li>Если таблица часто подвергается INSERT/UPDATE/DELETE операциям</li>
</ul>`,
            18: `<p>Оптимизация запросов - критически важный навык для работы с большими объемами данных. Правильная оптимизация может улучшить производительность в сотни раз.</p>

<h4>Основные принципы оптимизации:</h4>
<ul>
<li>Использование индексов</li>
<li>Минимизация объема обрабатываемых данных</li>
<li>Правильное использование JOIN</li>
<li>Оптимизация WHERE условий</li>
<li>Анализ плана выполнения запроса</li>
</ul>

<h4>Анализ плана выполнения:</h4>
<pre><code>-- SQL Server
SET SHOWPLAN_ALL ON;
SELECT * FROM orders o 
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_date > '2023-01-01';

-- PostgreSQL
EXPLAIN ANALYZE 
SELECT * FROM orders o 
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_date > '2023-01-01';</code></pre>

<h4>Оптимизация WHERE условий:</h4>
<p>Неэффективно:</p>
<pre><code>-- Использование функций в WHERE делает индекс неэффективным
SELECT * FROM orders 
WHERE YEAR(order_date) = 2023;</code></pre>

<p>Эффективно:</p>
<pre><code>-- Лучше использовать диапазон дат
SELECT * FROM orders 
WHERE order_date >= '2023-01-01' 
AND order_date < '2024-01-01';</code></pre>

<h4>Оптимизация JOIN операций:</h4>
<p>Порядок JOIN имеет значение - начинайте с таблиц с наименьшим количеством строк:</p>
<pre><code>-- Эффективный JOIN
SELECT c.customer_name, o.order_total
FROM small_vip_customers c  -- Сначала маленькая таблица
JOIN orders o ON c.customer_id = o.customer_id
WHERE c.vip_status = 'PLATINUM';</code></pre>

<h4>Использование EXISTS вместо IN:</h4>
<p>Неэффективно для больших подзапросов:</p>
<pre><code>SELECT * FROM customers 
WHERE customer_id IN (
    SELECT customer_id FROM orders 
    WHERE order_date > '2023-01-01'
);</code></pre>

<p>Более эффективно:</p>
<pre><code>SELECT * FROM customers c
WHERE EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.customer_id = c.customer_id 
    AND o.order_date > '2023-01-01'
);</code></pre>

<h4>Оптимизация агрегатных функций:</h4>
<pre><code>-- Избегайте COUNT(*) для проверки существования
-- Вместо этого:
SELECT COUNT(*) FROM large_table WHERE condition;

-- Используйте:
SELECT 1 FROM large_table WHERE condition AND ROWNUM = 1; -- Oracle
-- или
SELECT TOP 1 1 FROM large_table WHERE condition; -- SQL Server</code></pre>

<h4>Партиционирование запросов:</h4>
<pre><code>-- Разбивайте большие запросы на части
-- Вместо обновления всей таблицы:
UPDATE large_table SET status = 'PROCESSED' 
WHERE process_date < '2023-01-01';

-- Используйте батчи:
WHILE @@ROWCOUNT > 0
BEGIN
    UPDATE TOP (1000) large_table 
    SET status = 'PROCESSED' 
    WHERE process_date < '2023-01-01' 
    AND status != 'PROCESSED';
END</code></pre>

<h4>Оптимизация подзапросов:</h4>
<p>Коррелированные подзапросы часто можно заменить оконными функциями:</p>
<pre><code>-- Медленно (коррелированный подзапрос):
SELECT employee_id, salary,
    (SELECT AVG(salary) FROM employees e2 
     WHERE e2.department_id = e1.department_id) as avg_dept_salary
FROM employees e1;

-- Быстрее (оконная функция):
SELECT employee_id, salary,
    AVG(salary) OVER (PARTITION BY department_id) as avg_dept_salary
FROM employees;</code></pre>`,
            19: `<p>Современные СУБД поддерживают работу с JSON данными, что позволяет сочетать преимущества реляционных и документоориентированных баз данных.</p>

<h4>Создание таблиц с JSON столбцами:</h4>
<pre><code>-- PostgreSQL
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    specifications JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- MySQL 5.7+
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    specifications JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SQL Server 2016+
CREATE TABLE products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255),
    specifications NVARCHAR(MAX) CHECK (ISJSON(specifications) = 1),
    created_at DATETIME2 DEFAULT GETDATE()
);</code></pre>

<h4>Вставка JSON данных:</h4>
<pre><code>-- Вставка JSON объекта
INSERT INTO products (name, specifications) VALUES 
('Laptop Pro', '{"brand": "TechCorp", "ram": "16GB", "storage": "512GB SSD", "ports": ["USB-C", "HDMI", "3.5mm"], "price": 1299.99}'),
('Gaming Mouse', '{"brand": "GameTech", "dpi": 16000, "buttons": 12, "wireless": true, "battery_life": "72 hours"}'),
('Monitor 4K', '{"brand": "ViewMax", "size": 27, "resolution": "3840x2160", "refresh_rate": 144, "hdr": true}');</code></pre>

<h4>Извлечение данных из JSON (PostgreSQL):</h4>
<pre><code>-- Получение простых значений
SELECT name, 
       specifications->>'brand' as brand,
       specifications->>'price' as price
FROM products;

-- Получение вложенных объектов
SELECT name,
       specifications->'specs'->>'cpu' as cpu,
       specifications->'specs'->>'gpu' as gpu
FROM products;

-- Получение элементов массива
SELECT name,
       specifications->'ports'->>0 as first_port,
       jsonb_array_length(specifications->'ports') as ports_count
FROM products;</code></pre>

<h4>Извлечение данных из JSON (MySQL):</h4>
<pre><code>-- MySQL синтаксис
SELECT name,
       JSON_EXTRACT(specifications, '$.brand') as brand,
       JSON_UNQUOTE(JSON_EXTRACT(specifications, '$.price')) as price
FROM products;

-- Краткий синтаксис MySQL
SELECT name,
       specifications->>'$.brand' as brand,
       specifications->>'$.price' as price
FROM products;</code></pre>

<h4>Извлечение данных из JSON (SQL Server):</h4>
<pre><code>-- SQL Server синтаксис
SELECT name,
       JSON_VALUE(specifications, '$.brand') as brand,
       JSON_VALUE(specifications, '$.price') as price
FROM products;

-- Извлечение массива
SELECT name, port_value
FROM products
CROSS APPLY OPENJSON(specifications, '$.ports') 
WITH (port_value NVARCHAR(50) '$');</code></pre>

<h4>Фильтрация по JSON данным:</h4>
<pre><code>-- PostgreSQL: поиск по значению
SELECT * FROM products 
WHERE specifications->>'brand' = 'TechCorp';

-- PostgreSQL: поиск в массиве
SELECT * FROM products 
WHERE specifications->'ports' ? 'USB-C';

-- MySQL: фильтрация
SELECT * FROM products 
WHERE JSON_EXTRACT(specifications, '$.wireless') = true;

-- SQL Server: фильтрация
SELECT * FROM products 
WHERE JSON_VALUE(specifications, '$.brand') = 'TechCorp';</code></pre>

<h4>Агрегация JSON данных:</h4>
<pre><code>-- PostgreSQL: создание JSON массива
SELECT JSON_AGG(
    JSON_BUILD_OBJECT(
        'name', name,
        'brand', specifications->>'brand',
        'price', specifications->>'price'
    )
) as products_json
FROM products;

-- MySQL: создание JSON объекта
SELECT JSON_OBJECT(
    'total_products', COUNT(*),
    'avg_price', AVG(CAST(specifications->>'$.price' AS DECIMAL(10,2))),
    'brands', JSON_ARRAYAGG(DISTINCT specifications->>'$.brand')
) as summary
FROM products;</code></pre>

<h4>Обновление JSON данных:</h4>
<pre><code>-- PostgreSQL: обновление поля
UPDATE products 
SET specifications = jsonb_set(
    specifications, 
    '{price}', 
    '1199.99'::jsonb
) 
WHERE name = 'Laptop Pro';

-- MySQL: обновление
UPDATE products 
SET specifications = JSON_SET(specifications, '$.price', 1199.99)
WHERE name = 'Laptop Pro';

-- Добавление нового поля
UPDATE products 
SET specifications = JSON_SET(
    specifications, 
    '$.warranty', 
    '2 years'
) 
WHERE specifications->>'$.brand' = 'TechCorp';</code></pre>

<h4>Индексация JSON данных:</h4>
<pre><code>-- PostgreSQL: GIN индекс для быстрого поиска
CREATE INDEX idx_products_specs_gin ON products USING GIN (specifications);

-- Индекс на конкретное поле
CREATE INDEX idx_products_brand ON products ((specifications->>'brand'));

-- MySQL: виртуальные столбцы с индексами
ALTER TABLE products 
ADD COLUMN brand VARCHAR(100) AS (specifications->>'$.brand') VIRTUAL,
ADD INDEX idx_brand (brand);</code></pre>`,
            20: `<p>Полнотекстовый поиск позволяет эффективно искать текстовую информацию в больших объемах данных, используя различные алгоритмы ранжирования и индексации.</p>

<h4>Полнотекстовый поиск в PostgreSQL:</h4>
<p>PostgreSQL использует тип данных tsvector и tsquery для полнотекстового поиска:</p>
<pre><code>-- Создание таблицы с поддержкой полнотекстового поиска
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    search_vector TSVECTOR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Создание индекса для быстрого поиска
CREATE INDEX idx_articles_search ON articles USING GIN(search_vector);</code></pre>

<p>Заполнение поискового вектора:</p>
<pre><code>-- Обновление поискового вектора при вставке
INSERT INTO articles (title, content, search_vector) VALUES
('Введение в SQL', 'SQL - это язык структурированных запросов для работы с базами данных...', 
 to_tsvector('russian', 'Введение в SQL' || ' ' || 'SQL - это язык структурированных запросов для работы с базами данных...'));

-- Автоматическое обновление через триггер
CREATE OR REPLACE FUNCTION update_search_vector() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('russian', COALESCE(NEW.title,'') || ' ' || COALESCE(NEW.content,''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_search_update 
    BEFORE INSERT OR UPDATE ON articles 
    FOR EACH ROW EXECUTE FUNCTION update_search_vector();</code></pre>

<p>Выполнение полнотекстового поиска:</p>
<pre><code>-- Простой поиск
SELECT title, content,
       ts_rank(search_vector, to_tsquery('russian', 'SQL & база')) as rank
FROM articles 
WHERE search_vector @@ to_tsquery('russian', 'SQL & база')
ORDER BY rank DESC;

-- Поиск с фразами
SELECT title, 
       ts_headline('russian', content, to_tsquery('russian', 'база & данных')) as snippet
FROM articles 
WHERE search_vector @@ to_tsquery('russian', 'база & данных');

-- Поиск с подстановочными символами
SELECT * FROM articles 
WHERE search_vector @@ to_tsquery('russian', 'програм:*');</code></pre>

<h4>Полнотекстовый поиск в MySQL:</h4>
<p>MySQL поддерживает FULLTEXT индексы для поиска:</p>
<pre><code>-- Создание таблицы с FULLTEXT индексом
CREATE TABLE articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FULLTEXT(title, content)
) ENGINE=InnoDB;

-- Добавление FULLTEXT индекса к существующей таблице
ALTER TABLE articles ADD FULLTEXT(title, content);</code></pre>

<p>Режимы поиска в MySQL:</p>
<pre><code>-- Естественный языковой режим (по умолчанию)
SELECT *, MATCH(title, content) AGAINST('SQL база данных') as relevance
FROM articles 
WHERE MATCH(title, content) AGAINST('SQL база данных')
ORDER BY relevance DESC;

-- Булевый режим
SELECT * FROM articles 
WHERE MATCH(title, content) AGAINST('+SQL +база -Oracle' IN BOOLEAN MODE);

-- Поиск фраз
SELECT * FROM articles 
WHERE MATCH(title, content) AGAINST('"структурированных запросов"' IN BOOLEAN MODE);

-- Расширенный поиск с подстановочными символами
SELECT * FROM articles 
WHERE MATCH(title, content) AGAINST('програм*' IN BOOLEAN MODE);</code></pre>
<h4>Полнотекстовый поиск в PostgreSQL</h4>

<p>PostgreSQL предоставляет более мощные возможности для полнотекстового поиска с поддержкой различных языков и морфологического анализа:</p>

<pre><code>-- Создание таблицы с tsvector для оптимизации поиска
CREATE TABLE articles (
id SERIAL PRIMARY KEY,
title VARCHAR(255),
content TEXT,
search_vector tsvector
);

-- Создание GIN индекса для быстрого поиска
CREATE INDEX articles_search_idx ON articles USING GIN(search_vector);

-- Автоматическое обновление поискового вектора
CREATE OR REPLACE FUNCTION update_search_vector() RETURNS trigger AS $$
BEGIN
NEW.search_vector :=
setweight(to_tsvector('russian', COALESCE(NEW.title, '')), 'A') ||
setweight(to_tsvector('russian', COALESCE(NEW.content, '')), 'B');
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_search_vector_trigger
BEFORE INSERT OR UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION update_search_vector();</code></pre>

<p>Примеры поисковых запросов в PostgreSQL:</p>

<pre><code>-- Простой поиск с ранжированием
SELECT title, content,
ts_rank(search_vector, plainto_tsquery('russian', 'база данных')) as rank
FROM articles
WHERE search_vector @@ plainto_tsquery('russian', 'база данных')
ORDER BY rank DESC;

-- Поиск с использованием операторов
SELECT * FROM articles
WHERE search_vector @@ to_tsquery('russian', 'база & данных & !Oracle');

-- Поиск похожих слов
SELECT * FROM articles
WHERE search_vector @@ to_tsquery('russian', 'программирование:*');

-- Выделение найденных фрагментов
SELECT title,
ts_headline('russian', content,
plainto_tsquery('russian', 'SQL запросы'),
'StartSel=<mark>, StopSel=</mark>') as snippet
FROM articles
WHERE search_vector @@ plainto_tsquery('russian', 'SQL запросы');</code></pre>

<h4>Полнотекстовый поиск в SQL Server</h4>

<p>Microsoft SQL Server предоставляет комплексную систему полнотекстового поиска с поддержкой различных типов файлов:</p>

<pre><code>-- Создание полнотекстового каталога
CREATE FULLTEXT CATALOG articles_catalog;

-- Создание полнотекстового индекса
CREATE FULLTEXT INDEX ON articles(title, content)
KEY INDEX PK_articles_id
ON articles_catalog;

-- Простой поиск
SELECT * FROM articles
WHERE CONTAINS(content, 'SQL');

-- Поиск фраз
SELECT * FROM articles
WHERE CONTAINS(content, '"структурированный запрос"');

-- Поиск с подстановочными символами
SELECT * FROM articles
WHERE CONTAINS(content, '"програм*"');

-- Нечеткий поиск (поиск похожих слов)
SELECT * FROM articles
WHERE CONTAINS(content, 'FORMSOF(INFLECTIONAL, программирование)');

-- Поиск с близостью слов
SELECT * FROM articles
WHERE CONTAINS(content, 'SQL NEAR данные');</code></pre>

<h4>Оптимизация полнотекстового поиска</h4>

<p>Для эффективной работы полнотекстового поиска важно учитывать следующие аспекты:</p>

<pre><code>-- Мониторинг производительности поиска
EXPLAIN ANALYZE
SELECT * FROM articles
WHERE MATCH(title, content) AGAINST('база данных SQL');

-- Настройка минимальной длины слов (MySQL)
SET GLOBAL ft_min_word_len = 3;

-- Исключение стоп-слов
-- Создание собственного списка стоп-слов
CREATE TABLE custom_stopwords (value VARCHAR(30));
INSERT INTO custom_stopwords VALUES ('и'), ('в'), ('на'), ('с');

-- Настройка полнотекстового поиска с пользовательскими стоп-словами
ALTER TABLE articles ADD FULLTEXT(title, content) WITH PARSER custom_parser;</code></pre>

<h4>Комбинирование полнотекстового поиска с обычными запросами</h4>

<p>Часто полнотекстовый поиск комбинируется с обычными условиями WHERE для более точной фильтрации:</p>

<pre><code>-- Поиск в статьях определенной категории
SELECT a.*, c.name as category_name,
MATCH(a.title, a.content) AGAINST('машинное обучение') as relevance
FROM articles a
JOIN categories c ON a.category_id = c.id
WHERE c.name = 'Технологии'
AND MATCH(a.title, a.content) AGAINST('машинное обучение')
AND a.published_date >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
ORDER BY relevance DESC, a.published_date DESC;

-- Поиск с фасетной фильтрацией
SELECT a.,
COUNT() OVER() as total_results,
MATCH(a.title, a.content) AGAINST(@search_term) as score
FROM articles a
WHERE MATCH(a.title, a.content) AGAINST(@search_term)
AND (@category_id IS NULL OR a.category_id = @category_id)
AND (@author_id IS NULL OR a.author_id = @author_id)
AND a.status = 'published'
ORDER BY score DESC
LIMIT @offset, @limit;</code></pre>

<h4>Работа с многоязычным контентом</h4>

<p>При работе с многоязычными данными важно правильно настроить языковые анализаторы:</p>

<pre><code>-- PostgreSQL: поиск с автоопределением языка
CREATE OR REPLACE FUNCTION detect_language(text_content TEXT)
RETURNS regconfig AS $$
BEGIN
-- Простая логика определения языка
IF text_content ~ '[а-яё]' THEN
RETURN 'russian'::regconfig;
ELSE
RETURN 'english'::regconfig;
END IF;
END;
$$ LANGUAGE plpgsql;

-- Создание поискового вектора с учетом языка
UPDATE articles
SET search_vector = to_tsvector(detect_language(content), content);

-- SQL Server: поиск в документах разных языков
SELECT * FROM articles
WHERE CONTAINS(content, 'программирование', LANGUAGE 'Russian')
OR CONTAINS(content, 'programming', LANGUAGE 'English');</code></pre>

<p>Полнотекстовый поиск является мощным инструментом для работы с большими объемами текстовых данных, но требует тщательной настройки и оптимизации для достижения наилучших результатов. 
Правильное использование индексов, настройка языковых анализаторов и комбинирование с традиционными методами поиска позволяют создавать эффективные поисковые системы прямо в базе данных.</p>`,
            
        },
        3: {
            1: `<p>Python стал стандартом де-факто для анализа данных благодаря богатой экосистеме библиотек и простоте синтаксиса.</p>
        <p>Основные библиотеки для анализа данных:</p>
        <ul>
            <li><strong>NumPy</strong> - вычисления с массивами</li>
            <li><strong>pandas</strong> - манипуляции с данными</li>
            <li><strong>matplotlib/seaborn</strong> - визуализация</li>
            <li><strong>scikit-learn</strong> - машинное обучение</li>
            <li><strong>scipy</strong> - научные вычисления</li>
        </ul>
        <p>Установка необходимых библиотек:</p>
        <pre><code>pip install numpy pandas matplotlib seaborn scikit-learn jupyter</code></pre>
        <p>Первый пример работы с данными:</p>
        <pre><code>import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Создание простого датасета
data = {
    'name': ['Alice', 'Bob', 'Charlie', 'Diana'],
    'age': [25, 30, 35, 28],
    'salary': [50000, 60000, 70000, 55000]
}

df = pd.DataFrame(data)
print(df)
print(f"Средняя зарплата: {df['salary'].mean()}")

# Простая визуализация
plt.figure(figsize=(8, 6))
plt.bar(df['name'], df['salary'])
plt.title('Зарплаты сотрудников')
plt.ylabel('Зарплата')
plt.show()</code></pre>`,
            2: `<p>NumPy - это основа для научных вычислений в Python, предоставляющая эффективные структуры данных для работы с массивами.</p>
        <p>Создание массивов:</p>
        <pre><code>import numpy as np

# Создание массивов разными способами
arr1 = np.array([1, 2, 3, 4, 5])
arr2 = np.zeros(5)  # [0. 0. 0. 0. 0.]
arr3 = np.ones(5)   # [1. 1. 1. 1. 1.]
arr4 = np.arange(0, 10, 2)  # [0 2 4 6 8]
arr5 = np.linspace(0, 1, 5)  # [0.   0.25 0.5  0.75 1.  ]

# Многомерные массивы
matrix = np.array([[1, 2, 3], [4, 5, 6]])
print(f"Форма матрицы: {matrix.shape}")  # (2, 3)

# Создание случайных данных
random_data = np.random.randn(1000)  # Нормальное распределение
uniform_data = np.random.uniform(0, 1, 1000)  # Равномерное распределение</code></pre>
        <p>Основные операции с массивами:</p>
        <pre><code># Математические операции
arr = np.array([1, 2, 3, 4, 5])
print(arr + 10)    # [11 12 13 14 15]
print(arr * 2)     # [2 4 6 8 10]
print(arr ** 2)    # [1 4 9 16 25]

# Агрегатные функции
print(f"Сумма: {arr.sum()}")
print(f"Среднее: {arr.mean()}")
print(f"Стандартное отклонение: {arr.std()}")
print(f"Минимум: {arr.min()}, Максимум: {arr.max()}")

# Индексация и срезы
print(arr[0])     # Первый элемент
print(arr[-1])    # Последний элемент
print(arr[1:4])   # Элементы с 1 по 3
print(arr[arr > 3])  # Булевая индексация</code></pre>`,
            3: `<p>pandas предоставляет две основные структуры данных: Series (одномерные) и DataFrame (двумерные).</p>
        <p>Работа с Series:</p>
        <pre><code>import pandas as pd
import numpy as np

# Создание Series
s1 = pd.Series([1, 3, 5, 7, 9])
s2 = pd.Series([1, 3, 5, 7, 9], index=['a', 'b', 'c', 'd', 'e'])
s3 = pd.Series({'a': 1, 'b': 3, 'c': 5, 'd': 7, 'e': 9})

print(s2)
print(f"Значение 'a': {s2['a']}")
print(f"Значения больше 5: {s2[s2 > 5]}")

# Операции с Series
temperatures = pd.Series([20, 25, 30, 28, 22], 
                        index=['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
print(f"Средняя температура: {temperatures.mean()}")
print(f"Максимальная температура: {temperatures.max()}")
print(f"День с максимальной температурой: {temperatures.idxmax()}")</code></pre>
        <p>Работа с DataFrame:</p>
        <pre><code># Создание DataFrame
data = {
    'Name': ['Alice', 'Bob', 'Charlie', 'Diana'],
    'Age': [25, 30, 35, 28],
    'City': ['Moscow', 'SPB', 'Moscow', 'Kazan'],
    'Salary': [50000, 60000, 70000, 55000]
}

df = pd.DataFrame(data)
print(df)

# Основная информация о DataFrame
print(f"Форма: {df.shape}")
print(f"Столбцы: {df.columns.tolist()}")
print(f"Типы данных:\n{df.dtypes}")
print(f"Основная статистика:\n{df.describe()}")

# Выборка данных
print(df['Name'])  # Один столбец
print(df[['Name', 'Age']])  # Несколько столбцов
print(df[df['Age'] > 28])  # Фильтрация строк
print(df.loc[0])  # Строка по индексу
print(df.iloc[0:2])  # Первые две строки</code></pre>`,
            4: `<p>pandas поддерживает множество форматов данных для загрузки и сохранения.</p>
        <p>Работа с CSV файлами:</p>
        <pre><code>import pandas as pd

# Загрузка CSV
df = pd.read_csv('data.csv')
df = pd.read_csv('data.csv', 
                 sep=';',  # Разделитель
                 encoding='utf-8',  # Кодировка
                 header=0,  # Строка с заголовками
                 index_col=0,  # Столбец для индекса
                 usecols=['Name', 'Age', 'Salary'],  # Выбранные столбцы
                 dtype={'Age': int, 'Salary': float},  # Типы данных
                 parse_dates=['Date'],  # Парсинг дат
                 na_values=['N/A', 'NULL'])  # Значения для NaN

# Сохранение в CSV
df.to_csv('output.csv', index=False, encoding='utf-8')

# Создание тестового файла
test_data = {
    'ID': range(1, 101),
    'Name': [f'Person_{i}' for i in range(1, 101)],
    'Age': np.random.randint(18, 65, 100),
    'Salary': np.random.randint(30000, 120000, 100),
    'Department': np.random.choice(['IT', 'Sales', 'HR', 'Finance'], 100)
}
test_df = pd.DataFrame(test_data)
test_df.to_csv('employees.csv', index=False)</code></pre>
        <p>Работа с другими форматами:</p>
        <pre><code># Excel файлы
df_excel = pd.read_excel('data.xlsx', sheet_name='Sheet1')
df.to_excel('output.xlsx', sheet_name='Data', index=False)

# JSON файлы
df_json = pd.read_json('data.json')
df.to_json('output.json', orient='records', indent=2)

# SQL базы данных
import sqlite3
conn = sqlite3.connect('database.db')
df_sql = pd.read_sql('SELECT * FROM employees', conn)
df.to_sql('employees', conn, if_exists='replace', index=False)

# Parquet (эффективный формат для больших данных)
df_parquet = pd.read_parquet('data.parquet')
df.to_parquet('output.parquet', index=False)

# Чтение из URL
df_web = pd.read_csv('https://example.com/data.csv')

# Чтение с обработкой ошибок
try:
    df = pd.read_csv('data.csv')
except FileNotFoundError:
    print("Файл не найден")
except pd.errors.EmptyDataError:
    print("Файл пустой")
except Exception as e:
    print(f"Ошибка: {e}")</code></pre>`,
            5: `<p>pandas предоставляет мощные возможности для индексации и выборки данных различными способами.</p>
        <p>Основные методы индексации:</p>
        <pre><code>import pandas as pd
import numpy as np

# Создание тестового DataFrame
np.random.seed(42)
df = pd.DataFrame({
    'A': np.random.randn(10),
    'B': np.random.randn(10),
    'C': np.random.randint(1, 5, 10),
    'D': pd.date_range('2023-01-01', periods=10),
    'E': ['foo', 'bar', 'baz', 'qux', 'foo', 'bar', 'baz', 'qux', 'foo', 'bar']
})

print("Исходный DataFrame:")
print(df)

# Выборка столбцов
print(df['A'])  # Один столбец как Series
print(df[['A', 'B']])  # Несколько столбцов как DataFrame

# Выборка строк по индексу
print(df[0:3])  # Первые 3 строки
print(df[-2:])  # Последние 2 строки</code></pre>
        <p>Использование loc и iloc:</p>
        <pre><code># loc - индексация по меткам
print(df.loc[0])  # Первая строка
print(df.loc[0:2, 'A':'C'])  # Строки 0-2, столбцы A-C
print(df.loc[df['C'] > 2])  # Строки по условию

# iloc - индексация по позициям
print(df.iloc[0])  # Первая строка
print(df.iloc[0:3, 0:2])  # Первые 3 строки, первые 2 столбца
print(df.iloc[-1])  # Последняя строка

# at и iat для одного значения (быстрее)
print(df.at[0, 'A'])  # Значение по метке
print(df.iat[0, 0])   # Значение по позиции

# Условная фильтрация
print(df[df['C'] > 2])  # Строки где C > 2
print(df[(df['C'] > 2) & (df['A'] > 0)])  # Множественные условия
print(df[df['E'].isin(['foo', 'bar'])])  # Значения из списка</code></pre>
        <p>Продвинутая индексация:</p>
        <pre><code># Использование query (удобно для сложных условий)
print(df.query('C > 2 and A > 0'))
print(df.query('E in ["foo", "bar"]'))

# Работа с MultiIndex
arrays = [['A', 'A', 'B', 'B'], [1, 2, 1, 2]]
tuples = list(zip(*arrays))
index = pd.MultiIndex.from_tuples(tuples, names=['first', 'second'])
df_multi = pd.DataFrame(np.random.randn(4, 2), index=index, columns=['X', 'Y'])

print(df_multi)
print(df_multi.loc['A'])  # Все строки с первым уровнем 'A'
print(df_multi.loc[('A', 1)])  # Конкретная строка

# Установка и сброс индекса
df_indexed = df.set_index('E')
print(df_indexed.loc['foo'])  # Выборка по новому индексу
df_reset = df_indexed.reset_index()  # Возврат к числовому индексу</code></pre>`,
            6: `<p>Отсутствующие данные (NaN) - частая проблема в реальных датасетах. pandas предоставляет множество инструментов для их обработки.</p>
    <p>Обнаружение отсутствующих данных:</p>
    <pre><code>import pandas as pd
import numpy as np

# Создание DataFrame с пропущенными значениями
df = pd.DataFrame({
    'A': [1, 2, np.nan, 4, 5],
    'B': [5, np.nan, np.nan, 8, 9],
    'C': [1, 2, 3, np.nan, 5],
    'D': ['foo', 'bar', None, 'baz', 'qux']
})

print("DataFrame с пропущенными значениями:")
print(df)

# Проверка на отсутствующие значения
print(f"Есть ли NaN: {df.isnull().any().any()}")
print(f"Количество NaN в каждом столбце:")
print(df.isnull().sum())

# Информация о DataFrame
print("\\nИнформация о DataFrame:")
print(df.info())</code></pre>
    
    <p>Методы обработки отсутствующих данных:</p>
    
    <p><strong>1. Удаление строк/столбцов с NaN:</strong></p>
    <pre><code># Удаление строк с любыми NaN
df_dropna_rows = df.dropna()
print("После удаления строк с NaN:")
print(df_dropna_rows)

# Удаление строк, где все значения NaN
df_dropna_all = df.dropna(how='all')

# Удаление строк с NaN в конкретных столбцах
df_dropna_subset = df.dropna(subset=['A', 'B'])

# Удаление столбцов с NaN
df_dropna_cols = df.dropna(axis=1)
print("\\nПосле удаления столбцов с NaN:")
print(df_dropna_cols)</code></pre>
    
    <p><strong>2. Заполнение пропущенных значений:</strong></p>
    <pre><code># Заполнение одним значением
df_fillna = df.fillna(0)
print("Заполнение нулями:")
print(df_fillna)

# Заполнение разными значениями для разных столбцов
fill_values = {'A': df['A'].mean(), 'B': df['B'].median(), 'D': 'unknown'}
df_fill_dict = df.fillna(fill_values)
print("\\nЗаполнение различными значениями:")
print(df_fill_dict)

# Прямое заполнение (forward fill)
df_ffill = df.fillna(method='ffill')
print("\\nПрямое заполнение:")
print(df_ffill)

# Обратное заполнение (backward fill)
df_bfill = df.fillna(method='bfill')
print("\\nОбратное заполнение:")
print(df_bfill)</code></pre>
    
    <p><strong>3. Интерполяция:</strong></p>
    <pre><code># Создание временного ряда с пропусками
dates = pd.date_range('2023-01-01', periods=10, freq='D')
ts = pd.Series([1, 2, np.nan, np.nan, 5, 6, np.nan, 8, 9, 10], index=dates)

print("Временной ряд с пропусками:")
print(ts)

# Линейная интерполяция
ts_linear = ts.interpolate()
print("\\nЛинейная интерполяция:")
print(ts_linear)

# Интерполяция по времени
ts_time = ts.interpolate(method='time')
print("\\nИнтерполяция по времени:")
print(ts_time)

# Полиномиальная интерполяция
ts_poly = ts.interpolate(method='polynomial', order=2)
print("\\nПолиномиальная интерполяция:")
print(ts_poly)</code></pre>
    
    <p><strong>4. Продвинутые методы обработки:</strong></p>
    <pre><code># Заполнение на основе группировки
df_grouped = pd.DataFrame({
    'Category': ['A', 'A', 'B', 'B', 'A', 'B'],
    'Value': [1, np.nan, 3, np.nan, 5, 6]
})

# Заполнение средним значением по группам
df_grouped['Value_filled'] = df_grouped.groupby('Category')['Value'].transform(
    lambda x: x.fillna(x.mean())
)
print("Заполнение по группам:")
print(df_grouped)

# Использование других столбцов для предсказания
from sklearn.impute import KNNImputer

# Подготовка данных (только числовые столбцы)
df_numeric = df[['A', 'B', 'C']].copy()

# Применение KNN импутера
imputer = KNNImputer(n_neighbors=2)
df_knn = pd.DataFrame(
    imputer.fit_transform(df_numeric),
    columns=df_numeric.columns
)
print("\\nЗаполнение методом KNN:")
print(df_knn)</code></pre>
    
    <p><strong>5. Работа с дубликатами:</strong></p>
    <pre><code># Создание DataFrame с дубликатами
df_dup = pd.DataFrame({
    'A': [1, 2, 2, 3, 3],
    'B': [4, 5, 5, 6, 7],
    'C': [7, 8, 8, 9, 9]
})

print("DataFrame с дубликатами:")
print(df_dup)

# Поиск дубликатов
print("\\nДубликаты:")
print(df_dup.duplicated())

# Удаление дубликатов
df_no_dup = df_dup.drop_duplicates()
print("\\nПосле удаления дубликатов:")
print(df_no_dup)

# Удаление дубликатов по определенным столбцам
df_no_dup_subset = df_dup.drop_duplicates(subset=['A'])
print("\\nУдаление дубликатов по столбцу A:")
print(df_no_dup_subset)</code></pre>
    
    <p><strong>Практические рекомендации:</strong></p>
    <ul>
        <li>Всегда анализируйте причину отсутствующих данных</li>
        <li>Рассмотрите, не несут ли NaN смысловую нагрузку</li>
        <li>Выбирайте метод заполнения в зависимости от типа данных</li>
        <li>Для временных рядов используйте интерполяцию</li>
        <li>Для категориальных данных используйте моду</li>
        <li>Документируйте все преобразования данных</li>
    </ul>
    
    <p><strong>Пример комплексной очистки данных:</strong></p>
    <pre><code># Функция для комплексной очистки
def clean_dataframe(df):
    """Комплексная очистка DataFrame"""
    df_clean = df.copy()
    
    # Удаление полностью пустых строк и столбцов
    df_clean = df_clean.dropna(how='all').dropna(axis=1, how='all')
    
    # Заполнение числовых столбцов медианой
    numeric_cols = df_clean.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        df_clean[col].fillna(df_clean[col].median(), inplace=True)
    
    # Заполнение категориальных столбцов модой
    categorical_cols = df_clean.select_dtypes(include=['object']).columns
    for col in categorical_cols:
        mode_value = df_clean[col].mode()
        if not mode_value.empty:
            df_clean[col].fillna(mode_value[0], inplace=True)
    
    # Удаление дубликатов
    df_clean = df_clean.drop_duplicates()
    
    return df_clean

# Применение функции
df_cleaned = clean_dataframe(df)
print("Очищенный DataFrame:")
print(df_cleaned)
print(f"\\nИсходный размер: {df.shape}")
print(f"Размер после очистки: {df_cleaned.shape}")</code></pre>`,
            7: `<p>Группировка данных позволяет разделить DataFrame на группы по определенным критериям и применить к каждой группе агрегирующие функции.</p>
        <p>Основная операция группировки:</p>
        <pre><code>import pandas as pd
import numpy as np

# Создаем примерный датасет
data = {
    'отдел': ['IT', 'HR', 'IT', 'Finance', 'HR', 'IT', 'Finance'],
    'сотрудник': ['Алексей', 'Мария', 'Иван', 'Елена', 'Петр', 'Анна', 'Сергей'],
    'зарплата': [80000, 60000, 75000, 70000, 55000, 85000, 65000],
    'стаж': [3, 5, 2, 4, 6, 1, 3]
}
df = pd.DataFrame(data)

# Группировка по отделу
grouped = df.groupby('отдел')
print(type(grouped))  # pandas.core.groupby.generic.DataFrameGroupBy</code></pre>
<p>Агрегирующие функции применяются к группам для получения сводной статистики.</p>
        <p>Основные агрегирующие функции:</p>
        <pre><code># Средняя зарплата по отделам
mean_salary = df.groupby('отдел')['зарплата'].mean()
print(mean_salary)

# Несколько функций одновременно
agg_stats = df.groupby('отдел')['зарплата'].agg(['mean', 'min', 'max', 'count'])
print(agg_stats)

# Агрегация нескольких столбцов
multi_agg = df.groupby('отдел').agg({
    'зарплата': ['mean', 'max'],
    'стаж': ['mean', 'min']
})
print(multi_agg)</code></pre>
        <p>Результат покажет статистику по каждому отделу, что поможет в анализе распределения зарплат и стажа сотрудников.</p>
        <p>Группировка по нескольким столбцам создает иерархические индексы и позволяет проводить более детальный анализ.</p>
        <p>Многоуровневая группировка:</p>
        <pre><code># Расширим датасет
data_extended = {
    'отдел': ['IT', 'HR', 'IT', 'Finance', 'HR', 'IT', 'Finance', 'IT'],
    'город': ['Москва', 'СПб', 'Москва', 'Москва', 'СПб', 'СПб', 'СПб', 'Москва'],
    'сотрудник': ['Алексей', 'Мария', 'Иван', 'Елена', 'Петр', 'Анна', 'Сергей', 'Дмитрий'],
    'зарплата': [80000, 60000, 75000, 70000, 55000, 85000, 65000, 90000]
}
df_ext = pd.DataFrame(data_extended)

# Группировка по отделу и городу
multi_group = df_ext.groupby(['отдел', 'город'])['зарплата'].mean()
print(multi_group)

# Создание сводной таблицы
pivot = df_ext.pivot_table(
    values='зарплата', 
    index='отдел', 
    columns='город', 
    aggfunc='mean'
)
print(pivot)</code></pre>
<p>Метод transform() применяет функцию к каждой группе и возвращает результат той же формы, что и исходный DataFrame.</p>
        <p>Использование transform():</p>
        <pre><code># Нормализация зарплат внутри каждого отдела
df['зарплата_нормализованная'] = df.groupby('отдел')['зарплата'].transform(
    lambda x: (x - x.mean()) / x.std()
)

# Добавление средней зарплаты по отделу
df['средняя_по_отделу'] = df.groupby('отдел')['зарплата'].transform('mean')

# Ранжирование внутри группы
df['ранг_в_отделе'] = df.groupby('отдел')['зарплата'].transform(
    lambda x: x.rank(ascending=False)
)

print(df[['сотрудник', 'отдел', 'зарплата', 'средняя_по_отделу', 'ранг_в_отделе']])</code></pre>
        <p>Transform полезен для создания новых столбцов на основе групповых вычислений.</p>
        <p>Метод apply() позволяет применять пользовательские функции к группам данных.</p>
        <p>Продвинутые операции с apply():</p>
        <pre><code># Функция для анализа группы
def analyze_department(group):
    return pd.Series({
        'количество_сотрудников': len(group),
        'средняя_зарплата': group['зарплата'].mean(),
        'медианная_зарплата': group['зарплата'].median(),
        'разброс_зарплат': group['зарплата'].max() - group['зарплата'].min(),
        'топ_сотрудник': group.loc[group['зарплата'].idxmax(), 'сотрудник']
    })

# Применяем функцию к каждой группе
dept_analysis = df.groupby('отдел').apply(analyze_department)
print(dept_analysis)

# Фильтрация групп
# Только отделы с более чем одним сотрудником
large_depts = df.groupby('отдел').filter(lambda x: len(x) > 1)
print(large_depts)</code></pre>
<p>Практические примеры работы с группировкой и агрегацией на реальных задачах.</p>
        <p>Анализ продаж по месяцам:</p>
        <pre><code># Создаем данные о продажах
sales_data = {
    'дата': pd.date_range('2023-01-01', periods=100, freq='D'),
    'продукт': np.random.choice(['A', 'B', 'C'], 100),
    'регион': np.random.choice(['Север', 'Юг', 'Центр'], 100),
    'продажи': np.random.randint(1000, 10000, 100)
}
sales_df = pd.DataFrame(sales_data)

# Группировка по месяцам
sales_df['месяц'] = sales_df['дата'].dt.to_period('M')
monthly_sales = sales_df.groupby('месяц')['продажи'].agg(['sum', 'mean', 'count'])
print(monthly_sales)

# Динамика продаж по продуктам
product_dynamics = sales_df.groupby(['месяц', 'продукт'])['продажи'].sum().unstack()
print(product_dynamics)

# Расчет доли каждого региона в общих продажах
region_share = sales_df.groupby('регион')['продажи'].sum() / sales_df['продажи'].sum() * 100
print("Доля регионов в продажах:")
print(region_share)</code></pre>`,
            8: `<p>Слияние и объединение данных - это фундаментальные операции в анализе данных, которые позволяют комбинировать информацию из разных источников. В pandas существует несколько способов объединения DataFrame'ов, каждый из которых подходит для определенных сценариев.</p>
        <p>Операция merge() является аналогом SQL JOIN и позволяет объединять данные на основе общих ключей. Это наиболее гибкий и часто используемый способ объединения данных в pandas.</p>
        <p>Базовый пример merge():</p>
        <pre><code>import pandas as pd

# Создаем тестовые данные
employees = pd.DataFrame({
    'emp_id': [1, 2, 3, 4],
    'name': ['Алиса', 'Борис', 'Вера', 'Григорий'],
    'department_id': [101, 102, 101, 103]
})

departments = pd.DataFrame({
    'dept_id': [101, 102, 103],
    'dept_name': ['ИТ', 'Маркетинг', 'Финансы']
})

# Объединение данных
result = pd.merge(employees, departments, 
                 left_on='department_id', 
                 right_on='dept_id')</code></pre>
                 <p>Типы соединений в merge() определяют, какие записи будут включены в результирующий DataFrame. Понимание различий между типами JOIN критично для корректного анализа данных.</p>
        <p><strong>Inner Join (внутреннее соединение)</strong> - возвращает только те записи, для которых найдены соответствия в обеих таблицах. Это поведение по умолчанию и самый безопасный тип соединения, так как исключает неполные данные.</p>
        <p><strong>Left Join (левое соединение)</strong> - сохраняет все записи из левой таблицы, добавляя соответствующие данные из правой. Если соответствие не найдено, в столбцах правой таблицы будут значения NaN.</p>
        <p><strong>Right Join (правое соединение)</strong> - противоположность левого соединения, сохраняет все записи правой таблицы.</p>
        <p><strong>Outer Join (внешнее соединение)</strong> - объединяет все записи из обеих таблиц, заполняя отсутствующие значения NaN.</p>
        <pre><code># Примеры различных типов соединений
inner_join = pd.merge(df1, df2, on='key', how='inner')
left_join = pd.merge(df1, df2, on='key', how='left')
right_join = pd.merge(df1, df2, on='key', how='right')
outer_join = pd.merge(df1, df2, on='key', how='outer')</code></pre>
<p>Функция concat() предназначена для объединения DataFrame'ов вдоль определенной оси (строки или столбцы). В отличие от merge(), concat() не требует общих ключей и просто "склеивает" данные вместе.</p>
        <p>Конкатенация по строкам (axis=0) используется для объединения данных с одинаковой структурой столбцов, например, при работе с данными за разные периоды времени или из разных источников с идентичной схемой.</p>
        <p>Конкатенация по столбцам (axis=1) позволяет добавлять новые переменные к существующему набору данных. При этом важно убедиться, что индексы DataFrame'ов совпадают.</p>
        <pre><code># Конкатенация по строкам
df_2020 = pd.DataFrame({'sales': [100, 200], 'region': ['Север', 'Юг']})
df_2021 = pd.DataFrame({'sales': [150, 250], 'region': ['Север', 'Юг']})
combined_years = pd.concat([df_2020, df_2021], ignore_index=True)

# Конкатенация по столбцам  
df_base = pd.DataFrame({'name': ['Анна', 'Петр'], 'age': [25, 30]})
df_extra = pd.DataFrame({'salary': [50000, 60000], 'city': ['Москва', 'СПб']})
combined_cols = pd.concat([df_base, df_extra], axis=1)</code></pre>
<p>Метод join() представляет собой упрощенную версию merge(), оптимизированную для объединения по индексам DataFrame'ов. Это делает join() быстрее и удобнее в ситуациях, когда данные уже правильно проиндексированы.</p>
        <p>Основное преимущество join() заключается в его простоте - не нужно указывать столбцы для объединения, так как используются индексы. Это особенно полезно при работе с временными рядами, где индекс обычно представляет время.</p>
        <p>join() поддерживает те же типы соединений, что и merge(), но синтаксис более лаконичный. По умолчанию выполняется левое соединение.</p>
        <pre><code># Подготовка данных с индексами
products = pd.DataFrame({
    'name': ['Телефон', 'Ноутбук', 'Планшет'],
    'price': [30000, 60000, 25000]
}, index=[1, 2, 3])

categories = pd.DataFrame({
    'category': ['Электроника', 'Компьютеры', 'Электроника']
}, index=[1, 2, 3])

# Объединение по индексам
result = products.join(categories)

# Различные типы join
left_result = products.join(categories, how='left')
inner_result = products.join(categories, how='inner')</code></pre>`,
            9: `<p>Временные ряды представляют собой последовательность данных, упорядоченных по времени. Это один из самых важных типов данных в анализе, поскольку большинство реальных данных имеют временную составляющую - от биржевых котировок до метеорологических наблюдений.</p>

<p>В pandas работа с временными рядами значительно упрощена благодаря встроенным инструментам для обработки дат и времени. Библиотека автоматически распознает множество форматов дат и предоставляет мощные возможности для их манипуляции.</p>

<p><strong>Создание временных индексов:</strong></p>
<pre><code>import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Создание диапазона дат
dates = pd.date_range('2023-01-01', periods=100, freq='D')
ts = pd.Series(np.random.randn(100), index=dates)

# Создание временного ряда из строк
date_strings = ['2023-01-01', '2023-01-02', '2023-01-03']
ts_from_strings = pd.Series([1, 2, 3], index=pd.to_datetime(date_strings))</code></pre>

<p>Pandas понимает множество частот (frequencies): 'D' для дней, 'H' для часов, 'M' для месяцев, 'Y' для лет, 'B' для рабочих дней и многие другие. Это позволяет легко создавать регулярные временные последовательности для любых нужд анализа.</p>

<p><strong>Индексация и выборка по времени:</strong></p>
<pre><code># Выборка по году
ts['2023']

# Выборка по месяцу
ts['2023-01']

# Выборка диапазона
ts['2023-01-01':'2023-01-31']

# Выборка последних N периодов
ts.tail(10)

# Условная выборка по дням недели
ts[ts.index.dayofweek < 5]  # только рабочие дни</code></pre>

<p>Временная индексация в pandas интуитивно понятна и позволяет использовать строковые представления дат для быстрой навигации по данным. Это особенно удобно при исследовательском анализе, когда нужно быстро посмотреть на определенные периоды.</p>

<p><strong>Ресэмплинг данных:</strong></p>
<p>Ресэмплинг - это процесс изменения частоты временного ряда. Это может быть понижение частоты (downsampling) для агрегации данных или повышение частоты (upsampling) для интерполяции отсутствующих значений.</p>

<pre><code># Агрегация по неделям (понижение частоты)
weekly_mean = ts.resample('W').mean()
weekly_sum = ts.resample('W').sum()

# Агрегация по месяцам с разными функциями
monthly_stats = ts.resample('M').agg(['mean', 'std', 'min', 'max'])

# Повышение частоты до часов с интерполяцией
hourly_data = ts.resample('H').interpolate(method='linear')</code></pre>

<p>Ресэмплинг особенно полезен при работе с данными разной частоты - например, когда нужно объединить дневные данные о продажах с месячными бюджетными показателями.</p>

<p><strong>Скользящие окна:</strong></p>
<p>Скользящие окна позволяют вычислять статистики на движущихся подмножествах данных. Это фундаментальный инструмент для сглаживания временных рядов и выявления трендов.</p>

<pre><code># Скользящее среднее
rolling_mean = ts.rolling(window=7).mean()  # недельное среднее
rolling_mean_30 = ts.rolling(window=30).mean()  # месячное среднее

# Экспоненциально взвешенное среднее
ewm = ts.ewm(span=10).mean()

# Скользящие статистики
rolling_stats = ts.rolling(window=14).agg(['mean', 'std', 'min', 'max'])

# Скользящая корреляция между двумя рядами
correlation = ts1.rolling(window=30).corr(ts2)</code></pre>

<p>Экспоненциально взвешенное среднее дает больший вес более свежим наблюдениям, что делает его особенно полезным для финансового анализа и прогнозирования.</p>

<p><strong>Сдвиги и лаги:</strong></p>
<pre><code># Сдвиг вперед (лаг)
lagged = ts.shift(1)  # сдвиг на один период назад
lead = ts.shift(-1)   # сдвиг на один период вперед

# Вычисление изменений
daily_change = ts.diff()  # абсолютное изменение
pct_change = ts.pct_change()  # процентное изменение

# Сравнение с тем же периодом предыдущего года
year_over_year = ts.pct_change(periods=365)</code></pre>

<p><strong>Работа с часовыми поясами:</strong></p>
<pre><code># Локализация во временной зоне
ts_utc = ts.tz_localize('UTC')
ts_moscow = ts.tz_localize('Europe/Moscow')

# Конвертация между часовыми поясами
ts_ny = ts_moscow.tz_convert('America/New_York')

# Работа с наивными и осведомленными о часовых поясах временными рядами
ts_naive = ts.tz_localize(None)  # удаление информации о часовом поясе</code></pre>

<p><strong>Практический пример анализа временного ряда:</strong></p>
<pre><code># Загрузка данных о продажах
sales_data = pd.read_csv('sales.csv', index_col='date', parse_dates=True)

# Базовая статистика
print(f"Период данных: {sales_data.index.min()} - {sales_data.index.max()}")
print(f"Общие продажи: {sales_data['amount'].sum():.2f}")

# Анализ сезонности
monthly_sales = sales_data.resample('M')['amount'].sum()
seasonal_pattern = monthly_sales.groupby(monthly_sales.index.month).mean()

# Выявление тренда
trend = sales_data['amount'].rolling(window=30).mean()
detrended = sales_data['amount'] - trend

# Поиск аномалий
rolling_std = sales_data['amount'].rolling(window=30).std()
threshold = 2 * rolling_std
anomalies = sales_data[abs(detrended) > threshold]</code></pre>

<p>Анализ временных рядов требует понимания их компонентов: тренда (долгосрочное направление), сезонности (повторяющиеся паттерны) и случайного шума. Pandas предоставляет инструменты для разложения временного ряда на эти компоненты и их отдельного анализа.</p>

<p>При работе с временными рядами важно помнить о качестве данных: проверять на пропуски, дубликаты временных меток и соответствие ожидаемой частоте. Pandas помогает выявить и исправить такие проблемы с помощью методов like <code>asfreq()</code>, <code>fillna()</code> и <code>drop_duplicates()</code>.</p>`,
            10: `<p>Matplotlib является основной библиотекой для создания статических визуализаций в Python. Эта мощная и гибкая библиотека предоставляет полный контроль над каждым элементом графика, позволяя создавать как простые диаграммы для быстрого анализа, так и сложные многоуровневые визуализации для научных публикаций.</p>

<p>История matplotlib начинается с 2003 года, когда Джон Хантер создал её для имитации функциональности MATLAB в Python. Сегодня это стандарт де-факто для визуализации данных в научном сообществе Python, и понимание её принципов работы критически важно для любого специалиста по анализу данных.</p>

<p>Архитектура matplotlib построена на концепции Figure (фигура) и Axes (оси). Figure представляет собой контейнер верхнего уровня, который может содержать один или несколько объектов Axes. Каждый Axes представляет область построения графика с собственными осями координат. Понимание этой иерархии ключевое для эффективной работы с библиотекой.</p>

<pre><code>import matplotlib.pyplot as plt
import numpy as np

# Создание базового графика
x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y)
plt.title('Синусоидальная функция')
plt.xlabel('X')
plt.ylabel('Y')
plt.grid(True)
plt.show()</code></pre>

<p>Matplotlib поддерживает два основных стиля программирования: pyplot-интерфейс (похожий на MATLAB) и объектно-ориентированный интерфейс. Pyplot-интерфейс удобен для быстрого создания простых графиков, но для сложных визуализаций рекомендуется использовать объектно-ориентированный подход, который предоставляет больше контроля и гибкости.</p>

<pre><code># Объектно-ориентированный подход
fig, ax = plt.subplots(figsize=(12, 8))

# Создание нескольких линий на одном графике
x = np.linspace(0, 2*np.pi, 100)
ax.plot(x, np.sin(x), label='sin(x)', linewidth=2, color='blue')
ax.plot(x, np.cos(x), label='cos(x)', linewidth=2, color='red', linestyle='--')
ax.plot(x, np.tan(x), label='tan(x)', linewidth=1, color='green', alpha=0.7)

ax.set_title('Тригонометрические функции', fontsize=16, fontweight='bold')
ax.set_xlabel('Угол (радианы)', fontsize=12)
ax.set_ylabel('Значение функции', fontsize=12)
ax.legend(loc='upper right')
ax.grid(True, alpha=0.3)
ax.set_ylim(-2, 2)  # Ограничение по оси Y для лучшей видимости</code></pre>

<p>Настройка внешнего вида графиков в matplotlib чрезвычайно гибкая. Можно контролировать цвета, стили линий, маркеры, шрифты, размеры и множество других параметров. Библиотека включает несколько предустановленных стилей, которые можно применить для быстрого изменения общего вида всех графиков.</p>

<pre><code># Применение стилей
plt.style.use('seaborn-v0_8')  # Современный научный стиль
# Альтернативы: 'ggplot', 'classic', 'dark_background'

# Настройка цветов и стилей
colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECCA7']
line_styles = ['-', '--', '-.', ':', '-']

fig, ax = plt.subplots(figsize=(10, 6))
for i, (color, style) in enumerate(zip(colors, line_styles)):
    y = np.sin(x + i*0.5)
    ax.plot(x, y, color=color, linestyle=style, linewidth=2, 
            label=f'Функция {i+1}', marker='o', markersize=4, markevery=10)</code></pre>

<p>Matplotlib поддерживает широкий спектр типов графиков. Линейные графики идеальны для показа трендов во времени, столбчатые диаграммы хороши для сравнения категорий, гистограммы показывают распределение данных, а диаграммы рассеяния помогают выявить корреляции между переменными.</p>

<pre><code># Создание субплотов для демонстрации разных типов графиков
fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))

# Линейный график
x = np.linspace(0, 10, 50)
y1 = x**2 + np.random.normal(0, 10, 50)
ax1.plot(x, y1, 'bo-', markersize=4)
ax1.set_title('Линейный график с шумом')
ax1.grid(True, alpha=0.3)

# Столбчатая диаграмма
categories = ['A', 'B', 'C', 'D', 'E']
values = [23, 45, 56, 78, 32]
bars = ax2.bar(categories, values, color=['red', 'green', 'blue', 'orange', 'purple'])
ax2.set_title('Столбчатая диаграмма')
ax2.set_ylabel('Значения')

# Гистограмма
data = np.random.normal(100, 15, 1000)
ax3.hist(data, bins=30, alpha=0.7, color='skyblue', edgecolor='black')
ax3.set_title('Гистограмма нормального распределения')
ax3.set_xlabel('Значения')
ax3.set_ylabel('Частота')

# Диаграмма рассеяния
x_scatter = np.random.randn(200)
y_scatter = 2*x_scatter + np.random.randn(200)
ax4.scatter(x_scatter, y_scatter, alpha=0.6, c=y_scatter, cmap='viridis')
ax4.set_title('Диаграмма рассеяния с цветовым кодированием')
ax4.set_xlabel('X')
ax4.set_ylabel('Y')

plt.tight_layout()  # Автоматическая настройка отступов</code></pre>

<p>Аннотации и подписи играют важную роль в создании информативных графиков. Matplotlib позволяет добавлять текст в любую точку графика, создавать стрелки, выделять важные области и добавлять математические формулы с использованием LaTeX-синтаксиса.</p>

<pre><code># Добавление аннотаций и подписей
fig, ax = plt.subplots(figsize=(10, 8))

x = np.linspace(0, 10, 100)
y = np.exp(-x/3) * np.cos(2*x)
ax.plot(x, y, 'b-', linewidth=2)

# Поиск максимального значения для аннотации
max_idx = np.argmax(y)
max_x, max_y = x[max_idx], y[max_idx]

# Добавление аннотации с стрелкой
ax.annotate(f'Максимум: ({max_x:.2f}, {max_y:.2f})',
            xy=(max_x, max_y), xytext=(max_x+2, max_y+0.3),
            arrowprops=dict(arrowstyle='->', color='red', lw=2),
            fontsize=12, ha='center',
            bbox=dict(boxstyle='round,pad=0.3', facecolor='yellow', alpha=0.7))

# Добавление математической формулы
ax.text(6, -0.5, r'$y = e^{-x/3} \cdot \cos(2x)$', 
        fontsize=14, bbox=dict(boxstyle='round', facecolor='lightblue'))

ax.set_title('График с аннотациями и формулами', fontsize=16)
ax.grid(True, alpha=0.3)</code></pre>

<p>Сохранение графиков в различных форматах является важной частью рабочего процесса. Matplotlib поддерживает множество форматов вывода: PNG для веб-использования, PDF для печати, SVG для векторной графики, и EPS для научных публикаций. Качество и разрешение можно тонко настраивать в зависимости от назначения.</p>

<pre><code># Сохранение в различных форматах с настройкой качества
plt.figure(figsize=(10, 6))
plt.plot(x, y, linewidth=2)
plt.title('График для сохранения')

# Сохранение в высоком разрешении для печати
plt.savefig('график_высокое_качество.png', dpi=300, bbox_inches='tight', 
            facecolor='white', edgecolor='none')

# Сохранение в векторном формате
plt.savefig('график_вектор.pdf', format='pdf', bbox_inches='tight')

# Сохранение для веб-использования
plt.savefig('график_веб.png', dpi=150, bbox_inches='tight', 
            optimize=True, facecolor='white')</code></pre>

<p>Понимание системы координат matplotlib критически важно для создания сложных визуализаций. Библиотека использует несколько систем координат: data coordinates (координаты данных), axes coordinates (координаты осей), figure coordinates (координаты фигуры), и display coordinates (экранные координаты). Это позволяет точно позиционировать элементы независимо от масштаба данных.</p>

<p>Интерактивность в matplotlib может быть достигнута через различные backend'ы. В Jupyter notebooks часто используется %matplotlib widget для создания интерактивных графиков, которые позволяют пользователю масштабировать, панорамировать и исследовать данные в реальном времени. Это особенно полезно при исследовательском анализе данных, когда необходимо быстро изучить различные аспекты датасета.</p>`,
            11: `<p>Seaborn — это мощная библиотека визуализации данных, построенная поверх matplotlib, которая значительно упрощает создание красивых и информативных статистических графиков. Основное преимущество seaborn заключается в том, что она предоставляет высокоуровневый интерфейс для создания сложных визуализаций с минимальным количеством кода.</p>

<p>Seaborn особенно хорошо интегрирована с pandas DataFrame и автоматически понимает структуру данных, что позволяет создавать графики просто указывая названия столбцов. Библиотека также включает множество встроенных цветовых палитр и стилей, делая ваши графики профессиональными без дополнительных усилий.</p>

<p>Установка и импорт seaborn:</p>
<pre><code>import seaborn as sns
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

# Настройка стиля по умолчанию
sns.set_style("whitegrid")</code></pre>

<p>Одной из ключевых особенностей seaborn является возможность создания комплексных многомерных визуализаций. Рассмотрим создание корреляционной матрицы — одного из самых популярных способов анализа взаимосвязей между переменными:</p>

<pre><code># Создание корреляционной матрицы
correlation_matrix = df.corr()
plt.figure(figsize=(10, 8))
sns.heatmap(correlation_matrix, 
            annot=True,           # показать значения
            cmap='coolwarm',      # цветовая палитра
            center=0,             # центрировать на 0
            square=True)          # квадратные ячейки
plt.title('Корреляционная матрица переменных')
plt.show()</code></pre>

<p>Seaborn предоставляет специализированные функции для различных типов статистических графиков. Scatter plot с линией регрессии позволяет быстро оценить линейную зависимость между переменными:</p>

<pre><code># Диаграмма рассеяния с линией регрессии
plt.figure(figsize=(10, 6))
sns.regplot(data=df, x='feature1', y='target', 
           scatter_kws={'alpha':0.6}, 
           line_kws={'color':'red'})
plt.title('Зависимость между признаком и целевой переменной')
plt.show()</code></pre>

<p>Для анализа распределений seaborn предлагает множество удобных инструментов. Violin plot сочетает в себе информацию boxplot и kernel density estimation:</p>

<pre><code># Violin plot для анализа распределений по группам
plt.figure(figsize=(12, 6))
sns.violinplot(data=df, x='category', y='value', 
              inner='quartile',  # показать квартили
              palette='Set2')
plt.xticks(rotation=45)
plt.title('Распределение значений по категориям')
plt.show()</code></pre>

<p>Pairplot — это мощный инструмент для быстрого исследовательного анализа данных, который показывает попарные отношения между всеми числовыми переменными в наборе данных:</p>

<pre><code># Матрица парных графиков
sns.pairplot(df, 
            hue='target_category',  # раскраска по категории
            diag_kind='kde',        # тип диагональных графиков
            markers='o')
plt.suptitle('Матрица парных зависимостей', y=1.02)
plt.show()</code></pre>

<p>Для временных рядов и анализа трендов seaborn предоставляет удобные функции линейных графиков с доверительными интервалами:</p>

<pre><code># Линейный график с доверительным интервалом
plt.figure(figsize=(12, 6))
sns.lineplot(data=df, x='date', y='value', 
            hue='group',           # разные линии для групп
            style='group',         # разные стили линий
            markers=True,          # показать маркеры
            err_style='band')      # стиль доверительного интервала
plt.xticks(rotation=45)
plt.title('Динамика показателей по группам')
plt.show()</code></pre>

<p>Важной особенностью seaborn является система faceting, которая позволяет создавать подграфики для разных подгрупп данных. FacetGrid предоставляет гибкий способ создания множественных графиков:</p>

<pre><code># Создание сетки подграфиков
g = sns.FacetGrid(df, col='category', row='subcategory', 
                 height=4, aspect=1.2)
g.map(sns.scatterplot, 'x', 'y', alpha=0.7)
g.add_legend()
plt.show()</code></pre>

<p>Настройка цветовых палитр в seaborn позволяет создавать профессионально выглядящие графики. Библиотека предоставляет множество готовых палитр, а также возможность создания собственных:</p>

<pre><code># Работа с цветовыми палитрами
# Просмотр доступных палитр
sns.color_palette("husl", 8)

# Создание пользовательской палитры
custom_palette = sns.color_palette(["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"])
sns.set_palette(custom_palette)

# Применение палитры к графику
plt.figure(figsize=(10, 6))
sns.boxplot(data=df, x='category', y='value')
plt.title('Распределение по категориям с пользовательской палитрой')
plt.show()</code></pre>

<p>Seaborn также предоставляет удобные функции для статистических тестов прямо на графиках. Например, можно добавить результаты t-тестов между группами:</p>

<pre><code># График с статистическими аннотациями
from scipy import stats

plt.figure(figsize=(10, 6))
ax = sns.boxplot(data=df, x='group', y='value')

# Добавление статистических сравнений
pairs = [('group1', 'group2'), ('group1', 'group3')]
for i, (group1, group2) in enumerate(pairs):
    y_pos = df['value'].max() + (i + 1) * 0.1 * df['value'].std()
    plt.plot([0, 1], [y_pos, y_pos], 'k-', alpha=0.5)
    plt.text(0.5, y_pos + 0.02, '**', ha='center', va='bottom')

plt.title('Сравнение групп с статистической значимостью')
plt.show()</code></pre>

<p>Комбинирование seaborn с matplotlib позволяет создавать сложные многопанельные визуализации. Вы можете использовать subplot для создания комплексных дашбордов:</p>

<pre><code># Комплексная визуализация с несколькими типами графиков
fig, axes = plt.subplots(2, 2, figsize=(15, 12))

# График 1: Гистограмма с KDE
sns.histplot(data=df, x='value', kde=True, ax=axes[0,0])
axes[0,0].set_title('Распределение значений')

# График 2: Корреляционная матрица
sns.heatmap(df.corr(), annot=True, ax=axes[0,1], cmap='coolwarm')
axes[0,1].set_title('Корреляции')

# График 3: Boxplot по категориям
sns.boxplot(data=df, x='category', y='value', ax=axes[1,0])
axes[1,0].set_title('Распределение по категориям')

# График 4: Scatter plot с регрессией
sns.regplot(data=df, x='feature', y='target', ax=axes[1,1])
axes[1,1].set_title('Зависимость признака и цели')

plt.tight_layout()
plt.show()</code></pre>

<p>Настройка тем и стилей в seaborn позволяет быстро изменять общий вид всех графиков. Доступны различные предустановленные темы, которые можно комбинировать с настройками контекста:</p>

<pre><code># Настройка глобального стиля
sns.set_theme(style="whitegrid", palette="pastel")
sns.set_context("paper", font_scale=1.2)  # или "talk", "poster", "notebook"

# Временное изменение стиля для конкретного графика
with sns.axes_style("darkgrid"):
    plt.figure(figsize=(10, 6))
    sns.lineplot(data=df, x='x', y='y')
    plt.title('График с темной сеткой')
    plt.show()</code></pre>`,
            12: `<p>Plotly — это мощная библиотека для создания интерактивных визуализаций, которые позволяют пользователям взаимодействовать с графиками: увеличивать, уменьшать, наводить курсор для получения дополнительной информации и фильтровать данные. В отличие от статичных графиков matplotlib и seaborn, plotly создает динамические визуализации, которые особенно полезны для презентаций и веб-приложений.</p>

<p>Основные преимущества plotly включают автоматическую интерактивность, поддержку 3D-графиков, возможность экспорта в HTML для встраивания в веб-страницы и интеграцию с Jupyter Notebook. Библиотека поддерживает множество типов графиков: от простых линейных и точечных до сложных поверхностных и географических карт.</p>

<p>Установка и базовая настройка plotly:</p>
<pre><code>import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np

# Настройка для отображения в Jupyter
import plotly.offline as pyo
pyo.init_notebook_mode(connected=True)</code></pre>

<p>Plotly Express — это высокоуровневый интерфейс, который позволяет быстро создавать красивые интерактивные графики с минимальным количеством кода. Он автоматически обрабатывает группировку данных, цветовое кодирование и создание легенд:</p>

<pre><code># Создание интерактивного scatter plot
df = px.data.iris()
fig = px.scatter(df, x="sepal_width", y="sepal_length", 
                 color="species", size="petal_length",
                 hover_data=['petal_width'],
                 title="Интерактивная диаграмма рассеяния")
fig.show()

# Линейный график с возможностью переключения
df_stock = px.data.stocks()
fig = px.line(df_stock, x="date", y="GOOG", 
              title="Цена акций Google")
fig.update_layout(
    xaxis_title="Дата",
    yaxis_title="Цена ($)",
    hovermode='x unified'
)
fig.show()</code></pre>

<p>Graph Objects предоставляет более детальный контроль над каждым элементом графика. Этот подход требует больше кода, но позволяет создавать сложные кастомизированные визуализации:</p>

<pre><code># Создание графика с несколькими трассами
fig = go.Figure()

# Добавление линии
fig.add_trace(go.Scatter(x=[1, 2, 3, 4], y=[10, 11, 12, 13],
                         mode='lines+markers',
                         name='Тренд 1',
                         line=dict(color='blue', width=2)))

# Добавление второй линии
fig.add_trace(go.Scatter(x=[1, 2, 3, 4], y=[16, 15, 14, 13],
                         mode='lines+markers',
                         name='Тренд 2',
                         line=dict(color='red', dash='dash')))

# Настройка макета
fig.update_layout(
    title="Сравнение трендов",
    xaxis_title="Время",
    yaxis_title="Значение",
    legend=dict(x=0, y=1),
    template="plotly_white"
)
fig.show()</code></pre>

<p>Subplots в plotly позволяют создавать комплексные панели управления с несколькими связанными графиками. Это особенно полезно для создания дашбордов:</p>

<pre><code>from plotly.subplots import make_subplots

# Создание подграфиков
fig = make_subplots(
    rows=2, cols=2,
    subplot_titles=("График 1", "График 2", "График 3", "График 4"),
    specs=[[{"secondary_y": True}, {"type": "xy"}],
           [{"type": "polar"}, {"type": "domain"}]]
)

# Добавление различных типов графиков
fig.add_trace(go.Scatter(x=[1, 2, 3], y=[4, 5, 6], name="trace1"), 
              row=1, col=1)
fig.add_trace(go.Bar(x=[1, 2, 3], y=[2, 3, 4], name="trace2"), 
              row=1, col=2)

fig.update_layout(height=600, showlegend=False)
fig.show()</code></pre>

<p>Интерактивные возможности plotly включают zoom, pan, hover, выбор области, переключение трасс и многое другое. Можно настроить какие именно инструменты будут доступны пользователю:</p>

<pre><code># Настройка интерактивности
fig = px.scatter(df, x="sepal_width", y="sepal_length", color="species")
fig.update_layout(
    dragmode='select',  # режим выделения
    selectdirection='diagonal',
    hovermode='closest'
)

# Настройка hover-информации
fig.update_traces(
    hovertemplate="<b>%{text}</b><br>" +
                  "Ширина: %{x}<br>" +
                  "Длина: %{y}<br>" +
                  "<extra></extra>"  # убирает рамку
)
fig.show()</code></pre>`,
            13: `<p>SciPy — это фундаментальная библиотека для научных вычислений в Python, которая расширяет возможности NumPy, предоставляя широкий спектр статистических инструментов, алгоритмов оптимизации, методов интегрирования и обработки сигналов. Для анализа данных особенно важен модуль scipy.stats, который содержит большое количество статистических функций и распределений.</p>

<p>Основные статистические тесты помогают проверить различные гипотезы о данных. Важно понимать предположения каждого теста и правильно интерпретировать результаты:</p>

<pre><code>import scipy.stats as stats
import numpy as np
import pandas as pd

# Генерация тестовых данных
np.random.seed(42)
group1 = np.random.normal(100, 15, 30)
group2 = np.random.normal(105, 15, 35)
normal_data = np.random.normal(50, 10, 100)

# T-тест для одной выборки
# Проверяем, отличается ли среднее от заданного значения
t_stat, p_value = stats.ttest_1samp(group1, 95)
print(f"T-статистика: {t_stat:.3f}, p-value: {p_value:.3f}")

# T-тест для двух независимых выборок
t_stat, p_value = stats.ttest_ind(group1, group2)
print(f"Сравнение групп - T-статистика: {t_stat:.3f}, p-value: {p_value:.3f}")

# Парный t-тест (для связанных выборок)
before = np.random.normal(80, 10, 20)
after = before + np.random.normal(5, 8, 20)  # есть эффект
t_stat, p_value = stats.ttest_rel(before, after)
print(f"Парный t-тест - T-статистика: {t_stat:.3f}, p-value: {p_value:.3f}")</code></pre>

<p>Тесты на нормальность распределения критически важны, так как многие статистические методы предполагают нормальность данных. SciPy предоставляет несколько тестов для проверки этого предположения:</p>

<pre><code># Тест Шапиро-Уилка (лучший для малых выборок)
shapiro_stat, shapiro_p = stats.shapiro(normal_data)
print(f"Тест Шапиро-Уилка: статистика={shapiro_stat:.3f}, p-value={shapiro_p:.3f}")

# Тест Колмогорова-Смирнова
ks_stat, ks_p = stats.kstest(normal_data, 'norm', 
                             args=(normal_data.mean(), normal_data.std()))
print(f"Тест К-С: статистика={ks_stat:.3f}, p-value={ks_p:.3f}")

# Тест Андерсона-Дарлинга
ad_stat, critical_values, significance_level = stats.anderson(normal_data, dist='norm')
print(f"Тест Андерсона-Дарлинга: статистика={ad_stat:.3f}")
print(f"Критические значения: {critical_values}")

# Визуальная проверка нормальности
import matplotlib.pyplot as plt
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

# Q-Q plot
stats.probplot(normal_data, dist="norm", plot=ax1)
ax1.set_title("Q-Q график")

# Гистограмма с наложенной нормальной кривой
ax2.hist(normal_data, bins=20, density=True, alpha=0.7)
x = np.linspace(normal_data.min(), normal_data.max(), 100)
ax2.plot(x, stats.norm.pdf(x, normal_data.mean(), normal_data.std()), 'r-')
ax2.set_title("Гистограмма с нормальной кривой")
plt.tight_layout()
plt.show()</code></pre>

<p>Корреляционный анализ позволяет выявить связи между переменными. SciPy предоставляет различные методы вычисления корреляции, каждый из которых подходит для определенных типов данных:</p>

<pre><code># Корреляция Пирсона (для линейных связей)
x = np.random.normal(0, 1, 100)
y = 2 * x + np.random.normal(0, 0.5, 100)  # линейная связь с шумом

pearson_corr, pearson_p = stats.pearsonr(x, y)
print(f"Корреляция Пирсона: r={pearson_corr:.3f}, p-value={pearson_p:.3f}")

# Корреляция Спирмена (для монотонных связей)
x_rank = np.random.exponential(2, 50)  # неравномерное распределение
y_rank = x_rank**2 + np.random.normal(0, 10, 50)  # нелинейная связь

spearman_corr, spearman_p = stats.spearmanr(x_rank, y_rank)
print(f"Корреляция Спирмена: ρ={spearman_corr:.3f}, p-value={spearman_p:.3f}")

# Тау Кендалла (устойчив к выбросам)
kendall_corr, kendall_p = stats.kendalltau(x_rank, y_rank)
print(f"Тау Кендалла: τ={kendall_corr:.3f}, p-value={kendall_p:.3f}")</code></pre>

<p>Непараметрические тесты используются когда данные не соответствуют предположениям параметрических тестов или имеют порядковый характер:</p>

<pre><code># Тест Манна-Уитни U (альтернатива t-тесту для двух выборок)
group_a = np.random.exponential(2, 30)  # не нормальное распределение
group_b = np.random.exponential(2.5, 25)

u_stat, u_p = stats.mannwhitneyu(group_a, group_b, alternative='two-sided')
print(f"Тест Манна-Уитни U: U={u_stat}, p-value={u_p:.3f}")

# Тест Уилкоксона (альтернатива парному t-тесту)
before_non_normal = np.random.exponential(2, 20)
after_non_normal = before_non_normal * 1.2 + np.random.exponential(0.5, 20)

w_stat, w_p = stats.wilcoxon(before_non_normal, after_non_normal)
print(f"Тест Уилкоксона: W={w_stat}, p-value={w_p:.3f}")

# Тест Краскела-Уоллиса (альтернатива ANOVA для нескольких групп)
group1 = np.random.exponential(1, 20)
group2 = np.random.exponential(1.5, 18)
group3 = np.random.exponential(2, 22)

h_stat, h_p = stats.kruskal(group1, group2, group3)
print(f"Тест Краскела-Уоллиса: H={h_stat:.3f}, p-value={h_p:.3f}")</code></pre>

<p>Работа с различными статистическими распределениями — важная часть анализа данных. SciPy предоставляет унифицированный интерфейс для работы с более чем 100 распределениями:</p>

<pre><code># Работа с нормальным распределением
mu, sigma = 100, 15
norm_dist = stats.norm(mu, sigma)

# Вычисление различных характеристик
print(f"Среднее: {norm_dist.mean()}")
print(f"Дисперсия: {norm_dist.var()}")
print(f"P(X < 110): {norm_dist.cdf(110):.3f}")
print(f"95-й процентиль: {norm_dist.ppf(0.95):.2f}")

# Генерация случайных выборок
random_sample = norm_dist.rvs(size=1000)`,
            14: `<p>Основы машинного обучения с scikit-learn:</p>
        <ul>
            <li>Типы задач ML: классификация, регрессия, кластеризация</li>
            <li>Типовой пайплайн: подготовка данных → разделение → обучение → оценка</li>
            <li>Важность feature scaling и кросс-валидации</li>
        </ul>
        
        <p>Пример линейной регрессии:</p>
        <pre><code>from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    data[['feature']], data.target, test_size=0.3
)

model = LinearRegression()
model.fit(X_train, y_train)
predictions = model.predict(X_test)</code></pre>

        <p>Метрики оценки:</p>
        <ul>
            <li>Для регрессии: MAE, MSE, R²</li>
            <li>Для классификации: Accuracy, Precision, Recall</li>
            <li>Переобучение - когда accuracy на train >> test</li>
        </ul>`,
            15: `<p>Обработка текстовых данных:</p>
        <ul>
            <li>Токенизация с NLTK: nltk.word_tokenize(text)</li>
            <li>Удаление стоп-слов: from nltk.corpus import stopwords</li>
            <li>Лемматизация: WordNetLemmatizer().lemmatize(word)</li>
        </ul>

        <p>Пример векторизации текста:</p>
        <pre><code>from sklearn.feature_extraction.text import TfidfVectorizer

corpus = ["Текст номер один", "Еще один документ"]
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(corpus)</code></pre>

        <p>Практические советы:</p>
        <ul>
            <li>Используйте стемминг для английских текстов</li>
            <li>Попробуйте word embeddings для сложных задач</li>
            <li>Регулярные выражения для поиска паттернов</li>
        </ul>`,
            16: `<p>Web-скрейпинг с BeautifulSoup:</p>
        <ul>
            <li>Проверяйте robots.txt сайта</li>
            <li>Используйте задержки между запросами</li>
            <li>Кэшируйте скачанные данные</li>
        </ul>

        <pre><code>import requests
from bs4 import BeautifulSoup

url = "https://example.com"
response = requests.get(url)
soup = BeautifulSoup(response.text, 'html.parser')

titles = [h1.text for h1 in soup.find_all('h1')]</code></pre>

        <p>Этические правила:</p>
        <ul>
            <li>Не перегружайте серверы</li>
            <li>Соблюдайте авторские права</li>
            <li>Используйте официальные API когда возможно</li>
        </ul>`,
            17: `<p>Автоматизация анализа:</p>
        <ul>
            <li>Создавайте воспроизводимые пайплайны</li>
            <li>Используйте Airflow для сложных задач</li>
            <li>Логируйте все этапы выполнения</li>
        </ul>

        <p>Пример ETL-скрипта:</p>
        <pre><code>def etl_pipeline():
    # Extract
    data = pd.read_csv('source.csv')
    
    # Transform
    data['new_col'] = data.value * 100
    
    # Load
    data.to_parquet('output.parquet')

if __name__ == "__main__":
    etl_pipeline()</code></pre>

        <p>Автоматизация отчетов:</p>
        <ul>
            <li>Генерация PDF через LaTeX</li>
            <li>Отправка email с вложениями</li>
            <li>Интеграция с Google Sheets</li>
        </ul>`,
            18: `<p>Оптимизация кода:</p>
        <ul>
            <li>Векторизация вместо циклов</li>
            <li>Используйте структуры данных: множества для поиска</li>
            <li>Кэшируйте результаты тяжелых вычислений</li>
        </ul>

        <p>Профилирование:</p>
        <pre><code>import cProfile

def slow_function():
    # ... code ...

cProfile.run('slow_function()')</code></pre>

        <p>Пример оптимизации:</p>
        <pre><code># Медленно
result = []
for x in data:
    result.append(x*2)

# Быстро
result = [x*2 for x in data]</code></pre>`,
            19: `<p>Работа с большими данными через Dask:</p>
        <ul>
            <li>Параллельные вычисления</li>
            <li>Ленивые вычисления</li>
            <li>Интеграция с pandas API</li>
        </ul>

        <pre><code>import dask.dataframe as dd

df = dd.read_csv('large_dataset/*.csv')
result = df.groupby('category').value.mean().compute()</code></pre>

        <p>Советы:</p>
        <ul>
            <li>Используйте разделение на партиции</li>
            <li>Оптимизируйте размер блоков</li>
            <li>Работайте в кластере для больших данных</li>
        </ul>`,
            20: `<p>Дашборды в Dash:</p>
        <ul>
            <li>Интерактивные компоненты</li>
            <li>Callback-функции для реактивности</li>
            <li>Декорирование через @app.callback</li>
        </ul>

        <pre><code>from dash import Dash, dcc, html

app = Dash(__name__)

app.layout = html.Div([
    dcc.Graph(id='live-graph'),
    dcc.Interval(id='interval', interval=1000)
])</code></pre>

        <p>Этапы деплоя:</p>
        <ol>
            <li>Тестирование локально</li>
            <li>Упаковка в Docker-контейнер</li>
            <li>Развертывание на Heroku/AWS</li>
        </ol>`},
        4: {
            1: `<p>Транзакция - это последовательность операций, выполняемая как единое целое.</p>
                <p>Свойства транзакций (ACID):</p>
                <ul>
                    <li>Atomicity (Атомарность) - все или ничего</li>
                    <li>Consistency (Согласованность) - данные остаются в валидном состоянии</li>
                    <li>Isolation (Изолированность) - транзакции не мешают друг другу</li>
                    <li>Durability (Долговечность) - результаты сохраняются после завершения</li>
                </ul>
                <p>Пример:</p>
                <pre><code>BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;</code></pre>`,
            2: `<p>Уровни изоляции определяют, как транзакции взаимодействуют друг с другом:</p>
                <ul>
                    <li>READ UNCOMMITTED - "грязное" чтение</li>
                    <li>READ COMMITTED - чтение только подтвержденных данных</li>
                    <li>REPEATABLE READ - гарантирует повторяемость чтения</li>
                    <li>SERIALIZABLE - полная изоляция</li>
                </ul>
                <p>Проблемы параллельных транзакций:</p>
                <ul>
                    <li>Грязное чтение (Dirty read)</li>
                    <li>Неповторяющееся чтение (Non-repeatable read)</li>
                    <li>Фантомное чтение (Phantom read)</li>
                </ul>`,
            3: `<p>Обработка ошибок в транзакциях:</p>
                <p>Используйте ROLLBACK для отмены изменений при ошибке:</p>
                <pre><code>BEGIN;
BEGIN TRY
    UPDATE accounts SET balance = balance - 100 WHERE id = 1;
    UPDATE accounts SET balance = balance + 100 WHERE id = 2;
    COMMIT;
END TRY
BEGIN CATCH
    ROLLBACK;
    -- обработка ошибки
END CATCH</code></pre>
                <p>Точки сохранения (SAVEPOINT):</p>
                <pre><code>BEGIN;
SAVEPOINT sp1;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
-- если что-то пошло не так
ROLLBACK TO sp1;
COMMIT;</code></pre>`,
            4: `<h2>Гео-аналитика в SQL</h2>
        <p>Современные СУБД поддерживают работу с геопространственными данными через специальные типы и функции.</p>
        
        <h3>Основные концепции:</h3>
        <ul>
            <li><strong>GEOMETRY</strong> - для плоских координат (местные системы координат)</li>
            <li><strong>GEOGRAPHY</strong> - для сферической поверхности Земли (WGS84)</li>
            <li>Функции измерения расстояния (ST_Distance)</li>
            <li>Пространственные индексы (GiST)</li>
        </ul>

        <h3>Практические примеры:</h3>
        <p>Создание таблицы с геоданными:</p>
        <pre><code>CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    coordinates GEOGRAPHY(Point)
);</code></pre>

        <p>Расчет расстояния между точками:</p>
        <pre><code>SELECT 
    a.name AS point_a,
    b.name AS point_b,
    ST_Distance(a.coordinates, b.coordinates) AS distance_meters
FROM locations a, locations b
WHERE a.id != b.id;</code></pre>

        <h3>Оптимизация геозапросов:</h3>
        <ul>
            <li>Используйте bounding box фильтры для ограничения поиска</li>
            <li>Применяйте пространственные индексы для больших наборов данных</li>
            <li>Кэшируйте часто запрашиваемые расчеты расстояний</li>
        </ul>

        <div class="case-study">
            <h4>Кейс: Поиск ближайших отделений банка</h4>
            <p>Решение с использованием пространственного индекса:</p>
            <pre><code>CREATE INDEX idx_geo_branches ON bank_branches USING GIST(coordinates);
                
SELECT 
    branch_name,
    ST_Distance(
        coordinates, 
        ST_GeogFromText('POINT(37.6173 55.7558)')
    ) AS distance
FROM bank_branches
ORDER BY coordinates <-> ST_GeogFromText('POINT(37.6173 55.7558)')
LIMIT 5;</code></pre>
        </div>`,
            5: `<h2>Машинное обучение средствами SQL</h2>
        <p>Современные СУБД интегрируют ML-функционал для базового прогнозного анализа.</p>
        
        <h3>Основные подходы:</h3>
        <ul>
            <li>Линейная регрессия для прогнозирования значений</li>
            <li>K-mean кластеризация для сегментации данных</li>
            <li>Деревья решений для классификации</li>
        </ul>

        <h3>Пример линейной регрессии:</h3>
        <pre><code>WITH regression AS (
    SELECT 
        REGR_SLOPE(sales, advertising) AS slope,
        REGR_INTERCEPT(sales, advertising) AS intercept
    FROM marketing_data
)
SELECT 
    (slope * 1000 + intercept) AS predicted_sales
FROM regression;</code></pre>

        <h3>Интеграция с Python:</h3>
        <p>Использование расширения PL/Python для сложных моделей:</p>
        <pre><code>CREATE FUNCTION predict_rental_demand(input JSON)
RETURNS FLOAT AS $$
    import pickle
    model = pickle.load(open('/models/rental_model.pkl', 'rb'))
    return model.predict([input['features']])[0]
$$ LANGUAGE plpython3u;</code></pre>

        <div class="warning">
            <p>⚠️ Важно: SQL не заменяет полноценные ML-фреймворки. Используйте для:</p>
            <ul>
                <li>Быстрого прототипирования</li>
                <li>Простых моделей на "горячих" данных</li>
                <li>Препроцессинга данных перед экспортом</li>
            </ul>
        </div>`,
            6: `<h2>Визуализация данных через SQL</h2>
        <p>SQL играет ключевую роль в подготовке данных для визуализации.</p>

        <h3>Этапы подготовки:</h3>
        <ol>
            <li>Агрегация данных до необходимого уровня детализации</li>
            <li>Формирование временных осей</li>
            <li>Нормализация значений для сравнения</li>
            <li>Создание иерархических структур</li>
        </ol>

        <h3>Пример для временного ряда:</h3>
        <pre><code>SELECT
    date_trunc('week', event_time) AS week,
    COUNT(*) AS events,
    AVG(duration) AS avg_duration
FROM user_activity
GROUP BY ROLLUP(week)
ORDER BY week;</code></pre>

        <h3>Экспорт в BI-инструменты:</h3>
        <ul>
            <li>Используйте материализованные представления для тяжелых запросов</li>
            <li>Настройте периодический экспорт через планировщик заданий</li>
            <li>Применяйте форматирование данных на стороне SQL</li>
        </ul>

        <div class="pro-tip">
            <h4>Совет профессионала:</h4>
            <p>Для сложных дашбордов используйте CTE (Common Table Expressions):</p>
            <pre><code>WITH 
sales_data AS (...),
inventory_data AS (...)
SELECT 
    s.product_id,
    s.total_sales,
    i.stock_level
FROM sales_data s
JOIN inventory_data i USING (product_id);</code></pre>
        </div>`,
            7: `<h2>Создание аналитического дашборда</h2>
        <p>Практический пример построения полного решения</p>

        <h3>Шаги реализации:</h3>
        <ol>
            <li>Сбор требований от бизнес-пользователей</li>
            <li>Проектирование структуры данных</li>
            <li>Оптимизация запросов для визуализации</li>
            <li>Настройка автоматического обновления</li>
        </ol>

        <h3>Полный пример реализации:</h3>
        <pre><code>-- Шаг 1: Создание материализованного представления
CREATE MATERIALIZED VIEW dashboard_data AS
SELECT
    c.company_name,
    SUM(s.amount) AS total_sales,
    COUNT(DISTINCT s.order_id) AS orders_count,
    AVG(s.unit_price) AS avg_price
FROM sales s
JOIN companies c USING (company_id)
WHERE s.sale_date BETWEEN NOW() - INTERVAL '1 YEAR' AND NOW()
GROUP BY c.company_name;

-- Шаг 2: Создание индексов
CREATE INDEX idx_dashboard_company ON dashboard_data (company_name);

-- Шаг 3: Настройка расписания обновления
CREATE REFRESH PROCEDURE refresh_dashboard()
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_data;
END;

-- Шаг 4: Экспорт в JSON для фронтенда
COPY (
    SELECT json_agg(row_to_json(dashboard_data))
    FROM dashboard_data
) TO '/var/www/dashboard/data.json';</code></pre>

        <h3>Оптимизация производительности:</h3>
        <ul>
            <li>Используйте секционирование для больших таблиц</li>
            <li>Настройте кэширование частых запросов</li>
            <li>Применяйте оконные функции для комплексных метрик</li>
        </ul>

        <div class="case-study">
            <h4>Реальный кейс:</h4>
            <p>Дашборд для ритейл-сети сократил время формирования отчетов с 2 часов до 15 минут за счет:</p>
            <ul>
                <li>Предварительной агрегации данных</li>
                <li>Использования колоночных индексов</li>
                <li>Оптимизации временных окон выборки</li>
            </ul>
        </div>`
        },
        5: {
            1: `<h2>Архитектура гибридных систем: Лучшее из двух миров</h2>
        <p>Современные системы часто комбинируют реляционные и NoSQL базы для достижения максимальной эффективности.</p>

        <h3>Типовые сценарии использования:</h3>
        <ul>
            <li>Основные данные в SQL + Кэш в Redis</li>
            <li>Транзакции в PostgreSQL + Логи в MongoDB</li>
            <li>Структурированные данные в MySQL + JSON-документы в Couchbase</li>
        </ul>

        <div class="architecture-diagram">
            <h4>Схема взаимодействия:</h4>
            <pre>
            [Приложение] 
                ├── SQL (Транзакции, ACID) → PostgreSQL
                ├── NoSQL (Логи, аналитика) → MongoDB
                └── Кэш → Redis
            </pre>
        </div>

        <h3>Ключевые принципы проектирования:</h3>
        <ul>
            <li><strong>Разделение ответственности:</strong> Каждая БД решает свою задачу</li>
            <li><strong>Синхронизация данных:</strong> Репликация vs API-шлюзы</li>
            <li><strong>Консистентность:</strong> Модель eventual consistency</li>
        </ul>

        <div class="case-study">
            <h4>Реальный пример: E-commerce платформа</h4>
            <p>Использование:</p>
            <ul>
                <li>PostgreSQL: Заказы, пользователи, платежи</li>
                <li>MongoDB: История просмотров, поведенческая аналитика</li>
                <li>Redis: Сессии, корзины покупок</li>
            </ul>
            <p>Синхронизация через Change Data Capture (Debezium)</p>
        </div>`,
            2: `<h2>Работа с JSON в SQL: Мост между мирами</h2>
        <p>Современные SQL-СУБД поддерживают нативные JSON-типы и функции</p>

        <h3>Основные возможности:</h3>
        <ul>
            <li>Хранение JSON-документов</li>
            <li>Индексация по полям JSON</li>
            <li>Партицирование JSON-данных</li>
        </ul>

        <h3>Пример работы в PostgreSQL:</h3>
        <pre><code>CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    details JSONB,
    created_at TIMESTAMP
);

INSERT INTO products (details) VALUES (
    '{"name": "Phone", "specs": {"ram": 8, "storage": 256}}'
);</code></pre>

        <h3>Запросы к JSON-полям:</h3>
        <pre><code>SELECT 
    details->>'name' AS product_name,
    details->'specs'->>'ram' AS ram_size
FROM products
WHERE details @> '{"specs": {"storage": 256}}';</code></pre>

        <div class="pro-tip">
            <h4>Советы по оптимизации:</h4>
            <ul>
                <li>Используйте JSONB вместо JSON для бинарного хранения</li>
                <li>Создавайте GIN-индексы для частых поисков</li>
                <li>Нормализуйте часто запрашиваемые поля</li>
            </ul>
        </div>

        <h3>Сравнение с MongoDB:</h3>
        <table>
            <tr><th>Операция</th><th>PostgreSQL</th><th>MongoDB</th></tr>
            <tr><td>Вложенные запросы</td><td>details->'specs'->>'ram'</td><td>db.products.find({"specs.ram": 8})</td></tr>
            <tr><td>Индексация</td><td>CREATE INDEX idx_gin ON products USING GIN(details)</td><td>db.products.createIndex({"specs.ram": 1})</td></tr>
        </table>`,
            3: `<h2>Интеграция с MongoDB: Практическое руководство</h2>
        <p>Способы интеграции SQL и MongoDB:</p>

        <h3>1. Использование Foreign Data Wrapper (FDW)</h3>
        <pre><code>CREATE EXTENSION mongo_fdw;

CREATE SERVER mongo_server 
FOREIGN DATA WRAPPER mongo_fdw 
OPTIONS (address 'mongodb://localhost:27017');

CREATE USER MAPPING FOR postgres
SERVER mongo_server 
OPTIONS (username 'admin', password 'secret');

CREATE FOREIGN TABLE mongo_logs (
    _id NAME,
    data JSONB
) SERVER mongo_server 
OPTIONS (database 'logs', collection 'server_logs');</code></pre>

        <h3>2. Репликация через триггеры</h3>
        <pre><code>CREATE FUNCTION sync_to_mongo() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO mongo_logs (data)
    VALUES (row_to_json(NEW));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;</code></pre>

        <h3>3. Использование драйверов</h3>
        <pre><code>const { MongoClient } = require('mongodb');
const pool = require('./postgres-pool');

async function syncData() {
    const pgData = await pool.query('SELECT * FROM orders');
    const mongoClient = new MongoClient('mongodb://localhost:27017');
    await mongoClient.db('analytics').collection('orders').insertMany(pgData.rows);
}</code></pre>

        <div class="warning">
            <h4>Важные нюансы:</h4>
            <ul>
                <li>Транзакционность: MongoDB vs PostgreSQL ACID</li>
                <li>Конфликты схемы данных</li>
                <li>Различия в типах данных</li>
            </ul>
        </div>

        <h3>Паттерны обработки ошибок:</h3>
        <ul>
            <li>Retry-логика для сетевых сбоев</li>
            <li>Dead Letter Queues для неудачных синхронизаций</li>
            <li>Версионирование схем данных</li>
        </ul>`,
            4: `<h2>Графовые базы данных: Социальные связи в действии</h2>
        <p>Графовые БД идеальны для работы со связанными данными. Примеры использования:</p>
        <ul>
            <li>Социальные сети (друзья друзей)</li>
            <li>Рекомендательные системы</li>
            <li>Обнаружение мошенничества</li>
        </ul>

        <h3>Cypher vs SQL: Сравнение синтаксиса</h3>
        <div class="code-compare">
            <div class="cypher">
                <p>Neo4j (Cypher):</p>
                <pre><code>MATCH (u:User)-[:FRIEND]->(fof)
WHERE u.name = 'Alice'
RETURN fof.name</code></pre>
            </div>
            <div class="sql">
                <p>PostgreSQL (с расширением AGE):</p>
                <pre><code>SELECT fof.name 
FROM users u
JOIN friends f ON u.id = f.user_id
JOIN users fof ON f.friend_id = fof.id
WHERE u.name = 'Alice';</code></pre>
            </div>
        </div>

        <h3>Практический пример: Поиск кратчайшего пути</h3>
        <pre><code>MATCH path = shortestPath(
    (a:User {name: 'Alice'})-[*]-(b:User {name: 'Bob'})
)
RETURN nodes(path), length(path)</code></pre>

        <div class="pro-tip">
            <h4>Совет по оптимизации:</h4>
            <p>Используйте индексы для свойств узлов и ограничивайте глубину обхода:</p>
            <pre><code>CREATE INDEX ON :User(name);
MATCH (u:User {name: 'Alice'})-[*1..3]->(connected)
RETURN connected</code></pre>
        </div>`,
            5: `<h2>Временные базы данных: Храним историю изменений</h2>
        <p>Технологии временных БД позволяют:</p>
        <ul>
            <li>Отслеживать изменения данных во времени</li>
            <li>Делать временные срезы (time travel)</li>
            <li>Анализировать исторические тенденции</li>
        </ul>

        <h3>Создание временной таблицы</h3>
        <pre><code>CREATE TABLE employee_history (
    id INT,
    salary NUMERIC,
    valid_from TIMESTAMP,
    valid_to TIMESTAMP
) WITH (VACUUM = 'enabled');</code></pre>

        <h3>Временные запросы</h3>
        <p>Получение данных на определенную дату:</p>
        <pre><code>SELECT * 
FROM employee_history 
WHERE valid_from <= '2023-01-15' 
  AND valid_to > '2023-01-15';</code></pre>

        <div class="case-study">
            <h4>Кейс: Аудит изменений</h4>
            <p>Триггер для автоматического сохранения истории:</p>
            <pre><code>CREATE FUNCTION log_salary_change() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO employee_history
    VALUES (OLD.id, OLD.salary, OLD.valid_from, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER salary_audit
BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION log_salary_change();</code></pre>
        </div>

        <h3>Временные оконные функции</h3>
        <pre><code>SELECT 
    employee_id,
    salary,
    LAG(salary) OVER (ORDER BY valid_from) AS prev_salary,
    LEAD(salary) OVER (ORDER BY valid_from) AS next_salary
FROM employee_history;</code></pre>`,
            6: `<h2>Гибридное решение: SQL + MongoDB</h2>
        <p>Архитектура:</p>
        <ol>
            <li>PostgreSQL для транзакционных данных</li>
            <li>MongoDB для документного хранения</li>
            <li>Redis для кэширования</li>
        </ol>

        <h3>Синхронизация данных</h3>
        <pre><code>-- PostgreSQL триггер
CREATE FUNCTION sync_to_mongo()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM http_post(
        'mongodb-api/update',
        json_build_object(
            'id', NEW.id,
            'data', row_to_json(NEW)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;</code></pre>

        <h3>Пример совместного запроса</h3>
        <pre><code>WITH sql_data AS (
    SELECT id, name FROM users WHERE created_at > '2023-01-01'
),
mongo_data AS (
    SELECT 
        jsonb_array_elements(mongo_query(
            '{"find": "user_activity"}'
        ))->>'user_id' AS user_id,
        jsonb_array_elements(mongo_query(
            '{"find": "user_activity"}'
        ))->>'last_login' AS last_login
)
SELECT 
    s.name,
    m.last_login
FROM sql_data s
JOIN mongo_data m ON s.id = m.user_id::INT;</code></pre>

        <div class="architecture">
            <h4>Архитектурные паттерны:</h4>
            <ul>
                <li><strong>CQRS:</strong> Отдельные модели для чтения/записи</li>
                <li><strong>Event Sourcing:</strong> Хранение событий изменений</li>
                <li><strong>Materialized Views:</strong> Преагрегированные данные</li>
            </ul>
        </div>

        <h3>Оптимизация производительности</h3>
        <ul>
            <li>Используйте Change Data Capture (CDC) для синхронизации</li>
            <li>Настройте TTL индексы в MongoDB</li>
            <li>Применяйте репликацию для горячих данных</li>
        </ul>`,
            7:`<h2>Кеширование с Redis и Memcached: Ускоряем работу приложений</h2>
<p>Кеширование - ключевой элемент оптимизации производительности в гибридных системах баз данных.</p>

<h3>Стратегии кеширования:</h3>
<ul>
<li><strong>Cache-Aside:</strong> Приложение управляет кешем</li>
<li><strong>Write-Through:</strong> Запись одновременно в кеш и БД</li>
<li><strong>Write-Behind:</strong> Отложенная запись в БД</li>
<li><strong>Read-Through:</strong> Кеш сам загружает данные</li>
</ul>

<div class="redis-example">
<h4>Настройка Redis для кеширования SQL-запросов:</h4>
<pre><code>const redis = require('redis');
const client = redis.createClient({
  host: 'localhost',
  port: 6379,
  db: 0
});

// Кеширование результатов запроса
async function getCachedQuery(query, params) {
  const cacheKey = \`query:\${Buffer.from(query + JSON.stringify(params)).toString('base64')}\`;
  
  let result = await client.get(cacheKey);
  if (result) {
    return JSON.parse(result);
  }
  
  // Выполняем запрос к БД
  result = await executeQuery(query, params);
  
  // Сохраняем в кеш на 10 минут
  await client.setex(cacheKey, 600, JSON.stringify(result));
  return result;
}</code></pre>
</div>

<h3>Паттерн Cache-Aside с PostgreSQL:</h3>
<pre><code>class DatabaseCache {
  constructor(redisClient, pgPool) {
    this.redis = redisClient;
    this.pg = pgPool;
  }
  
  async getUser(userId) {
    const cacheKey = \`user:\${userId}\`;
    
    // Проверяем кеш
    let user = await this.redis.hgetall(cacheKey);
    if (Object.keys(user).length > 0) {
      return user;
    }
    
    // Загружаем из БД
    const result = await this.pg.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length > 0) {
      user = result.rows[0];
      // Сохраняем в кеш
      await this.redis.hmset(cacheKey, user);
      await this.redis.expire(cacheKey, 3600);
    }
    
    return user;
  }
}</code></pre>

<div class="comparison">
<h4>Redis vs Memcached:</h4>
<table>
<tr><th>Критерий</th><th>Redis</th><th>Memcached</th></tr>
<tr><td>Типы данных</td><td>Строки, хеши, списки, множества</td><td>Только строки</td></tr>
<tr><td>Персистентность</td><td>Да (RDB/AOF)</td><td>Нет</td></tr>
<tr><td>Репликация</td><td>Master-Slave</td><td>Нет встроенной</td></tr>
<tr><td>Производительность</td><td>Высокая</td><td>Немного выше</td></tr>
</table>
</div>

<div class="pro-tip">
<h4>Оптимизация кеширования:</h4>
<ul>
<li>Используйте пайплайнинг для множественных операций</li>
<li>Настраивайте TTL в зависимости от типа данных</li>
<li>Мониторьте hit ratio кеша</li>
<li>Реализуйте graceful degradation при недоступности кеша</li>
</ul>
</div>

<h3>Инвалидация кеша:</h3>
<pre><code>// Автоматическая инвалидация через триггеры PostgreSQL
const invalidateCache = \`
CREATE OR REPLACE FUNCTION invalidate_user_cache()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM http_post(
    'http://cache-service/invalidate',
    json_build_object('key', 'user:' || NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_cache_invalidation
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_user_cache();
\`;</code></pre>`,
            8: `<h2>Полнотекстовый поиск с Elasticsearch: Мощный поиск в гибридных системах</h2>
<p>Elasticsearch позволяет реализовать быстрый и гибкий поиск по большим объемам текстовых данных.</p>

<h3>Архитектура интеграции:</h3>
<ul>
<li>PostgreSQL: Основные данные и метаинформация</li>
<li>Elasticsearch: Индексированный текстовый контент</li>
<li>Logstash: ETL для синхронизации данных</li>
<li>Kibana: Аналитика и мониторинг</li>
</ul>

<div class="elasticsearch-setup">
<h4>Создание индекса для поиска:</h4>
<pre><code>const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });

// Создание индекса с маппингом
async function createSearchIndex() {
  await client.indices.create({
    index: 'documents',
    body: {
      mappings: {
        properties: {
          title: {
            type: 'text',
            analyzer: 'russian',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          content: {
            type: 'text',
            analyzer: 'russian'
          },
          tags: { type: 'keyword' },
          created_at: { type: 'date' },
          author_id: { type: 'integer' }
        }
      },
      settings: {
        analysis: {
          analyzer: {
            russian: {
              tokenizer: 'standard',
              filter: ['lowercase', 'russian_morphology']
            }
          }
        }
      }
    }
  });
}</code></pre>
</div>

<h3>Синхронизация данных из PostgreSQL:</h3>
<pre><code>class ElasticsearchSync {
  constructor(esClient, pgPool) {
    this.es = esClient;
    this.pg = pgPool;
  }
  
  async syncDocument(documentId) {
    // Получаем данные из PostgreSQL
    const result = await this.pg.query(\`
      SELECT d.*, u.name as author_name 
      FROM documents d 
      JOIN users u ON d.author_id = u.id 
      WHERE d.id = $1
    \`, [documentId]);
    
    if (result.rows.length === 0) return;
    
    const doc = result.rows[0];
    
    // Индексируем в Elasticsearch
    await this.es.index({
      index: 'documents',
      id: documentId,
      body: {
        title: doc.title,
        content: doc.content,
        tags: doc.tags,
        author_id: doc.author_id,
        author_name: doc.author_name,
        created_at: doc.created_at
      }
    });
  }
  
  async search(query, filters = {}) {
    const searchBody = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: query,
                fields: ['title^2', 'content'],
                type: 'best_fields',
                fuzziness: 'AUTO'
              }
            }
          ],
          filter: []
        }
      },
      highlight: {
        fields: {
          title: {},
          content: { fragment_size: 150, number_of_fragments: 3 }
        }
      },
      sort: [
        { _score: { order: 'desc' } },
        { created_at: { order: 'desc' } }
      ]
    };
    
    // Добавляем фильтры
    if (filters.author_id) {
      searchBody.query.bool.filter.push({
        term: { author_id: filters.author_id }
      });
    }
    
    if (filters.tags) {
      searchBody.query.bool.filter.push({
        terms: { tags: filters.tags }
      });
    }
    
    const response = await this.es.search({
      index: 'documents',
      body: searchBody
    });
    
    return response.body.hits;
  }
}</code></pre>

<div class="advanced-search">
<h4>Продвинутые возможности поиска:</h4>
<pre><code>// Поиск с автодополнением
async function suggestSearch(prefix) {
  const response = await client.search({
    index: 'documents',
    body: {
      suggest: {
        title_suggest: {
          prefix: prefix,
          completion: {
            field: 'title.suggest',
            size: 5
          }
        }
      }
    }
  });
  
  return response.body.suggest.title_suggest[0].options;
}

// Агрегации для фасетного поиска
async function getFacets(query) {
  const response = await client.search({
    index: 'documents',
    body: {
      query: { match: { content: query } },
      aggs: {
        by_author: {
          terms: { field: 'author_id', size: 10 }
        },
        by_tags: {
          terms: { field: 'tags', size: 20 }
        },
        by_date: {
          date_histogram: {
            field: 'created_at',
            calendar_interval: 'month'
          }
        }
      }
    }
  });
  
  return response.body.aggregations;
}</code></pre>
</div>

<div class="pro-tip">
<h4>Оптимизация производительности:</h4>
<ul>
<li>Используйте bulk API для массовой индексации</li>
<li>Настройте refresh_interval для снижения нагрузки</li>
<li>Применяйте search templates для повторяющихся запросов</li>
<li>Используйте routing для распределения по шардам</li>
</ul>
</div>

<h3>Мониторинг и отладка:</h3>
<pre><code>// Профилирование поисковых запросов
async function profileSearch(query) {
  const response = await client.search({
    index: 'documents',
    body: {
      profile: true,
      query: { match: { content: query } }
    }
  });
  
  console.log('Query profile:', response.body.profile);
  return response.body.hits;
}</code></pre>`,
            9:`<h2>Миграция данных между SQL и NoSQL: Стратегии переноса</h2>
<p>Миграция данных между различными типами баз данных требует продуманного подхода и учета особенностей каждой системы.</p>

<h3>Основные стратегии миграции:</h3>
<ul>
<li><strong>Big Bang:</strong> Полная миграция за один раз</li>
<li><strong>Strangler Fig:</strong> Постепенная замена компонентов</li>
<li><strong>Database-per-Service:</strong> Микросервисный подход</li>
<li><strong>Dual Write:</strong> Параллельная запись в обе БД</li>
</ul>

<h3>Инструменты миграции:</h3>
<pre><code>// Пример миграции PostgreSQL -> MongoDB
class DataMigrator {
  constructor(pgConfig, mongoConfig) {
    this.pgPool = new Pool(pgConfig);
    this.mongoClient = new MongoClient(mongoConfig.url);
    this.batchSize = 1000;
  }
  
  async migrateTable(tableName, collectionName) {
    let offset = 0;
    let hasMore = true;
    
    const mongoDB = this.mongoClient.db('migrated_data');
    
    while (hasMore) {
      const result = await this.pgPool.query(
        'SELECT * FROM $1 LIMIT $2 OFFSET $3',
        [tableName, this.batchSize, offset]
      );
      
      if (result.rows.length === 0) {
        hasMore = false;
        break;
      }
      
      // Трансформация данных
      const documents = result.rows.map(row => ({
        _id: row.id,
        ...this.transformRow(row),
        migrated_at: new Date()
      }));
      
      await mongoDB.collection(collectionName).insertMany(documents);
      offset += this.batchSize;
      
      console.log('Processed:', offset, 'records from', tableName);
    }
  }
  
  transformRow(row) {
    // Логика трансформации данных
    const transformed = { ...row };
    
    // Преобразование дат
    if (row.created_at) {
      transformed.created_at = new Date(row.created_at);
    }
    
    // Нормализация JSON полей
    if (row.metadata && typeof row.metadata === 'string') {
      transformed.metadata = JSON.parse(row.metadata);
    }
    
    return transformed;
  }
}</code></pre>

<div class="migration-checklist">
<h4>Чек-лист миграции:</h4>
<ul>
<li>Анализ схемы исходных данных</li>
<li>Проектирование целевой структуры</li>
<li>Создание mapping правил</li>
<li>Тестирование на подмножестве данных</li>
<li>Валидация результатов</li>
<li>Rollback план</li>
</ul>
</div>

<h3>Обработка конфликтов данных:</h3>
<pre><code>// Стратегии разрешения конфликтов
const conflictResolver = {
  // Последняя запись побеждает
  lastWriteWins: (existing, incoming) => {
    return incoming.updated_at > existing.updated_at ? incoming : existing;
  },
  
  // Слияние объектов
  merge: (existing, incoming) => {
    return { ...existing, ...incoming, conflicts: [] };
  },
  
  // Ручное разрешение
  manual: (existing, incoming) => {
    return {
      ...existing,
      conflicts: [{ data: incoming, timestamp: new Date() }]
    };
  }
};</code></pre>

<h3>Мониторинг процесса миграции:</h3>
<table>
<tr><th>Метрика</th><th>Описание</th><th>Критическое значение</th></tr>
<tr><td>Throughput</td><td>Записей в секунду</td><td>&lt; 100 rps</td></tr>
<tr><td>Error Rate</td><td>Процент ошибочных записей</td><td>&gt; 1%</td></tr>
<tr><td>Data Integrity</td><td>Целостность данных</td><td>100%</td></tr>
</table>`,
            10:`<h2>Репликация и синхронизация данных: Поддержание консистентности</h2>
<p>Синхронизация данных между различными базами данных - критически важный аспект гибридных систем.</p>

<h3>Типы репликации:</h3>
<ul>
<li><strong>Master-Slave:</strong> Односторонняя репликация</li>
<li><strong>Master-Master:</strong> Двусторонняя репликация</li>
<li><strong>Event-driven:</strong> Асинхронная через события</li>
<li><strong>CDC (Change Data Capture):</strong> Отслеживание изменений</li>
</ul>

<h3>Реализация Change Data Capture:</h3>
<pre><code>// CDC с использованием PostgreSQL логических репликаций
class CDCHandler {
  constructor(pgConfig, targets) {
    this.pgClient = new Client(pgConfig);
    this.targets = targets; // MongoDB, Redis, etc.
    this.replicationSlot = 'hybrid_cdc_slot';
  }
  
  async setupLogicalReplication() {
    await this.pgClient.query(
      'SELECT pg_create_logical_replication_slot($1, $2)',
      [this.replicationSlot, 'pgoutput']
    );
  }
  
  async startCDC() {
    const stream = this.pgClient.query(
      'SELECT * FROM pg_logical_slot_get_changes($1, NULL, NULL)',
      [this.replicationSlot]
    );
    
    stream.on('row', async (row) => {
      const change = this.parseWALData(row.data);
      await this.propagateChange(change);
    });
  }
  
  parseWALData(walData) {
    // Парсинг WAL записей
    const parsed = JSON.parse(walData);
    return {
      operation: parsed.action, // INSERT, UPDATE, DELETE
      table: parsed.table,
      data: parsed.columns,
      timestamp: new Date()
    };
  }
  
  async propagateChange(change) {
    const promises = this.targets.map(async (target) => {
      switch (target.type) {
        case 'mongodb':
          return this.syncToMongo(target, change);
        case 'redis':
          return this.syncToRedis(target, change);
        case 'elasticsearch':
          return this.syncToES(target, change);
      }
    });
    
    await Promise.allSettled(promises);
  }
  
  async syncToMongo(target, change) {
    const collection = target.db.collection(change.table);
    
    switch (change.operation) {
      case 'INSERT':
        await collection.insertOne(change.data);
        break;
      case 'UPDATE':
        await collection.updateOne(
          { _id: change.data.id },
          { $set: change.data }
        );
        break;
      case 'DELETE':
        await collection.deleteOne({ _id: change.data.id });
        break;
    }
  }
}</code></pre>

<div class="sync-patterns">
<h4>Паттерны синхронизации:</h4>
<ul>
<li><strong>Saga Pattern:</strong> Распределенные транзакции</li>
<li><strong>Outbox Pattern:</strong> Гарантированная доставка событий</li>
<li><strong>CQRS:</strong> Разделение команд и запросов</li>
</ul>
</div>

<h3>Реализация Outbox Pattern:</h3>
<pre><code>// Outbox таблица для гарантированной доставки
class OutboxHandler {
  constructor(pgPool, eventBus) {
    this.pgPool = pgPool;
    this.eventBus = eventBus;
  }
  
  async createOutboxTable() {
    await this.pgPool.query(\`
      CREATE TABLE IF NOT EXISTS outbox (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP NULL
      )
    \`);
  }
  
  async publishEvent(eventType, payload) {
    const client = await this.pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Основная бизнес-операция
      await this.executeBusinessLogic(client, payload);
      
      // Сохранение события в outbox
      await client.query(
        'INSERT INTO outbox (event_type, payload) VALUES ($1, $2)',
        [eventType, payload]
      );
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async processOutboxEvents() {
    const events = await this.pgPool.query(\`
      SELECT * FROM outbox 
      WHERE processed_at IS NULL 
      ORDER BY created_at 
      LIMIT 100
    \`);
    
    for (const event of events.rows) {
      try {
        await this.eventBus.publish(event.event_type, event.payload);
        
        await this.pgPool.query(
          'UPDATE outbox SET processed_at = NOW() WHERE id = $1',
          [event.id]
        );
      } catch (error) {
        console.error('Failed to process event:', event.id, error);
      }
    }
  }
}</code></pre>

<h3>Мониторинг синхронизации:</h3>
<table>
<tr><th>Показатель</th><th>PostgreSQL</th><th>MongoDB</th><th>Redis</th></tr>
<tr><td>Lag</td><td>pg_stat_replication</td><td>rs.status()</td><td>INFO replication</td></tr>
<tr><td>Conflicts</td><td>pg_stat_database_conflicts</td><td>db.serverStatus()</td><td>LASTSAVE</td></tr>
</table>`,
            11 :`<h2>Оптимизация производительности гибридных систем</h2>
<p>Максимизация производительности требует понимания особенностей каждой базы данных и правильного распределения нагрузки.</p>

<h3>Стратегии оптимизации:</h3>
<ul>
<li><strong>Партицирование данных:</strong> Горизонтальное и вертикальное</li>
<li><strong>Кэширование:</strong> Многоуровневые стратегии</li>
<li><strong>Индексация:</strong> Оптимальные индексы для каждой БД</li>
<li><strong>Connection Pooling:</strong> Управление соединениями</li>
</ul>

<h3>Система мониторинга производительности:</h3>
<pre><code>// Комплексный мониторинг производительности
class PerformanceMonitor {
  constructor(databases) {
    this.databases = databases;
    this.metrics = new Map();
    this.thresholds = {
      responseTime: 100, // ms
      errorRate: 0.01,   // 1%
      throughput: 1000   // ops/sec
    };
  }
  
  async collectMetrics() {
    const allMetrics = {};
    
    for (const [name, db] of Object.entries(this.databases)) {
      allMetrics[name] = await this.getDBMetrics(db);
    }
    
    return allMetrics;
  }
  
  async getDBMetrics(db) {
    const startTime = Date.now();
    
    try {
      // Универсальный healthcheck
      const result = await this.executeHealthCheck(db);
      const responseTime = Date.now() - startTime;
      
      return {
        responseTime,
        isHealthy: true,
        connectionCount: await this.getConnectionCount(db),
        activeQueries: await this.getActiveQueries(db),
        cacheHitRate: await this.getCacheHitRate(db)
      };
    } catch (error) {
      return {
        responseTime: Date.now() - startTime,
        isHealthy: false,
        error: error.message
      };
    }
  }
  
  async optimizeQueries() {
    // Анализ медленных запросов
    const slowQueries = await this.identifySlowQueries();
    
    for (const query of slowQueries) {
      const suggestions = await this.generateOptimizationSuggestions(query);
      console.log('Query optimization suggestions:', suggestions);
    }
  }
  
  async generateOptimizationSuggestions(query) {
    const suggestions = [];
    
    // Анализ индексов
    if (query.database === 'postgresql') {
      const missingIndexes = await this.analyzeMissingIndexes(query);
      suggestions.push(...missingIndexes);
    }
    
    // Анализ кэширования
    if (query.frequency > 100) {
      suggestions.push({
        type: 'caching',
        recommendation: 'Consider caching this frequent query'
      });
    }
    
    return suggestions;
  }
}</code></pre>`,},
        6: {
            1: `<h2>Агрегация данных: Основа аналитических вычислений</h2>
    <p>Агрегация данных - это процесс группировки и суммирования информации для получения аналитических выводов. Рассмотрим продвинутые техники агрегации.</p>

    <h3>Базовые агрегатные функции:</h3>
    <div class="code-example">
        <pre><code>-- Основные агрегатные функции
SELECT 
    COUNT(*) as total_orders,
    SUM(amount) as total_revenue,
    AVG(amount) as avg_order_value,
    MIN(amount) as min_order,
    MAX(amount) as max_order,
    STDDEV(amount) as order_variance
FROM orders
WHERE order_date >= '2024-01-01';</code></pre>
    </div>

    <h3>Группировка с множественными измерениями:</h3>
    <div class="code-example">
        <pre><code>-- Анализ продаж по регионам и категориям
SELECT 
    region,
    category,
    COUNT(*) as orders_count,
    SUM(amount) as total_sales,
    AVG(amount) as avg_order_value,
    ROUND(SUM(amount) * 100.0 / 
          SUM(SUM(amount)) OVER(), 2) as sales_percentage
FROM sales s
JOIN products p ON s.product_id = p.id
JOIN customers c ON s.customer_id = c.id
GROUP BY region, category
ORDER BY total_sales DESC;</code></pre>
    </div>

    <h3>Условная агрегация:</h3>
    <div class="code-example">
        <pre><code>-- Анализ производительности с условиями
SELECT 
    product_category,
    SUM(CASE WHEN order_status = 'completed' THEN amount ELSE 0 END) as completed_sales,
    SUM(CASE WHEN order_status = 'cancelled' THEN amount ELSE 0 END) as cancelled_sales,
    COUNT(CASE WHEN amount > 1000 THEN 1 END) as high_value_orders,
    AVG(CASE WHEN customer_type = 'premium' THEN amount END) as avg_premium_order
FROM order_analytics
GROUP BY product_category;</code></pre>
    </div>

    <div class="practical-case">
        <h4>Практический случай: Анализ RFM-сегментации</h4>
        <pre><code>-- RFM анализ клиентов (Recency, Frequency, Monetary)
WITH customer_rfm AS (
    SELECT 
        customer_id,
        DATEDIFF(CURRENT_DATE, MAX(order_date)) as recency,
        COUNT(*) as frequency,
        SUM(amount) as monetary_value
    FROM orders
    WHERE order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 365 DAY)
    GROUP BY customer_id
)
SELECT 
    CASE 
        WHEN recency <= 30 THEN 'Active'
        WHEN recency <= 90 THEN 'Lapsing' 
        ELSE 'Churned'
    END as recency_segment,
    COUNT(*) as customers_count,
    AVG(frequency) as avg_frequency,
    AVG(monetary_value) as avg_monetary_value
FROM customer_rfm
GROUP BY recency_segment;</code></pre>
    </div>`,

            2: `<h2>Оконные функции: Продвинутая аналитика в SQL</h2>
    <p>Оконные функции позволяют выполнять вычисления над набором строк, связанных с текущей строкой, не группируя результат.</p>

    <h3>Основные типы оконных функций:</h3>
    <ul>
        <li><strong>Ранжирующие:</strong> ROW_NUMBER(), RANK(), DENSE_RANK()</li>
        <li><strong>Агрегатные:</strong> SUM(), AVG(), COUNT() с OVER()</li>
        <li><strong>Навигационные:</strong> LAG(), LEAD(), FIRST_VALUE(), LAST_VALUE()</li>
    </ul>

    <h3>Ранжирование и топ-листы:</h3>
    <div class="code-example">
        <pre><code>-- Топ продавцов по месяцам
SELECT 
    salesperson,
    month,
    sales_amount,
    ROW_NUMBER() OVER (PARTITION BY month ORDER BY sales_amount DESC) as rank_row,
    RANK() OVER (PARTITION BY month ORDER BY sales_amount DESC) as rank_with_ties,
    DENSE_RANK() OVER (PARTITION BY month ORDER BY sales_amount DESC) as dense_rank
FROM monthly_sales
WHERE rank_row <= 3;</code></pre>
    </div>

    <h3>Накопительные суммы и скользящие средние:</h3>
    <div class="code-example">
        <pre><code>-- Анализ роста продаж
SELECT 
    order_date,
    daily_sales,
    SUM(daily_sales) OVER (
        ORDER BY order_date 
        ROWS UNBOUNDED PRECEDING
    ) as cumulative_sales,
    AVG(daily_sales) OVER (
        ORDER BY order_date 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as moving_avg_7_days,
    LAG(daily_sales, 1) OVER (ORDER BY order_date) as previous_day_sales,
    LEAD(daily_sales, 1) OVER (ORDER BY order_date) as next_day_sales
FROM daily_sales_summary
ORDER BY order_date;</code></pre>
    </div>

    <h3>Процентили и квантили:</h3>
    <div class="code-example">
        <pre><code>-- Анализ распределения доходов клиентов
SELECT 
    customer_id,
    total_spent,
    NTILE(4) OVER (ORDER BY total_spent) as quartile,
    PERCENT_RANK() OVER (ORDER BY total_spent) as percentile_rank,
    CUME_DIST() OVER (ORDER BY total_spent) as cumulative_distribution,
    CASE 
        WHEN NTILE(10) OVER (ORDER BY total_spent) = 10 THEN 'Top 10%'
        WHEN NTILE(10) OVER (ORDER BY total_spent) >= 8 THEN 'Top 20%'
        ELSE 'Regular'
    END as customer_tier
FROM customer_lifetime_value;</code></pre>
    </div>

    <div class="advanced-example">
        <h4>Продвинутый пример: Анализ когорт</h4>
        <pre><code>-- Когортный анализ удержания клиентов
WITH first_purchase AS (
    SELECT 
        customer_id,
        MIN(order_date) as cohort_month
    FROM orders
    GROUP BY customer_id
),
monthly_activity AS (
    SELECT 
        fp.customer_id,
        fp.cohort_month,
        o.order_date,
        DATEDIFF(MONTH, fp.cohort_month, o.order_date) as period_number
    FROM first_purchase fp
    JOIN orders o ON fp.customer_id = o.customer_id
)
SELECT 
    cohort_month,
    COUNT(DISTINCT CASE WHEN period_number = 0 THEN customer_id END) as customers_month_0,
    COUNT(DISTINCT CASE WHEN period_number = 1 THEN customer_id END) as customers_month_1,
    COUNT(DISTINCT CASE WHEN period_number = 2 THEN customer_id END) as customers_month_2,
    ROUND(
        COUNT(DISTINCT CASE WHEN period_number = 1 THEN customer_id END) * 100.0 /
        COUNT(DISTINCT CASE WHEN period_number = 0 THEN customer_id END), 2
    ) as retention_month_1
FROM monthly_activity
GROUP BY cohort_month
ORDER BY cohort_month;</code></pre>
    </div>`,

            3: `<h2>Pivot-таблицы: Динамическое преобразование данных</h2>
    <p>Pivot-таблицы позволяют преобразовывать строки в столбцы для создания кросс-табуляций и сводных отчетов.</p>

    <h3>Создание Pivot с CASE WHEN:</h3>
    <div class="code-example">
        <pre><code>-- Анализ продаж по месяцам и категориям
SELECT 
    product_category,
    SUM(CASE WHEN MONTH(order_date) = 1 THEN amount ELSE 0 END) as jan_sales,
    SUM(CASE WHEN MONTH(order_date) = 2 THEN amount ELSE 0 END) as feb_sales,
    SUM(CASE WHEN MONTH(order_date) = 3 THEN amount ELSE 0 END) as mar_sales,
    SUM(CASE WHEN MONTH(order_date) = 4 THEN amount ELSE 0 END) as apr_sales,
    SUM(amount) as total_sales
FROM sales
WHERE YEAR(order_date) = 2024
GROUP BY product_category
ORDER BY total_sales DESC;</code></pre>
    </div>

    <h3>Динамический Pivot (MySQL 8.0+):</h3>
    <div class="code-example">
        <pre><code>-- Использование JSON для динамического pivot
SELECT 
    region,
    JSON_OBJECTAGG(
        month_name, 
        monthly_sales
    ) as sales_by_month
FROM (
    SELECT 
        region,
        MONTHNAME(order_date) as month_name,
        SUM(amount) as monthly_sales
    FROM regional_sales
    GROUP BY region, month_name
) pivot_data
GROUP BY region;</code></pre>
    </div>

    <h3>Многомерный Pivot-анализ:</h3>
    <div class="code-example">
        <pre><code>-- Анализ продаж по регионам, категориям и каналам
SELECT 
    region,
    -- Продажи по категориям
    SUM(CASE WHEN category = 'Electronics' THEN amount ELSE 0 END) as electronics_sales,
    SUM(CASE WHEN category = 'Clothing' THEN amount ELSE 0 END) as clothing_sales,
    SUM(CASE WHEN category = 'Books' THEN amount ELSE 0 END) as books_sales,
    -- Продажи по каналам
    SUM(CASE WHEN channel = 'Online' THEN amount ELSE 0 END) as online_sales,
    SUM(CASE WHEN channel = 'Store' THEN amount ELSE 0 END) as store_sales,
    -- Метрики эффективности
    COUNT(DISTINCT customer_id) as unique_customers,
    AVG(amount) as avg_order_value
FROM comprehensive_sales_view
GROUP BY region
ORDER BY SUM(amount) DESC;</code></pre>
    </div>

    <div class="advanced-pivot">
        <h4>Продвинутый Pivot: Временные ряды с агрегацией</h4>
        <pre><code>-- Еженедельный анализ продаж с трендами
WITH weekly_sales AS (
    SELECT 
        YEARWEEK(order_date) as week_number,
        WEEK(order_date) as week_of_year,
        product_category,
        SUM(amount) as weekly_amount
    FROM sales
    WHERE order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 12 WEEK)
    GROUP BY week_number, product_category
)
SELECT 
    week_of_year,
    SUM(CASE WHEN product_category = 'Electronics' THEN weekly_amount ELSE 0 END) as electronics,
    SUM(CASE WHEN product_category = 'Clothing' THEN weekly_amount ELSE 0 END) as clothing,
    SUM(CASE WHEN product_category = 'Home' THEN weekly_amount ELSE 0 END) as home,
    SUM(weekly_amount) as total_weekly_sales,
    -- Тренды
    LAG(SUM(weekly_amount)) OVER (ORDER BY week_of_year) as prev_week_total,
    ROUND(
        (SUM(weekly_amount) - LAG(SUM(weekly_amount)) OVER (ORDER BY week_of_year)) * 100.0 /
        LAG(SUM(weekly_amount)) OVER (ORDER BY week_of_year), 2
    ) as week_over_week_growth
FROM weekly_sales
GROUP BY week_of_year
ORDER BY week_of_year;</code></pre>
    </div>

    <div class="practical-tip">
        <h4>Оптимизация Pivot-запросов:</h4>
        <ul>
            <li>Используйте индексы на столбцы группировки</li>
            <li>Ограничивайте временные диапазоны</li>
            <li>Рассмотрите материализованные представления для часто используемых pivot</li>
        </ul>
    </div>`,
            4: `<h2>Геоаналитика: Пространственные данные в SQL</h2>
<p>Геоаналитика открывает мощные возможности для анализа данных с географической привязкой. От поиска ближайших объектов до анализа плотности и построения тепловых карт.</p>

<h3>Пространственные типы данных:</h3>
<div class="code-example">
    <pre><code>-- Создание таблицы с различными геотипами
CREATE TABLE locations (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    -- Точка (широта, долгота)
    point_location POINT,
    -- Многоугольник (зона покрытия)
    coverage_area POLYGON,
    -- Линия (маршрут)
    route_path LINESTRING,
    -- Коллекция геометрий
    complex_geometry GEOMETRYCOLLECTION
);

-- Добавление пространственного индекса
CREATE SPATIAL INDEX idx_point ON locations(point_location);
CREATE SPATIAL INDEX idx_area ON locations(coverage_area);</code></pre>
</div>

<h3>Расчет расстояний и близости:</h3>
<div class="code-example">
    <pre><code>-- Функция Haversine для точного расчета расстояний
DELIMITER //
CREATE FUNCTION HAVERSINE_DISTANCE(
    lat1 DECIMAL(10,8), lon1 DECIMAL(11,8),
    lat2 DECIMAL(10,8), lon2 DECIMAL(11,8)
) RETURNS DECIMAL(10,3)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE distance DECIMAL(10,3);
    SET distance = 6371 * ACOS(
        COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
        COS(RADIANS(lon2) - RADIANS(lon1)) +
        SIN(RADIANS(lat1)) * SIN(RADIANS(lat2))
    );
    RETURN distance;
END//
DELIMITER ;

-- Поиск ближайших ресторанов в радиусе 5 км
SELECT 
    r.name,
    r.cuisine_type,
    r.rating,
    ROUND(HAVERSINE_DISTANCE(40.7589, -73.9851, r.latitude, r.longitude), 2) as distance_km
FROM restaurants r
WHERE HAVERSINE_DISTANCE(40.7589, -73.9851, r.latitude, r.longitude) <= 5
ORDER BY distance_km
LIMIT 10;</code></pre>
</div>

<h3>Анализ плотности и кластеризация:</h3>
<div class="code-example">
    <pre><code>-- Анализ плотности точек продаж в grid-сетке
WITH grid_cells AS (
    SELECT 
        FLOOR(latitude * 100) / 100 as lat_grid,
        FLOOR(longitude * 100) / 100 as lng_grid
    FROM stores
),
density_analysis AS (
    SELECT 
        lat_grid,
        lng_grid,
        COUNT(*) as store_count,
        ROUND(AVG(daily_revenue), 2) as avg_revenue,
        CASE 
            WHEN COUNT(*) >= 10 THEN 'High Density'
            WHEN COUNT(*) >= 5 THEN 'Medium Density'
            ELSE 'Low Density'
        END as density_category
    FROM grid_cells g
    JOIN stores s ON 
        FLOOR(s.latitude * 100) / 100 = g.lat_grid AND
        FLOOR(s.longitude * 100) / 100 = g.lng_grid
    GROUP BY lat_grid, lng_grid
)
SELECT 
    CONCAT(lat_grid, ',', lng_grid) as grid_coordinate,
    store_count,
    avg_revenue,
    density_category,
    -- Рекомендация по размещению
    CASE 
        WHEN density_category = 'Low Density' AND avg_revenue > 1000 
        THEN 'Potential expansion area'
        WHEN density_category = 'High Density' AND avg_revenue < 500
        THEN 'Market saturation risk'
        ELSE 'Stable market'
    END as market_recommendation
FROM density_analysis
ORDER BY store_count DESC, avg_revenue DESC;</code></pre>
</div>

<h3>Геозоны и анализ покрытия:</h3>
<div class="code-example">
    <pre><code>-- Создание буферных зон вокруг магазинов
SELECT 
    s.name,
    s.store_type,
    -- Создание буферной зоны радиусом 2 км
    ST_Buffer(ST_GeomFromText(
        CONCAT('POINT(', s.longitude, ' ', s.latitude, ')')
    ), 0.018) as coverage_zone,  -- ~2км в градусах
    
    -- Площадь покрытия в км²
    ROUND(
        ST_Area(ST_Buffer(ST_GeomFromText(
            CONCAT('POINT(', s.longitude, ' ', s.latitude, ')')
        ), 0.018)) * 111.32 * 111.32, 2
    ) as coverage_area_km2
FROM stores s
WHERE s.is_active = 1;

-- Анализ пересечений зон покрытия
WITH store_zones AS (
    SELECT 
        id,
        name,
        ST_Buffer(ST_GeomFromText(
            CONCAT('POINT(', longitude, ' ', latitude, ')')
        ), 0.018) as zone
    FROM stores
)
SELECT 
    s1.name as store1,
    s2.name as store2,
    CASE 
        WHEN ST_Intersects(s1.zone, s2.zone) THEN 'OVERLAP'
        ELSE 'NO_OVERLAP'
    END as overlap_status,
    -- Процент пересечения
    ROUND(
        ST_Area(ST_Intersection(s1.zone, s2.zone)) / 
        ST_Area(s1.zone) * 100, 2
    ) as overlap_percentage
FROM store_zones s1
CROSS JOIN store_zones s2
WHERE s1.id < s2.id
    AND ST_Intersects(s1.zone, s2.zone)
ORDER BY overlap_percentage DESC;</code></pre>
</div>

<h3>Временно-пространственный анализ:</h3>
<div class="code-example">
    <pre><code>-- Анализ движения курьеров во времени
WITH delivery_routes AS (
    SELECT 
        courier_id,
        order_id,
        pickup_time,
        delivery_time,
        pickup_lat, pickup_lng,
        delivery_lat, delivery_lng,
        -- Расчет скорости доставки
        HAVERSINE_DISTANCE(pickup_lat, pickup_lng, delivery_lat, delivery_lng) /
        (TIMESTAMPDIFF(MINUTE, pickup_time, delivery_time) / 60.0) as avg_speed_kmh,
        
        -- Определение времени дня
        CASE 
            WHEN HOUR(pickup_time) BETWEEN 6 AND 11 THEN 'Morning'
            WHEN HOUR(pickup_time) BETWEEN 12 AND 17 THEN 'Afternoon'
            WHEN HOUR(pickup_time) BETWEEN 18 AND 22 THEN 'Evening'
            ELSE 'Night'
        END as time_period
    FROM deliveries
    WHERE delivery_status = 'completed'
        AND delivery_time IS NOT NULL
)
SELECT 
    time_period,
    COUNT(*) as total_deliveries,
    ROUND(AVG(avg_speed_kmh), 2) as avg_delivery_speed,
    ROUND(AVG(HAVERSINE_DISTANCE(pickup_lat, pickup_lng, delivery_lat, delivery_lng)), 2) as avg_distance_km,
    ROUND(AVG(TIMESTAMPDIFF(MINUTE, pickup_time, delivery_time)), 2) as avg_delivery_time_min,
    
    -- Эффективность по времени
    CASE 
        WHEN AVG(avg_speed_kmh) > 25 THEN 'High Efficiency'
        WHEN AVG(avg_speed_kmh) > 15 THEN 'Medium Efficiency'
        ELSE 'Low Efficiency'
    END as efficiency_rating
FROM delivery_routes
GROUP BY time_period
ORDER BY avg_delivery_speed DESC;</code></pre>
</div>

<h3>Продвинутая геоаналитика:</h3>
<div class="code-example">
    <pre><code>-- Анализ конкурентного окружения
WITH competitor_analysis AS (
    SELECT 
        s.id,
        s.name as our_store,
        s.latitude, s.longitude,
        s.monthly_revenue,
        
        -- Подсчет конкурентов в радиусе 1 км
        (SELECT COUNT(*) 
         FROM competitors c 
         WHERE HAVERSINE_DISTANCE(s.latitude, s.longitude, c.latitude, c.longitude) <= 1
        ) as competitors_1km,
        
        -- Ближайший конкурент
        (SELECT MIN(HAVERSINE_DISTANCE(s.latitude, s.longitude, c.latitude, c.longitude))
         FROM competitors c
        ) as nearest_competitor_km,
        
        -- Средний рейтинг конкурентов поблизости
        (SELECT ROUND(AVG(c.rating), 2)
         FROM competitors c 
         WHERE HAVERSINE_DISTANCE(s.latitude, s.longitude, c.latitude, c.longitude) <= 2
        ) as avg_competitor_rating
    FROM stores s
)
SELECT 
    our_store,
    monthly_revenue,
    competitors_1km,
    ROUND(nearest_competitor_km, 3) as nearest_competitor_km,
    avg_competitor_rating,
    
    -- Конкурентное давление
    CASE 
        WHEN competitors_1km = 0 THEN 'Monopoly'
        WHEN competitors_1km <= 2 THEN 'Low Competition'
        WHEN competitors_1km <= 5 THEN 'Medium Competition'
        ELSE 'High Competition'
    END as competition_level,
    
    -- Рекомендации
    CASE 
        WHEN competitors_1km = 0 AND monthly_revenue < 50000 
        THEN 'Market development opportunity'
        WHEN competitors_1km > 5 AND monthly_revenue < 30000
        THEN 'Consider relocation'
        WHEN avg_competitor_rating > 4.5 AND competitors_1km > 3
        THEN 'Focus on service quality'
        ELSE 'Maintain current strategy'
    END as strategic_recommendation
FROM competitor_analysis
ORDER BY monthly_revenue DESC;</code></pre>
</div>

<h3>Геокластеризация и сегментация:</h3>
<div class="code-example">
    <pre><code>-- K-means кластеризация клиентов по географии и покупкам
WITH customer_metrics AS (
    SELECT 
        c.id,
        c.latitude, c.longitude,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_spent,
        AVG(o.total_amount) as avg_order_value,
        DATEDIFF(CURDATE(), MAX(o.order_date)) as days_since_last_order
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL
    GROUP BY c.id, c.latitude, c.longitude
),
geo_clusters AS (
    SELECT 
        *,
        -- Простая геокластеризация по координатам
        CONCAT(
            FLOOR(latitude * 20) / 20, '_',
            FLOOR(longitude * 20) / 20
        ) as geo_cluster,
        
        -- Сегментация по ценности
        CASE 
            WHEN total_spent > 1000 AND order_count > 10 THEN 'VIP'
            WHEN total_spent > 500 AND order_count > 5 THEN 'Regular'
            WHEN total_spent > 100 THEN 'Occasional'
            ELSE 'New'
        END as customer_segment
    FROM customer_metrics
)
SELECT 
    geo_cluster,
    customer_segment,
    COUNT(*) as customer_count,
    ROUND(AVG(total_spent), 2) as avg_total_spent,
    ROUND(AVG(avg_order_value), 2) as avg_order_value,
    ROUND(AVG(days_since_last_order), 0) as avg_days_since_last_order,
    
    -- Центроид кластера
    ROUND(AVG(latitude), 6) as cluster_center_lat,
    ROUND(AVG(longitude), 6) as cluster_center_lng,
    
    -- Рекомендации по маркетингу
    CASE 
        WHEN customer_segment = 'VIP' THEN 'Premium service focus'
        WHEN customer_segment = 'Regular' AND avg_days_since_last_order > 30 
        THEN 'Retention campaign needed'
        WHEN customer_segment = 'New' THEN 'Welcome campaign'
        ELSE 'Standard marketing'
    END as marketing_strategy
FROM geo_clusters
GROUP BY geo_cluster, customer_segment
HAVING customer_count >= 5
ORDER BY geo_cluster, customer_count DESC;</code></pre>
</div>

<div class="best-practices">
    <h3>Лучшие практики геоаналитики:</h3>
    <ul>
        <li><strong>Индексация:</strong> Всегда создавайте пространственные индексы для геоколонок</li>
        <li><strong>Точность координат:</strong> Используйте подходящую точность (обычно 6-8 знаков после запятой)</li>
        <li><strong>Проекции:</strong> Учитывайте системы координат при работе с большими территориями</li>
        <li><strong>Производительность:</strong> Для больших датасетов используйте предвычисленные грид-ячейки</li>
        <li><strong>Валидация:</strong> Всегда проверяйте корректность координат перед анализом</li>
    </ul>
</div>`,
            5: `<h2>Анализ временных рядов: От трендов к прогнозам</h2>
    <p>Временные ряды — это основа современной аналитики. Понимание динамики данных во времени позволяет выявлять тренды, сезонность и аномалии, необходимые для принятия стратегических решений.</p>

    <h3>Основные концепции временных рядов:</h3>
    <ul>
        <li><strong>Тренд:</strong> Долгосрочное направление изменения данных</li>
        <li><strong>Сезонность:</strong> Регулярные колебания в определенные периоды</li>
        <li><strong>Цикличность:</strong> Повторяющиеся паттерны без фиксированного периода</li>
        <li><strong>Случайные колебания:</strong> Непредсказуемые изменения</li>
    </ul>

    <div class="code-block">
        <h4>Создание базовой структуры временных рядов:</h4>
        <pre><code>-- Создание таблицы с временными метками
CREATE TABLE sales_timeseries (
    date_time TIMESTAMP WITH TIME ZONE,
    store_id INTEGER,
    product_category VARCHAR(50),
    sales_amount DECIMAL(10,2),
    units_sold INTEGER,
    weather_condition VARCHAR(20),
    is_holiday BOOLEAN
);

-- Генерация временного ряда с различными интервалами
WITH time_series AS (
    SELECT 
        generate_series(
            '2023-01-01'::timestamp,
            '2024-12-31'::timestamp,
            '1 hour'::interval
        ) as hour_timestamp
),
enhanced_series AS (
    SELECT 
        hour_timestamp,
        EXTRACT(year FROM hour_timestamp) as year,
        EXTRACT(month FROM hour_timestamp) as month,
        EXTRACT(day FROM hour_timestamp) as day,
        EXTRACT(dow FROM hour_timestamp) as day_of_week,
        EXTRACT(hour FROM hour_timestamp) as hour,
        CASE 
            WHEN EXTRACT(dow FROM hour_timestamp) IN (0,6) THEN 'Weekend'
            ELSE 'Weekday'
        END as day_type
    FROM time_series
)
SELECT * FROM enhanced_series LIMIT 100;</code></pre>
    </div>

    <h3>Агрегация по временным интервалам:</h3>
    
    <div class="code-block">
        <h4>Многоуровневая временная агрегация:</h4>
        <pre><code>-- Продажи по различным временным интервалам
WITH hourly_sales AS (
    SELECT 
        DATE_TRUNC('hour', date_time) as hour,
        SUM(sales_amount) as hourly_revenue,
        SUM(units_sold) as hourly_units,
        COUNT(*) as transactions_count
    FROM sales_timeseries
    WHERE date_time >= '2024-01-01'
    GROUP BY DATE_TRUNC('hour', date_time)
),
daily_sales AS (
    SELECT 
        DATE_TRUNC('day', date_time) as day,
        SUM(sales_amount) as daily_revenue,
        AVG(sales_amount) as avg_transaction,
        COUNT(DISTINCT store_id) as active_stores
    FROM sales_timeseries
    WHERE date_time >= '2024-01-01'
    GROUP BY DATE_TRUNC('day', date_time)
),
weekly_sales AS (
    SELECT 
        DATE_TRUNC('week', date_time) as week,
        SUM(sales_amount) as weekly_revenue,
        COUNT(*) as weekly_transactions,
        COUNT(DISTINCT product_category) as categories_sold
    FROM sales_timeseries
    WHERE date_time >= '2024-01-01'
    GROUP BY DATE_TRUNC('week', date_time)
)
-- Объединение всех уровней агрегации
SELECT 
    'Hourly' as granularity,
    COUNT(*) as periods_count,
    AVG(hourly_revenue) as avg_revenue,
    STDDEV(hourly_revenue) as revenue_volatility
FROM hourly_sales
UNION ALL
SELECT 
    'Daily' as granularity,
    COUNT(*) as periods_count,
    AVG(daily_revenue) as avg_revenue,
    STDDEV(daily_revenue) as revenue_volatility
FROM daily_sales
UNION ALL
SELECT 
    'Weekly' as granularity,
    COUNT(*) as periods_count,
    AVG(weekly_revenue) as avg_revenue,
    STDDEV(weekly_revenue) as revenue_volatility
FROM weekly_sales;</code></pre>
    </div>

    <h3>Анализ трендов и изменений:</h3>

    <div class="code-block">
        <h4>Расчет скользящих средних и трендов:</h4>
        <pre><code>-- Анализ трендов с различными окнами
WITH daily_metrics AS (
    SELECT 
        DATE_TRUNC('day', date_time) as date,
        SUM(sales_amount) as daily_sales,
        COUNT(*) as daily_transactions
    FROM sales_timeseries
    GROUP BY DATE_TRUNC('day', date_time)
),
trend_analysis AS (
    SELECT 
        date,
        daily_sales,
        daily_transactions,
        -- Скользящие средние
        AVG(daily_sales) OVER (
            ORDER BY date 
            ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ) as sales_7day_ma,
        AVG(daily_sales) OVER (
            ORDER BY date 
            ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
        ) as sales_30day_ma,
        -- Экспоненциальное скользящее среднее (приближение)
        AVG(daily_sales) OVER (
            ORDER BY date 
            ROWS BETWEEN 13 PRECEDING AND CURRENT ROW
        ) as sales_14day_ema,
        -- Изменения относительно предыдущего периода
        LAG(daily_sales, 1) OVER (ORDER BY date) as prev_day_sales,
        LAG(daily_sales, 7) OVER (ORDER BY date) as prev_week_sales,
        LAG(daily_sales, 30) OVER (ORDER BY date) as prev_month_sales
    FROM daily_metrics
),
growth_analysis AS (
    SELECT 
        date,
        daily_sales,
        sales_7day_ma,
        sales_30day_ma,
        -- Процентные изменения
        CASE 
            WHEN prev_day_sales > 0 THEN 
                ((daily_sales - prev_day_sales) / prev_day_sales * 100)
            ELSE NULL
        END as day_over_day_growth,
        CASE 
            WHEN prev_week_sales > 0 THEN 
                ((daily_sales - prev_week_sales) / prev_week_sales * 100)
            ELSE NULL
        END as week_over_week_growth,
        CASE 
            WHEN prev_month_sales > 0 THEN 
                ((daily_sales - prev_month_sales) / prev_month_sales * 100)
            ELSE NULL
        END as month_over_month_growth,
        -- Определение тренда
        CASE 
            WHEN sales_7day_ma > sales_30day_ma THEN 'Upward'
            WHEN sales_7day_ma < sales_30day_ma THEN 'Downward'
            ELSE 'Stable'
        END as trend_direction
    FROM trend_analysis
)
SELECT 
    date,
    daily_sales,
    ROUND(sales_7day_ma, 2) as ma_7d,
    ROUND(sales_30day_ma, 2) as ma_30d,
    ROUND(day_over_day_growth, 2) as dod_growth_pct,
    ROUND(week_over_week_growth, 2) as wow_growth_pct,
    ROUND(month_over_month_growth, 2) as mom_growth_pct,
    trend_direction
FROM growth_analysis
WHERE date >= CURRENT_DATE - INTERVAL '3 months'
ORDER BY date DESC;</code></pre>
    </div>

    <h3>Сезонность и циклические паттерны:</h3>

    <div class="code-block">
        <h4>Выявление сезонных паттернов:</h4>
        <pre><code>-- Анализ сезонности по различным временным измерениям
WITH seasonal_analysis AS (
    SELECT 
        EXTRACT(month FROM date_time) as month,
        EXTRACT(dow FROM date_time) as day_of_week,
        EXTRACT(hour FROM date_time) as hour,
        product_category,
        SUM(sales_amount) as total_sales,
        COUNT(*) as transaction_count,
        AVG(sales_amount) as avg_transaction_value
    FROM sales_timeseries
    WHERE date_time >= CURRENT_DATE - INTERVAL '2 years'
    GROUP BY 
        EXTRACT(month FROM date_time),
        EXTRACT(dow FROM date_time),
        EXTRACT(hour FROM date_time),
        product_category
),
monthly_patterns AS (
    SELECT 
        month,
        CASE 
            WHEN month IN (12, 1, 2) THEN 'Winter'
            WHEN month IN (3, 4, 5) THEN 'Spring'
            WHEN month IN (6, 7, 8) THEN 'Summer'
            ELSE 'Fall'
        END as season,
        SUM(total_sales) as seasonal_sales,
        AVG(avg_transaction_value) as avg_seasonal_transaction
    FROM seasonal_analysis
    GROUP BY month
),
hourly_patterns AS (
    SELECT 
        hour,
        CASE 
            WHEN hour BETWEEN 6 AND 11 THEN 'Morning'
            WHEN hour BETWEEN 12 AND 17 THEN 'Afternoon'
            WHEN hour BETWEEN 18 AND 22 THEN 'Evening'
            ELSE 'Night'
        END as time_period,
        SUM(total_sales) as period_sales,
        COUNT(*) as period_transactions
    FROM seasonal_analysis
    GROUP BY hour
),
weekly_patterns AS (
    SELECT 
        day_of_week,
        CASE 
            WHEN day_of_week = 1 THEN 'Monday'
            WHEN day_of_week = 2 THEN 'Tuesday'
            WHEN day_of_week = 3 THEN 'Wednesday'
            WHEN day_of_week = 4 THEN 'Thursday'
            WHEN day_of_week = 5 THEN 'Friday'
            WHEN day_of_week = 6 THEN 'Saturday'
            ELSE 'Sunday'
        END as day_name,
        SUM(total_sales) as day_sales,
        RANK() OVER (ORDER BY SUM(total_sales) DESC) as sales_rank
    FROM seasonal_analysis
    GROUP BY day_of_week
)
-- Сводная таблица сезонности
SELECT 
    'Monthly' as pattern_type,
    month::text as period,
    seasonal_sales as sales,
    ROUND((seasonal_sales / SUM(seasonal_sales) OVER() * 100), 2) as percentage_of_total
FROM monthly_patterns
UNION ALL
SELECT 
    'Hourly' as pattern_type,
    time_period as period,
    period_sales as sales,
    ROUND((period_sales / SUM(period_sales) OVER() * 100), 2) as percentage_of_total
FROM hourly_patterns
UNION ALL
SELECT 
    'Weekly' as pattern_type,
    day_name as period,
    day_sales as sales,
    ROUND((day_sales / SUM(day_sales) OVER() * 100), 2) as percentage_of_total
FROM weekly_patterns
ORDER BY pattern_type, sales DESC;</code></pre>
    </div>

    <h3>Обнаружение аномалий и выбросов:</h3>

    <div class="code-block">
        <h4>Статистическое выявление аномалий:</h4>
        <pre><code>-- Обнаружение аномалий с использованием статистических методов
WITH daily_stats AS (
    SELECT 
        DATE_TRUNC('day', date_time) as date,
        SUM(sales_amount) as daily_sales,
        COUNT(*) as daily_transactions
    FROM sales_timeseries
    GROUP BY DATE_TRUNC('day', date_time)
),
statistical_bounds AS (
    SELECT 
        date,
        daily_sales,
        daily_transactions,
        AVG(daily_sales) OVER() as mean_sales,
        STDDEV(daily_sales) OVER() as stddev_sales,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY daily_sales) OVER() as q1_sales,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY daily_sales) OVER() as q3_sales,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY daily_sales) OVER() as p95_sales,
        PERCENTILE_CONT(0.05) WITHIN GROUP (ORDER BY daily_sales) OVER() as p5_sales
    FROM daily_stats
)`,
            6: `<h2>CTE и рекурсивные запросы: Мощный инструмент для сложной аналитики</h2>
    <p>Common Table Expressions (CTE) представляют собой временные именованные результирующие наборы, которые существуют только в пределах выполнения одного SQL-запроса. Это революционный подход к структурированию сложных аналитических запросов.</p>

    <h3>Концептуальные основы CTE:</h3>
    <p>CTE решает фундаментальную проблему читаемости и переиспользования кода в SQL. Вместо создания вложенных подзапросов или временных таблиц, CTE позволяет определить логические блоки данных на уровне запроса, создавая своего рода "виртуальные представления" для текущего контекста выполнения.</p>

    <div class="concept-block">
        <h4>Философия CTE:</h4>
        <p>CTE воплощает принцип декларативного программирования в SQL - вы описываете ЧТО нужно получить, а не КАК это сделать. Это позволяет разбивать сложную логику на понятные, независимые компоненты.</p>
    </div>

    <h3>Базовый синтаксис и структура:</h3>
    <div class="code-block">
        <pre>
WITH cte_name AS (
    SELECT column1, column2, ...
    FROM table_name
    WHERE conditions
),
another_cte AS (
    SELECT ...
    FROM cte_name  -- Ссылка на предыдущий CTE
    WHERE ...
)
SELECT * FROM another_cte;
        </pre>
    </div>

    <h3>Рекурсивные CTE: Обработка иерархических данных</h3>
    <p>Рекурсивные CTE представляют собой особый класс выражений, способных обрабатывать иерархические и древовидные структуры данных. Они состоят из двух ключевых компонентов: якорного элемента (anchor) и рекурсивного элемента.</p>

    <div class="theory-block">
        <h4>Математическая модель рекурсии в SQL:</h4>
        <p>Рекурсивный CTE работает по принципу математической индукции:</p>
        <ul>
            <li><strong>Базовый случай:</strong> Начальный набор данных (якорь)</li>
            <li><strong>Рекурсивный шаг:</strong> Правило генерации следующего уровня</li>
            <li><strong>Условие остановки:</strong> Когда больше нет данных для обработки</li>
        </ul>
    </div>

    <div class="code-block">
        <pre>
WITH RECURSIVE hierarchy AS (
    -- Якорный элемент (базовый случай)
    SELECT employee_id, name, manager_id, 1 as level
    FROM employees 
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Рекурсивный элемент
    SELECT e.employee_id, e.name, e.manager_id, h.level + 1
    FROM employees e
    INNER JOIN hierarchy h ON e.manager_id = h.employee_id
)
SELECT * FROM hierarchy ORDER BY level, name;
        </pre>
    </div>

    <h3>Продвинутые паттерны использования:</h3>
    
    <h4>1. Аналитические окна с CTE</h4>
    <p>CTE идеально подходят для создания многоуровневых аналитических конвейеров, где каждый уровень выполняет определенную трансформацию данных:</p>
    
    <div class="code-block">
        <pre>
WITH monthly_sales AS (
    SELECT 
        DATE_TRUNC('month', sale_date) as month,
        SUM(amount) as total_sales
    FROM sales GROUP BY 1
),
rolling_averages AS (
    SELECT 
        month,
        total_sales,
        AVG(total_sales) OVER (
            ORDER BY month 
            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ) as rolling_3m_avg
    FROM monthly_sales
),
performance_metrics AS (
    SELECT 
        *,
        total_sales / rolling_3m_avg - 1 as performance_ratio
    FROM rolling_averages
)
SELECT * FROM performance_metrics;
        </pre>
    </div>

    <h4>2. Граф-аналитика с рекурсивными CTE</h4>
    <p>Рекурсивные CTE открывают возможности для анализа сетевых структур, поиска путей и анализа связности в графах данных.</p>

    <div class="theory-block">
        <h4>Алгоритмические возможности:</h4>
        <ul>
            <li><strong>Обход в глубину (DFS):</strong> Исследование всех возможных путей</li>
            <li><strong>Поиск кратчайшего пути:</strong> Алгоритм Дейкстры в SQL</li>
            <li><strong>Анализ компонент связности:</strong> Поиск изолированных групп</li>
            <li><strong>Циклы и петли:</strong> Обнаружение циклических зависимостей</li>
        </ul>
    </div>

    <h3>Производительность и оптимизация:</h3>
    <p>Эффективность CTE зависит от понимания их внутренней механики. В отличие от временных таблиц, CTE материализуются только при необходимости, но это может приводить к повторным вычислениям при множественных обращениях.</p>

    <div class="performance-block">
        <h4>Стратегии оптимизации:</h4>
        <ul>
            <li><strong>Материализация:</strong> Использование промежуточных таблиц для сложных CTE</li>
            <li><strong>Индексация:</strong> Создание индексов на колонки, используемые в JOIN операциях</li>
            <li><strong>Ограничение рекурсии:</strong> Использование LIMIT или условий остановки</li>
            <li><strong>Анализ плана выполнения:</strong> Мониторинг cost-based оптимизации</li>
        </ul>
    </div>

    <h3>CTE vs альтернативные подходы:</h3>
    
    <div class="comparison-table">
        <h4>Сравнительный анализ:</h4>
        <table>
            <tr>
                <th>Аспект</th>
                <th>CTE</th>
                <th>Подзапросы</th>
                <th>Временные таблицы</th>
            </tr>
            <tr>
                <td>Читаемость</td>
                <td>Высокая</td>
                <td>Низкая при вложенности</td>
                <td>Средняя</td>
            </tr>
            <tr>
                <td>Переиспользование</td>
                <td>В рамках запроса</td>
                <td>Невозможно</td>
                <td>Между запросами</td>
            </tr>
            <tr>
                <td>Производительность</td>
                <td>Зависит от реализации</td>
                <td>Может быть неоптимальна</td>
                <td>Высокая при индексации</td>
            </tr>
            <tr>
                <td>Рекурсия</td>
                <td>Поддерживается</td>
                <td>Невозможна</td>
                <td>Через циклы</td>
            </tr>
        </table>
    </div>

    <h3>Продвинутые концепции:</h3>
    
    <h4>Множественные рекурсивные ветви:</h4>
    <p>Сложные иерархии могут требовать обработки нескольких рекурсивных путей одновременно. Это позволяет моделировать сложные бизнес-процессы и организационные структуры.</p>

    <h4>Условная рекурсия:</h4>
    <p>Использование CASE-выражений и условной логики в рекурсивных CTE позволяет создавать адаптивные алгоритмы обхода, которые изменяют свое поведение в зависимости от данных.</p>

    <div class="advanced-concept">
        <h4>Теория графов в SQL:</h4>
        <p>Рекурсивные CTE превращают SQL в мощный инструмент для анализа графов. Вы можете реализовать алгоритмы поиска в ширину, анализа центральности узлов, и даже некоторые варианты алгоритмов машинного обучения на графах.</p>
    </div>

    <h3>Ограничения и подводные камни:</h3>
    <p>Понимание ограничений CTE критично для их эффективного использования. Глубокая рекурсия может привести к переполнению стека или бесконечным циклам. Различные СУБД имеют разные лимиты на глубину рекурсии и способы их настройки.</p>

    <div class="warning-block">
        <h4>Критические моменты:</h4>
        <ul>
            <li><strong>Бесконечная рекурсия:</strong> Всегда проверяйте условия остановки</li>
            <li><strong>Производительность:</strong> CTE может быть менее эффективен для больших датасетов</li>
            <li><strong>Совместимость:</strong> Не все СУБД поддерживают рекурсивные CTE одинаково</li>
            <li><strong>Отладка:</strong> Сложность диагностики ошибок в глубоко вложенных структурах</li>
        </ul>
    </div>

    <h3>Современные тенденции и будущее CTE:</h3>
    <p>С развитием аналитических платформ и больших данных, CTE эволюционируют в сторону поддержки распределенных вычислений и интеграции с системами машинного обучения. Современные реализации включают оптимизации для колоночных хранилищ и параллельные алгоритмы обработки рекурсии.</p>`,
            7: `<h2>Статистические функции и корреляции в SQL</h2>
        <p>Современные СУБД предоставляют мощный арсенал статистических функций для глубокого анализа данных непосредственно на уровне базы данных.</p>

        <h3>Фундаментальные статистические концепции в SQL:</h3>
        
        <div class="theory-block">
            <h4>Описательная статистика</h4>
            <p>Базовые меры центральной тенденции и разброса данных формируют основу для более сложных аналитических вычислений. Среднее арифметическое, медиана и мода представляют различные способы описания "типичного" значения в наборе данных, каждый из которых имеет свои преимущества в различных контекстах анализа.</p>
            
            <p>Дисперсия и стандартное отклонение измеряют изменчивость данных относительно среднего значения. Понимание этих метрик критически важно для оценки качества данных и выявления аномалий в распределениях.</p>
        </div>

        <h3>Продвинутые статистические функции:</h3>
        
        <div class="advanced-stats">
            <h4>Функции распределения и квантили</h4>
            <p>PERCENTILE_CONT и PERCENTILE_DISC позволяют вычислять процентили как для непрерывных, так и для дискретных распределений. Эти функции особенно важны для анализа производительности, SLA и выявления выбросов в больших наборах данных.</p>
            
            <p>Функция NTILE разделяет упорядоченный набор данных на равные группы, что критически важно для создания сегментации клиентов, анализа ABC-классификации и построения рейтинговых систем.</p>
            
            <h4>Коэффициенты асимметрии и эксцесса</h4>
            <p>Хотя не все СУБД предоставляют встроенные функции для вычисления skewness и kurtosis, эти метрики можно вычислить через комбинацию стандартных статистических функций. Асимметрия показывает, насколько распределение отклоняется от нормального в сторону хвостов, а эксцесс характеризует "остроту" пика распределения.</p>
        </div>

        <h3>Корреляционный анализ в SQL:</h3>
        
        <div class="correlation-theory">
            <h4>Типы корреляции</h4>
            <p>Коэффициент корреляции Пирсона (CORR) измеряет линейную зависимость между двумя переменными в диапазоне от -1 до 1. Значения близкие к 1 указывают на сильную положительную корреляцию, близкие к -1 — на сильную отрицательную, а близкие к 0 — на отсутствие линейной связи.</p>
            
            <p>Функция COVAR_POP и COVAR_SAMP вычисляют ковариацию между переменными, которая показывает направление совместного изменения переменных, но в отличие от корреляции, не нормализована и зависит от масштаба данных.</p>
            
            <h4>Ранговые корреляции</h4>
            <p>Для непараметрических данных или при нарушении предположений о нормальности распределения используются ранговые корреляции. Корреляция Спирмена основана на рангах значений и устойчива к выбросам, что делает её предпочтительной для анализа порядковых данных.</p>
        </div>

        <h3>Временные ряды и автокорреляция:</h3>
        
        <div class="time-series-stats">
            <h4>Функции запаздывания (LAG/LEAD)</h4>
            <p>Анализ временных рядов требует изучения взаимосвязей между текущими и предыдущими значениями. Автокорреляционная функция показывает, насколько текущие значения коррелируют с прошлыми значениями на различных временных лагах.</p>
            
            <p>Скользящие статистики (moving averages, rolling correlations) позволяют выявлять изменяющиеся во времени паттерны и тренды в данных. Экспоненциально взвешенные скользящие средние придают больший вес более свежим наблюдениям.</p>
        </div>

        <h3>Многомерный статистический анализ:</h3>
        
        <div class="multivariate-analysis">
            <h4>Корреляционные матрицы</h4>
            <p>При работе с множественными переменными необходимо строить полные корреляционные матрицы для выявления скрытых взаимосвязей. Высокие корреляции между предикторами могут указывать на проблему мультиколлинеарности в регрессионных моделях.</p>
            
            <h4>Частичные корреляции</h4>
            <p>Частичная корреляция показывает взаимосвязь между двумя переменными при контроле влияния третьих переменных. Это критически важно для понимания истинных причинно-следственных связей в данных и избегания ложных корреляций.</p>
        </div>

        <h3>Статистические тесты в SQL:</h3>
        
        <div class="statistical-tests">
            <h4>Проверка нормальности распределения</h4>
            <p>Многие статистические методы требуют нормального распределения данных. В SQL можно реализовать приближённые тесты на нормальность, используя сравнение среднего и медианы, анализ квартилей, или вычисление статистик Шапиро-Уилка через пользовательские функции.</p>
            
            <h4>Доверительные интервалы</h4>
            <p>Построение доверительных интервалов для статистических оценок позволяет оценить неопределённость результатов. Бутстрап-методы могут быть реализованы в SQL для получения робастных оценок доверительных интервалов без предположений о распределении.</p>
        </div>

        <h3>Продвинутые паттерны использования:</h3>
        
        <div class="advanced-patterns">
            <h4>Составные статистические метрики</h4>
            <p>Комбинирование базовых статистических функций позволяет создавать сложные аналитические метрики. Коэффициент вариации, индекс Джини, энтропия Шеннона — все эти метрики могут быть вычислены средствами SQL.</p>
            
            <h4>Сравнительный анализ распределений</h4>
            <p>Статистика Колмогорова-Смирнова для сравнения двух распределений, тест Манна-Уитни для сравнения медиан — эти методы могут быть адаптированы для реализации в SQL при работе с большими объёмами данных.</p>
        </div>

        <h3>Оптимизация статистических вычислений:</h3>
        
        <div class="optimization-theory">
            <h4>Инкрементальные вычисления</h4>
            <p>Для больших наборов данных критически важна возможность инкрементального обновления статистических метрик. Алгоритмы онлайн-вычисления среднего, дисперсии и корреляции позволяют обновлять статистики при поступлении новых данных без полного пересчёта.</p>
            
            <h4>Параллельные вычисления</h4>
            <p>Многие статистические функции могут быть распараллелены через разбиение данных на партиции. Понимание алгебраических свойств статистических операций позволяет эффективно комбинировать результаты вычислений на различных узлах кластера.</p>
        </div>

        <div class="practical-note">
            <h4>Интеграция с аналитическими платформами</h4>
            <p>Современные подходы включают тесную интеграцию SQL-статистик с внешними аналитическими системами (R, Python, Spark). Понимание границ применимости SQL-статистик и знание того, когда следует переходить к специализированным инструментам, является ключевым навыком современного аналитика данных.</p>
        </div>`,
},};
    return courseLessons[courseId]?.[lessonId] || '<p>Контент урока не найден</p>';
}

function updateCurrentLesson(courseId, lessonId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const userCourseIndex = currentUser.courses.findIndex(c => c.id === courseId);
    if (userCourseIndex === -1) return;
    
    const course = JSON.parse(localStorage.getItem('courses')).find(c => c.id === courseId);
    if (!course) return;
    
    // Обновляем текущий урок
    currentUser.courses[userCourseIndex].currentLesson = lessonId;
    
    // Обновляем прогресс
    const totalLessons = course.lessons.length;
    const progress = Math.round((lessonId / totalLessons) * 100);
    currentUser.courses[userCourseIndex].progress = progress;
    
    // Сохраняем в localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Отправляем на сервер
    const token = localStorage.getItem('token');
    if (token) {
        sendProgressToServer(courseId, progress, lessonId, currentUser.courses[userCourseIndex].completed, course.title);
    }
    
    loadCourse(courseId);
    updateProfile();
    updateCoursesProgressUI();
}

// Функция для отправки прогресса на сервер
function sendProgressToServer(courseId, progress, currentLesson, completed, title, retryCount = 0) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch('/api/courses/save-progress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            courseId,
            progress,
            currentLesson,
            completed,
            title
        })
    })
    .then(response => {
        if (!response.ok && retryCount < 3) {
            // Если не удалось отправить, повторяем попытку через 1 секунду
            setTimeout(() => {
                sendProgressToServer(courseId, progress, currentLesson, completed, title, retryCount + 1);
            }, 1000);
        }
        return response.json();
    })
    .then(data => {
        console.log('Прогресс сохранен на сервере:', data);
    })
    .catch(error => {
        console.error('Ошибка при сохранении прогресса:', error);
        // Повторяем попытку, если ошибка произошла и не превышено количество попыток
        if (retryCount < 3) {
            setTimeout(() => {
                sendProgressToServer(courseId, progress, currentLesson, completed, title, retryCount + 1);
            }, 1000);
        }
    });
}

async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Требуется авторизация');
    }
    
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    
    const mergedOptions = { 
        ...defaultOptions, 
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    const response = await fetch(url, mergedOptions);
    
    // Если возвращается 401, значит токен недействителен
    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        showMessage('Сессия истекла. Пожалуйста, войдите снова.', 'error');
        // Перенаправляем на главную страницу
        document.querySelector('.nav-link[data-page="home"]').click();
        return null;
    }
    
    return response;
}

// Функция для отправки прогресса с повторными попытками в случае ошибки
function sendProgressToServer(courseId, progress, currentLesson, completed, title, retryCount = 0) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch('/api/courses/save-progress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            courseId,
            progress,
            currentLesson,
            completed,
            title
        })
    })
    .then(response => {
        if (!response.ok && retryCount < 3) {
            // Если не удалось отправить, повторяем попытку через 1 секунду
            setTimeout(() => {
                sendProgressToServer(courseId, progress, currentLesson, completed, title, retryCount + 1);
            }, 1000);
        }
        return response.json();
    })
    .then(data => {
        console.log('Прогресс сохранен на сервере:', data);
    })
    .catch(error => {
        console.error('Ошибка при сохранении прогресса:', error);
        // Повторяем попытку, если ошибка произошла и не превышено количество попыток
        if (retryCount < 3) {
            setTimeout(() => {
                sendProgressToServer(courseId, progress, currentLesson, completed, title, retryCount + 1);
            }, 1000);
        }
    });
}

function syncUserProgress() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch('/api/courses/user-courses', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (response.ok) return response.json();
        throw new Error('Не удалось получить прогресс курсов');
    })
    .then(data => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            // Объединяем прогресс с сервера с локальным
            const updatedCourses = data.courses || [];
            
            // Обновляем только если есть данные с сервера
            if (updatedCourses.length > 0) {
                currentUser.courses = updatedCourses;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Обновляем UI
                updateCoursesProgressUI();
                updateProfile();
            }
        }
    })
    .catch(error => {
        console.error('Ошибка при синхронизации прогресса:', error);
    });
}

function completeCourse(courseId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const userCourseIndex = currentUser.courses.findIndex(c => c.id === courseId);
    if (userCourseIndex === -1) return;
    
    // Помечаем курс как завершенный
    currentUser.courses[userCourseIndex].completed = true;
    currentUser.courses[userCourseIndex].progress = 100;
    
    // Добавляем бонусный XP за завершение курса
    currentUser.xp += 200;
    
    // Проверяем уровень
    const xpToNextLevel = currentUser.level * 1000;
    if (currentUser.xp >= xpToNextLevel) {
        currentUser.level += 1;
        currentUser.xp = currentUser.xp - xpToNextLevel;
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Отправляем на сервер
    const token = localStorage.getItem('token');
    if (token) {
        const course = JSON.parse(localStorage.getItem('courses')).find(c => c.id === courseId);
        
        fetch('/api/courses/save-progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                courseId,
                progress: 100,
                currentLesson: currentUser.courses[userCourseIndex].currentLesson,
                completed: true,
                title: course.title
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Курс отмечен как завершенный на сервере:', data);
        })
        .catch(error => {
            console.error('Ошибка при сохранении прогресса:', error);
        });
    }
    
    updateProfile();
    updateCoursesProgressUI();
    
    // Показываем сообщение
    showMessage('Поздравляем! Вы успешно завершили курс!', 'success');
    
    // Возвращаемся на страницу со всеми курсами
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    document.querySelector('.nav-link[data-page="courses"]').classList.add('active');
    document.getElementById('courses').classList.add('active');
    
    window.scrollTo(0, 0);
}

// ========== SQL Песочница ==========

function initSQLPlayground() {
    const sqlContainer = document.querySelector('.sql-playground');
    if (!sqlContainer) return;
    
    sqlContainer.innerHTML = `
        <div class="playground-container">
            <div class="editor-panel pixel-border">
                <div class="toolbar">
                    <button id="runQueryBtn" class="pixel-btn run-btn">
                        <i class="fas fa-play pixel-icon"></i> Выполнить
                    </button>
                    <button id="clearBtn" class="pixel-btn clear-btn">
                        <i class="fas fa-trash pixel-icon"></i> Очистить
                    </button>
                </div>
                <textarea id="sqlEditor" class="pixel-textarea" placeholder="Введите SQL запрос..."></textarea>
            </div>
            
            <div class="result-panel pixel-border">
                <div class="result-header">Результат</div>
                <div id="queryResult" class="query-result pixel-scroll">
                    <p class="hint">Введите SQL запрос и нажмите "Выполнить"</p>
                </div>
            </div>
            
            <div class="info-panel pixel-border">
                <h3>Доступные таблицы</h3>
                <div class="tables-container">
                    <div class="tables-grid">
                        <div class="table-info">
                            <h4 class="table-title">demo_categories</h4>
                            <p class="table-description">Категории товаров</p>
                            <table class="schema-table">
                                <tr>
                                    <th>Столбец</th>
                                    <th>Тип</th>
                                    <th>Описание</th>
                                </tr>
                                <tr>
                                    <td>category_id</td>
                                    <td>SERIAL</td>
                                    <td>Первичный ключ</td>
                                </tr>
                                <tr>
                                    <td>name</td>
                                    <td>VARCHAR(100)</td>
                                    <td>Название категории</td>
                                </tr>
                                <tr>
                                    <td>description</td>
                                    <td>TEXT</td>
                                    <td>Описание категории</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div class="table-info">
                            <h4 class="table-title">demo_products</h4>
                            <p class="table-description">Товары</p>
                            <table class="schema-table">
                                <tr>
                                    <th>Столбец</th>
                                    <th>Тип</th>
                                    <th>Описание</th>
                                </tr>
                                <tr>
                                    <td>product_id</td>
                                    <td>SERIAL</td>
                                    <td>Первичный ключ</td>
                                </tr>
                                <tr>
                                    <td>name</td>
                                    <td>VARCHAR(100)</td>
                                    <td>Название товара</td>
                                </tr>
                                <tr>
                                    <td>description</td>
                                    <td>TEXT</td>
                                    <td>Описание товара</td>
                                </tr>
                                <tr>
                                    <td>price</td>
                                    <td>DECIMAL(10, 2)</td>
                                    <td>Цена товара</td>
                                </tr>
                                <tr>
                                    <td>stock_quantity</td>
                                    <td>INT</td>
                                    <td>Количество на складе</td>
                                </tr>
                                <tr>
                                    <td>category_id</td>
                                    <td>INT</td>
                                    <td>Внешний ключ к категориям</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div class="table-info">
                            <h4 class="table-title">demo_customers</h4>
                            <p class="table-description">Клиенты</p>
                            <table class="schema-table">
                                <tr>
                                    <th>Столбец</th>
                                    <th>Тип</th>
                                    <th>Описание</th>
                                </tr>
                                <tr>
                                    <td>customer_id</td>
                                    <td>SERIAL</td>
                                    <td>Первичный ключ</td>
                                </tr>
                                <tr>
                                    <td>first_name</td>
                                    <td>VARCHAR(50)</td>
                                    <td>Имя клиента</td>
                                </tr>
                                <tr>
                                    <td>last_name</td>
                                    <td>VARCHAR(50)</td>
                                    <td>Фамилия клиента</td>
                                </tr>
                                <tr>
                                    <td>email</td>
                                    <td>VARCHAR(100)</td>
                                    <td>Email клиента</td>
                                </tr>
                                <tr>
                                    <td>phone</td>
                                    <td>VARCHAR(20)</td>
                                    <td>Телефон клиента</td>
                                </tr>
                                <tr>
                                    <td>address</td>
                                    <td>TEXT</td>
                                    <td>Адрес клиента</td>
                                </tr>
                                <tr>
                                    <td>created_at</td>
                                    <td>TIMESTAMP</td>
                                    <td>Дата регистрации</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div class="table-info">
                            <h4 class="table-title">demo_orders</h4>
                            <p class="table-description">Заказы</p>
                            <table class="schema-table">
                                <tr>
                                    <th>Столбец</th>
                                    <th>Тип</th>
                                    <th>Описание</th>
                                </tr>
                                <tr>
                                    <td>order_id</td>
                                    <td>SERIAL</td>
                                    <td>Первичный ключ</td>
                                </tr>
                                <tr>
                                    <td>customer_id</td>
                                    <td>INT</td>
                                    <td>ID клиента</td>
                                </tr>
                                <tr>
                                    <td>order_date</td>
                                    <td>TIMESTAMP</td>
                                    <td>Дата заказа</td>
                                </tr>
                                <tr>
                                    <td>status</td>
                                    <td>VARCHAR(20)</td>
                                    <td>Статус заказа</td>
                                </tr>
                                <tr>
                                    <td>total_amount</td>
                                    <td>DECIMAL(10, 2)</td>
                                    <td>Общая сумма</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div class="table-info">
                            <h4 class="table-title">demo_order_items</h4>
                            <p class="table-description">Элементы заказов</p>
                            <table class="schema-table">
                                <tr>
                                    <th>Столбец</th>
                                    <th>Тип</th>
                                    <th>Описание</th>
                                </tr>
                                <tr>
                                    <td>item_id</td>
                                    <td>SERIAL</td>
                                    <td>Первичный ключ</td>
                                </tr>
                                <tr>
                                    <td>order_id</td>
                                    <td>INT</td>
                                    <td>ID заказа</td>
                                </tr>
                                <tr>
                                    <td>product_id</td>
                                    <td>INT</td>
                                    <td>ID товара</td>
                                </tr>
                                <tr>
                                    <td>quantity</td>
                                    <td>INT</td>
                                    <td>Количество</td>
                                </tr>
                                <tr>
                                    <td>price_per_unit</td>
                                    <td>DECIMAL(10, 2)</td>
                                    <td>Цена за единицу</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Инициализация CodeMirror
    const sqlEditor = document.getElementById('sqlEditor');
    if (sqlEditor) {
        window.editor = CodeMirror.fromTextArea(sqlEditor, {
            mode: 'text/x-sql',
            theme: 'monokai',
            lineNumbers: true,
            indentWithTabs: true,
            smartIndent: true,
            lineWrapping: true,
            matchBrackets: true,
            autofocus: true
        });
        
        // Установка значения по умолчанию
        window.editor.setValue("SELECT * FROM demo_products LIMIT 5;");
        
        // Инициализация кнопки для выполнения запроса
        document.getElementById('runQueryBtn').addEventListener('click', function() {
            executeQuery();
        });
        
        // Инициализация кнопки очистки
        document.getElementById('clearBtn').addEventListener('click', function() {
            window.editor.setValue("");
            document.getElementById('queryResult').innerHTML = '<p class="hint">Введите SQL запрос и нажмите "Выполнить"</p>';
        });
        
        // Обработчики для примеров запросов
        document.querySelectorAll('.load-example').forEach(button => {
            button.addEventListener('click', function() {
                const queryText = this.previousElementSibling.textContent;
                window.editor.setValue(queryText);
                window.editor.focus();
            });
        });
    }
}

async function executeQuery() {
    const sqlEditor = document.getElementById('sqlEditor');
    const queryResult = document.getElementById('queryResult');
    
    if (!sqlEditor || !queryResult) {
        console.error('Элементы не найдены');
        return;
    }
    
    let sqlQuery;
    // Если используется CodeMirror
    if (typeof editor !== 'undefined' && editor) {
        sqlQuery = editor.getValue().trim();
    } else {
        sqlQuery = sqlEditor.value.trim();
    }
    
    if (!sqlQuery) {
        queryResult.innerHTML = '<p class="error">Пожалуйста, введите SQL запрос.</p>';
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        queryResult.innerHTML = '<p class="error">Для выполнения запросов необходимо авторизоваться</p>';
        return;
    }
    
    queryResult.innerHTML = '<p>Выполнение запроса...</p>';
    
    try {
        const response = await fetch('/api/queries/execute', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sqlText: sqlQuery })
        });
        
        const data = await response.json();
        
        // Обработка ответа от сервера
        if (data.error) {
            queryResult.innerHTML = `<p class="error">Ошибка: ${data.error}</p>`;
            return;
        }
        
        if (data.isSuccess && data.result) {
            try {
                // Пробуем распарсить результат как JSON
                const resultData = JSON.parse(data.result);
                
                // Проверяем, является ли результат массивом
                if (Array.isArray(resultData) && resultData.length > 0) {
                    // Создаем таблицу для отображения результатов
                    const table = document.createElement('table');
                    table.className = 'result-table';
                    
                    // Создаем заголовок таблицы
                    const thead = document.createElement('thead');
                    const headerRow = document.createElement('tr');
                    
                    // Получаем все возможные ключи из первого объекта
                    const columns = Object.keys(resultData[0]);
                    
                    columns.forEach(column => {
                        const th = document.createElement('th');
                        th.textContent = column;
                        headerRow.appendChild(th);
                    });
                    
                    thead.appendChild(headerRow);
                    table.appendChild(thead);
                    
                    // Создаем тело таблицы
                    const tbody = document.createElement('tbody');
                    
                    resultData.forEach(row => {
                        const tr = document.createElement('tr');
                        
                        columns.forEach(column => {
                            const td = document.createElement('td');
                            td.textContent = row[column] !== null ? row[column] : 'NULL';
                            tr.appendChild(td);
                        });
                        
                        tbody.appendChild(tr);
                    });
                    
                    table.appendChild(tbody);
                    
                    // Очищаем контейнер и добавляем таблицу
                    queryResult.innerHTML = '';
                    queryResult.appendChild(table);
                    
                    // Добавляем информацию о времени выполнения
                    const executionInfo = document.createElement('p');
                    executionInfo.className = 'execution-info';
                    executionInfo.textContent = `Запрос выполнен за ${data.executionTimeMs}мс. Найдено строк: ${resultData.length}`;
                    queryResult.appendChild(executionInfo);
                } else {
                    // Если это не массив или пустой массив
                    queryResult.innerHTML = `<p>Запрос выполнен успешно. Затронуто строк: ${Array.isArray(resultData) ? resultData.length : 0}</p>`;
                }
            } catch (e) {
                // Если не удалось распарсить JSON
                queryResult.innerHTML = `<p>Результат: ${data.result}</p>`;
            }
        } else {
            queryResult.innerHTML = '<p class="success">Запрос выполнен успешно, но не вернул данных.</p>';
        }
    } catch (error) {
        console.error('Ошибка:', error);
        queryResult.innerHTML = `<p class="error">Ошибка: ${error.message || 'Не удалось выполнить запрос'}</p>`;
    }
}

// ========== Вспомогательные функции ==========

function animateButtons() {
    const buttons = document.querySelectorAll('.pixel-btn');
    
    buttons.forEach(button => {
        button.addEventListener('mousedown', function() {
            this.classList.add('pressed');
        });
        
        button.addEventListener('mouseup', function() {
			            this.classList.remove('pressed');
        });
        
        button.addEventListener('mouseleave', function() {
            this.classList.remove('pressed');
        });
    });
}

function formatSql(sql) {
    // Простое форматирование SQL-запроса
    const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'AND', 'OR'];
    
    let formattedSql = sql.trim();
    
    // Заменяем ключевые слова на те же слова с переносом строки
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        formattedSql = formattedSql.replace(regex, `\n${keyword}`);
    });
    
    // Обработка отступов
    const lines = formattedSql.split('\n');
    let indentLevel = 0;
    
    return lines.map(line => {
        let trimmedLine = line.trim();
        
        // Уменьшаем отступ для закрывающих скобок
        if (trimmedLine.startsWith(')')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }
        
        const result = '  '.repeat(indentLevel) + trimmedLine;
        
        // Увеличиваем отступ для открывающих скобок
        if (trimmedLine.endsWith('(')) {
            indentLevel++;
        }
        
        return result;
    }).join('\n');
}

function clearResults() {
    document.getElementById('result-pane').innerHTML = '';
}

function saveQuery() {
    const queryText = editor.getValue();
    const queryName = prompt('Введите название для сохранения запроса:');
    
    if (queryName) {
        const savedQueries = JSON.parse(localStorage.getItem('savedQueries') || '{}');
        savedQueries[queryName] = queryText;
        localStorage.setItem('savedQueries', JSON.stringify(savedQueries));
        
        // Обновляем список сохраненных запросов
        updateSavedQueriesList();
    }
}

// Функции для работы с форумом
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация форума
    initForum();
});

async function createTopic(title, content) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      showMessage('Необходимо войти в систему', 'error');
      return;
    }
    
    // Получаем и обрабатываем теги
    const tagsInput = document.getElementById('topic-tags').value;
    const tags = tagsInput.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    const response = await fetch('/api/forum/topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content, tags })
    });
    
    // Остальной код остается без изменений
  } catch (error) {
    console.error('Ошибка при создании темы:', error);
    showMessage(error.message || 'Ошибка при создании темы', 'error');
  }
}

function initForum() {
    // Получаем элементы DOM
    const forumTopics = document.querySelector('.forum-topics');
    const createTopicBtn = document.getElementById('create-topic-btn');
    const createTopicModal = document.getElementById('create-topic-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const createTopicForm = document.getElementById('create-topic-form');
    const topicView = document.getElementById('topic-view');
    const backToForumBtn = document.querySelector('.back-to-forum');
    const addCommentBtn = document.getElementById('add-comment-btn');

    
    
    // ДОБАВЬТЕ ЭТИ СТРОКИ - Обработчики для поиска
    const searchInput = document.getElementById('forum-search');
    const searchBtn = document.getElementById('search-btn');
    
    // Если страница форума не активна, выходим
    if (!forumTopics) return;
    
    updateForumStats();

    // Загружаем темы форума
    loadTopics();
    
    // ДОБАВЬТЕ ЭТИ ОБРАБОТЧИКИ - Поиск по нажатию кнопки
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query) {
                searchTopics(query);
            } else {
                loadTopics(); // Загружаем все темы, если поиск пустой
            }
        });
        
        // Поиск по нажатию Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    searchTopics(query);
                } else {
                    loadTopics();
                }
            }
        });
        
        // Поиск в режиме реального времени (с задержкой)
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            
            searchTimeout = setTimeout(() => {
                if (query.length >= 2) {
                    searchTopics(query);
                } else if (query.length === 0) {
                    loadTopics();
                }
            }, 500); // Задержка 500мс
        });
    }
    
// Обработчик для кнопки "Создать тему"
if (createTopicBtn) {
    createTopicBtn.addEventListener('click', function() {
        if (createTopicModal) {
            createTopicModal.style.display = 'flex';
        }
    });
}

// Обработчик для закрытия модального окна
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', function() {
        if (createTopicModal) {
            createTopicModal.style.display = 'none';
        }
    });
}

// Обработчик для отправки формы создания темы
if (createTopicForm) {
    createTopicForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('topic-title').value.trim();
        const content = document.getElementById('topic-content').value.trim();
        
        if (!title || !content) {
            showMessage('Заполните все поля', 'error');
            return;
        }
        
        createTopic(title, content);
    });
}

    if (backToForumBtn) {
    backToForumBtn.addEventListener('click', function() {
        if (topicView && forumTopics) {
            topicView.style.display = 'none';
            forumTopics.parentNode.style.display = 'block';
        }
    });
}

if (addCommentBtn) {
    addCommentBtn.addEventListener('click', function() {
        const commentContent = document.getElementById('comment-content');
        const topicId = topicView?.getAttribute('data-topic-id');
        
        if (!commentContent || !topicId) return;
        
        const content = commentContent.value.trim();
        if (!content) {
            showMessage('Введите текст комментария', 'error');
            return;
        }
        
        addComment(topicId, content);
    });
}

if (createTopicModal) {
    createTopicModal.addEventListener('click', function(e) {
        if (e.target === createTopicModal) {
            createTopicModal.style.display = 'none';
        }
    });
}
}

let currentPage = 1;
const topicsPerPage = 5;

// Загрузка тем форума
async function loadTopics(page = 1) {
     const forumTopics = document.querySelector('.forum-topics'); // <-- Добавляем получение элемента
    if (!forumTopics) return;
    
    try {
        const response = await fetch(`/api/forum/topics?page=${page}&limit=${topicsPerPage}`);
        const data = await response.json();
        
        forumTopics.innerHTML = '';
        
        if (data.topics.length === 0) {
            forumTopics.innerHTML = '<p class="no-topics">Пока нет тем. Будьте первым, кто создаст тему!</p>';
            return;
        }
        
        data.topics.forEach(topic => {
            const topicElement = createTopicElement(topic);
            forumTopics.appendChild(topicElement);
        });

        // Добавляем пагинацию
        addPaginationControls(data.totalPages, page, forumTopics); 
        
    } catch (error) {
        console.error('Ошибка при загрузке тем:', error);
        forumTopics.innerHTML = '<p class="error">Ошибка при загрузке тем. Пожалуйста, попробуйте позже.</p>';
    }
}

function addPaginationControls(totalPages, currentPage, forumTopics) { // <-- Добавляем параметр
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination';
    
    // Удаляем предыдущую пагинацию
    const existingPagination = forumTopics.parentNode.querySelector('.pagination');
    if (existingPagination) {
        existingPagination.remove();
    }

    // Кнопки пагинации
    const prevButton = document.createElement('button');
    prevButton.className = 'pixel-btn';
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        loadTopics(currentPage - 1);
    });
    
    const pagesInfo = document.createElement('span');
    pagesInfo.className = 'page-info';
    pagesInfo.textContent = `${currentPage}/${totalPages}`;
    
    const nextButton = document.createElement('button');
    nextButton.className = 'pixel-btn';
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        loadTopics(currentPage + 1);
    });

    // Добавляем элементы
    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pagesInfo);
    paginationContainer.appendChild(nextButton);
    
    // Вставляем пагинацию ПОСЛЕ списка тем
    forumTopics.parentNode.insertBefore(paginationContainer, forumTopics.nextSibling);
}


// Создание элемента темы
function createTopicElement(topic) {
  const topicItem = document.createElement('div');
  topicItem.className = 'topic-item';
  if (topic.isPinned) {
    topicItem.classList.add('pinned');
  }
  
  const dateFormatted = new Date(topic.createdAt).toLocaleString();
  
  // Генерируем HTML для тегов
  const tagsHtml = topic.tags && topic.tags.length 
    ? `<div class="topic-tags">
        ${topic.tags.map(tag => `<span class="topic-tag">${tag}</span>`).join('')}
       </div>`
    : '';
  
  topicItem.innerHTML = `
    <div class="topic-item-content">
      <h3 class="topic-item-title">${topic.title}</h3>
      ${tagsHtml}
      <div class="topic-item-meta">
        <span class="topic-item-author">
          <i class="fas fa-user"></i> ${topic.user.username}
        </span>
        <span class="topic-item-date">
          <i class="fas fa-calendar"></i> ${dateFormatted}
        </span>
      </div>
    </div>
    <div class="topic-item-stats">
      <div class="topic-comments-count">
        <i class="fas fa-comments"></i> ${topic.commentCount || 0}
      </div>
      <div class="topic-views-count">
        <i class="fas fa-eye"></i> ${topic.viewCount}
      </div>
    </div>
  `;
  
  // Добавляем обработчик клика для просмотра темы
  topicItem.addEventListener('click', function() {
    viewTopic(topic.id);
  });
  
  return topicItem;
}

// Просмотр отдельной темы
async function viewTopic(topicId) {
    const forumTopics = document.querySelector('.forum-topics');
    const topicView = document.getElementById('topic-view');
    
    if (!forumTopics || !topicView) return;
    
    try {
        const response = await fetch(`/api/forum/topics/${topicId}`);
        const data = await response.json();
        
        if (!data.topic) {
            showMessage('Тема не найдена', 'error');
            return;
        }
        
        // Скрываем список тем и показываем просмотр темы
        forumTopics.parentNode.style.display = 'none';
        topicView.style.display = 'block';
        
        // Сохраняем ID темы для добавления комментариев
        topicView.setAttribute('data-topic-id', topicId);
        
        // Заполняем информацию о теме
        topicView.querySelector('.topic-title').textContent = data.topic.title;
        topicView.querySelector('.topic-author').textContent = `Автор: ${data.topic.user.username}`;
        topicView.querySelector('.topic-date').textContent = `Дата: ${new Date(data.topic.createdAt).toLocaleString()}`;
        topicView.querySelector('.topic-views').textContent = `Просмотры: ${data.topic.viewCount}`;
        topicView.querySelector('.topic-content').innerHTML = data.topic.content;
        
        // Отображаем комментарии
        displayComments(data.comments);
        
        // Если тема закрыта, блокируем добавление комментариев
        const addCommentForm = document.querySelector('.add-comment-form');
        if (data.topic.isClosed) {
            addCommentForm.style.display = 'none';
            topicView.querySelector('.topic-comments').insertAdjacentHTML(
                'beforeend', 
                '<p class="topic-closed-message">Тема закрыта для комментариев</p>'
            );
        } else {
            addCommentForm.style.display = 'block';
            const closedMessage = topicView.querySelector('.topic-closed-message');
            if (closedMessage) {
                closedMessage.remove();
            }
        }
        
        // Очищаем поле комментария
        document.getElementById('comment-content').value = '';
        
    } catch (error) {
        console.error('Ошибка при загрузке темы:', error);
        showMessage('Ошибка при загрузке темы', 'error');
    }
}

// Отображение комментариев
function displayComments(comments) {
    const commentsList = document.querySelector('.comments-list');
    if (!commentsList) return;
    
    commentsList.innerHTML = '';
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">Нет комментариев. Будьте первым, кто оставит комментарий!</p>';
        return;
    }
    
    comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment-item';
        
        const avatarContent = comment.user.avatarUrl 
            ? `<img src="${comment.user.avatarUrl}" alt="${comment.user.username}">`
            : comment.user.username.charAt(0).toUpperCase();
        
        const avatarClass = comment.user.avatarUrl ? 'has-avatar' : '';
        
       commentElement.innerHTML = `
    <div class="comment-header">
        <div class="comment-author">
            <div class="comment-avatar ${avatarClass}">${avatarContent}</div>
            <div>
                <div class="comment-author-name">${comment.user.username}</div>
                <div class="comment-author-level">Уровень: ${comment.user.level || 1}</div>
            </div>
        </div>
        <div class="comment-date">${new Date(comment.createdAt).toLocaleString()}</div>
    </div>
    <div class="comment-content">${comment.content}</div>
   
    ${comment.replies && comment.replies.length > 0 ? 
        `<div class="replies-container"></div>` : ''}
`;
        
        commentsList.appendChild(commentElement);
        commentElement.querySelectorAll('.reply-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const commentId = this.getAttribute('data-comment-id');
        showReplyForm(commentId);
    });
});
        
    });
}




// Создание новой темы
async function createTopic(title, content) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      showMessage('Необходимо войти в систему', 'error');
      return;
    }
    
    // Получаем и обрабатываем теги
    const tagsInput = document.getElementById('topic-tags').value;
    const tags = tagsInput.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    const response = await fetch('/api/forum/topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content, tags }) // Убедитесь, что tags передаются
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Ошибка при создании темы');
    }
    
    // Закрываем модальное окно
    document.getElementById('create-topic-modal').style.display = 'none';
    
    // Очищаем форму
    document.getElementById('topic-title').value = '';
    document.getElementById('topic-content').value = '';
    document.getElementById('topic-tags').value = '';
    
    // Показываем сообщение об успехе
    showMessage('Тема успешно создана', 'success');
    
    // Перезагружаем список тем
    loadTopics();
  } catch (error) {
    console.error('Ошибка при создании темы:', error);
    showMessage(error.message || 'Ошибка при создании темы', 'error');
  }
}

// Добавление комментария
async function addComment(topicId, content) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('Необходимо войти в систему', 'error');
            return;
        }
        
        const response = await fetch(`/api/forum/topics/${topicId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка при добавлении комментария');
        }
        
        // Очищаем поле комментария
        document.getElementById('comment-content').value = '';
        
        // Показываем сообщение об успехе
        showMessage('Комментарий успешно добавлен', 'success');
        
        // Обновляем список комментариев
        viewTopic(topicId);
        
    } catch (error) {
        console.error('Ошибка при добавлении комментария:', error);
        showMessage(error.message || 'Ошибка при добавлении комментария', 'error');
    }
}

// Функция для поиска тем
async function searchTopics(query) {
    const forumTopics = document.querySelector('.forum-topics');
    if (!forumTopics) return;
    
    if (!query.trim()) {
        loadTopics();
        return;
    }
    
    try {
        const response = await fetch(`/api/forum/search?query=${encodeURIComponent(query)}`);
        const topics = await response.json();
        
        // Очищаем контейнер
        forumTopics.innerHTML = '';
        
        if (topics.length === 0) {
            forumTopics.innerHTML = `<p class="no-topics">По запросу "${query}" ничего не найдено</p>`;
            return;
        }
        
        // Добавляем найденные темы в список
        topics.forEach(topic => {
            const topicElement = createTopicElement(topic);
            forumTopics.appendChild(topicElement);
        });
        
        // Добавляем информацию о результатах поиска
        forumTopics.insertAdjacentHTML('afterbegin', 
            `<div class="search-results-info">
                <p>Результаты поиска по запросу: "${query}"</p>
                <button class="pixel-btn clear-search-btn">
                    <i class="fas fa-times"></i> Сбросить поиск
                </button>
            </div>`
        );
        
        // Добавляем обработчик для кнопки сброса поиска
        document.querySelector('.clear-search-btn').addEventListener('click', function() {
            document.getElementById('forum-search').value = '';
            loadTopics();
        });
        
    } catch (error) {
        console.error('Ошибка при поиске тем:', error);
        forumTopics.innerHTML = '<p class="error">Ошибка при поиске тем. Пожалуйста, попробуйте позже.</p>';
    }
}
function updateForumStats() {
    // Обновление счетчиков при переходе на страницу форума
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('data-page') === 'forum') {
            link.addEventListener('click', function() {
                loadTopics(); // Перезагружаем темы при каждом переходе на форум
            });
        }
    });
    
    // Слушатель события для обновления при возврате на список тем
    document.querySelector('.back-to-forum')?.addEventListener('click', function() {
        setTimeout(loadTopics, 100); // Небольшая задержка для корректного отображения
    });
}

function initMobileMenu() {
    const navContainer = document.querySelector('.nav-container');
    const logo = document.querySelector('.logo');
    
    // Создаем бургер-меню
    const hamburgerMenu = document.createElement('div');
    hamburgerMenu.className = 'hamburger-menu';
    hamburgerMenu.innerHTML = '<i class="fas fa-bars"></i>';
    
    // Добавляем бургер-меню рядом с логотипом
    logo.appendChild(hamburgerMenu);
    
    // Получаем ссылки навигации
    const navLinks = document.querySelector('.nav-links');
    
    // Добавляем обработчик клика для бургер-меню
    hamburgerMenu.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        
        // Меняем иконку при открытии/закрытии
        const icon = this.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.className = 'fas fa-times';
            document.body.style.overflow = 'hidden'; // Блокируем прокрутку страницы
        } else {
            icon.className = 'fas fa-bars';
            document.body.style.overflow = ''; // Разрешаем прокрутку страницы
        }
    });
    
    // Закрываем меню при клике на ссылку
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('active');
            hamburgerMenu.querySelector('i').className = 'fas fa-bars';
            document.body.style.overflow = ''; // Разрешаем прокрутку страницы
        });
    });
    
    // Закрываем меню при клике на фон
    navLinks.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
            hamburgerMenu.querySelector('i').className = 'fas fa-bars';
            document.body.style.overflow = ''; // Разрешаем прокрутку страницы
        }
    });
}
function updateLoginButton() {
    const loginBtn = document.querySelector('.login-btn');
    if (!loginBtn) return;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentUser) {
        loginBtn.innerHTML = `<i class="fas fa-user pixel-icon"></i> ${currentUser.username}`;
        loginBtn.classList.add('profile-btn');
    } else {
        loginBtn.innerHTML = `<i class="fas fa-key pixel-icon"></i> Войти`;
        loginBtn.classList.remove('profile-btn');
    }
}

// Вызывайте эту функцию при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // ... ваш существующий код ...
    updateLoginButton();
});
// Инициализация при загрузке страницы
// Добавьте эту функцию в конец вашего script.js
function enhanceLessonContent() {
    // Найти блок с текстом урока
    const lessonText = document.querySelector('.lesson-text');
    if (!lessonText) return;
    
    // Автоматически генерируем оглавление для длинных уроков
    const headers = lessonText.querySelectorAll('h3, h4');
    if (headers.length > 2) {
        const toc = document.createElement('div');
        toc.className = 'lesson-toc';
        toc.innerHTML = '<h4>Содержание урока:</h4><ul></ul>';
        
        headers.forEach((header, index) => {
            // Добавляем id к заголовкам, если их нет
            if (!header.id) {
                header.id = `section-${index}`;
            }
            
            const li = document.createElement('li');
            li.innerHTML = `<a href="#${header.id}">${header.textContent}</a>`;
            toc.querySelector('ul').appendChild(li);
            
            // Добавляем обработчик для плавной прокрутки
            li.querySelector('a').addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.getElementById(header.id);
                lessonText.scrollTo({
                    top: target.offsetTop - 20,
                    behavior: 'smooth'
                });
            });
        });
        
        // Вставляем оглавление в начало урока
        lessonText.insertBefore(toc, lessonText.firstChild);
    }
    
    // Добавляем кнопку "Наверх" для длинных уроков
    const scrollTopButton = document.createElement('button');
    scrollTopButton.className = 'scroll-top-btn';
    scrollTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollTopButton.style.display = 'none';
    
    lessonText.appendChild(scrollTopButton);
    
    lessonText.addEventListener('scroll', function() {
        if (this.scrollTop > 200) {
            scrollTopButton.style.display = 'block';
        } else {
            scrollTopButton.style.display = 'none';
        }
    });
    
    scrollTopButton.addEventListener('click', function() {
        lessonText.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Добавляем стили для новых элементов
    const style = document.createElement('style');
    style.textContent = `
        .lesson-toc {
            background-color: rgba(66, 153, 225, 0.1);
            padding: 15px;
            border-radius: var(--border-radius);
            margin-bottom: 20px;
        }
        .lesson-toc ul {
            list-style-type: none;
            padding-left: 15px;
        }
        .lesson-toc li {
            margin: 5px 0;
        }
        .lesson-toc a {
            color: var(--pixel-blue);
            text-decoration: none;
        }
        .lesson-toc a:hover {
            text-decoration: underline;
        }
        .scroll-top-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: var(--pixel-blue);
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            display: none;
            z-index: 100;
        }
        .scroll-top-btn:hover {
            background-color: #3182ce;
        }
    `;
    document.head.appendChild(style);
}
