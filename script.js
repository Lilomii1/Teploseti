/**
 * ============================================================
 * ТЕПЛОСЕТЬ - Полная логика приложения v3.0
 * С РОЛЯМИ, ПЕРИОДОМ ОТЧЕТОВ И АВТОМАТИЧЕСКИМИ ДАТАМИ
 * ============================================================
 */

// ============================================================
// ХРАНИЛИЩЕ ДАННЫХ (localStorage)
// ============================================================
const DB = {
    getUsers() {
        return JSON.parse(localStorage.getItem('teploset_users')) || [];
    },
    setUsers(users) {
        localStorage.setItem('teploset_users', JSON.stringify(users));
    },
    getFacilities() {
        return JSON.parse(localStorage.getItem('teploset_facilities')) || [];
    },
    setFacilities(data) {
        localStorage.setItem('teploset_facilities', JSON.stringify(data));
    },
    getBrigades() {
        return JSON.parse(localStorage.getItem('teploset_brigades')) || [];
    },
    setBrigades(data) {
        localStorage.setItem('teploset_brigades', JSON.stringify(data));
    },
    getTickets() {
        return JSON.parse(localStorage.getItem('teploset_tickets')) || [];
    },
    setTickets(data) {
        localStorage.setItem('teploset_tickets', JSON.stringify(data));
    },
    getSchedule() {
        return JSON.parse(localStorage.getItem('teploset_schedule')) || [];
    },
    setSchedule(data) {
        localStorage.setItem('teploset_schedule', JSON.stringify(data));
    },
    getMaterials() {
        return JSON.parse(localStorage.getItem('teploset_materials')) || [];
    },
    setMaterials(data) {
        localStorage.setItem('teploset_materials', JSON.stringify(data));
    },
    getVehicles() {
        return JSON.parse(localStorage.getItem('teploset_vehicles')) || [];
    },
    setVehicles(data) {
        localStorage.setItem('teploset_vehicles', JSON.stringify(data));
    },
    getDocuments() {
        return JSON.parse(localStorage.getItem('teploset_documents')) || [];
    },
    setDocuments(data) {
        localStorage.setItem('teploset_documents', JSON.stringify(data));
    },
    getCurrentUser() {
        return JSON.parse(localStorage.getItem('teploset_current_user')) || null;
    },
    setCurrentUser(user) {
        localStorage.setItem('teploset_current_user', JSON.stringify(user));
    },
    clear() {
        localStorage.removeItem('teploset_current_user');
    }
};

// ============================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ ПАГИНАЦИИ И СОРТИРОВКИ
// ============================================================
const PAGINATION = {
    facilities: { page: 1, perPage: 10, sort: 'name', order: 'asc' },
    brigades: { page: 1, perPage: 10, sort: 'name', order: 'asc' },
    tickets: { page: 1, perPage: 10, sort: 'date', order: 'desc' },
    materials: { page: 1, perPage: 10, sort: 'name', order: 'asc' }
};

let chartInstances = {};

// ============================================================
// ГЕНЕРАТОР ID
// ============================================================
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ============================================================
// ФОРМАТИРОВАНИЕ ДАТЫ
// ============================================================
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
}

function formatDateShort(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU');
}

// ============================================================
// ОБНОВЛЕНИЕ ДАТЫ В ШАПКЕ
// ============================================================
function updateDateTime() {
    const now = new Date();
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    const el = document.getElementById('currentDate');
    if (el) el.textContent = now.toLocaleDateString('ru-RU', options);
}
updateDateTime();
setInterval(updateDateTime, 60000);

// ============================================================
// TOAST УВЕДОМЛЕНИЯ
// ============================================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.4s ease forwards';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
    toast.onclick = () => {
        toast.remove();
    };
}

// ============================================================
// МОДАЛЬНОЕ ОКНО
// ============================================================
let modalCallback = null;

function showModal(title, message, confirmText = 'Удалить') {
    return new Promise((resolve) => {
        document.getElementById('modalOverlay').style.display = 'flex';
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').textContent = message;
        document.getElementById('modalConfirmBtn').textContent = confirmText;
        modalCallback = resolve;
    });
}

function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    if (modalCallback) {
        modalCallback(false);
        modalCallback = null;
    }
}

document.getElementById('modalConfirmBtn')?.addEventListener('click', function() {
    document.getElementById('modalOverlay').style.display = 'none';
    if (modalCallback) {
        modalCallback(true);
        modalCallback = null;
    }
});

document.getElementById('modalOverlay')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// ============================================================
// ТЕМНАЯ ТЕМА
// ============================================================
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('teploset_theme', newTheme);
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

// Загрузка сохраненной темы
const savedTheme = localStorage.getItem('teploset_theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
if (savedTheme === 'dark') {
    const icon = document.querySelector('#themeToggle i');
    if (icon) icon.className = 'fas fa-sun';
}

// ============================================================
// ВАЛИДАЦИЯ
// ============================================================
function validateForm(fields) {
    for (const [key, value] of Object.entries(fields)) {
        if (!value || value.trim() === '') {
            showToast(`⚠️ Поле "${key}" обязательно для заполнения!`, 'warning');
            return false;
        }
    }
    return true;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ============================================================
// ПОИСК И ФИЛЬТРЫ
// ============================================================
function searchFacilities(query, statusFilter) {
    let data = DB.getFacilities();
    if (query) {
        const q = query.toLowerCase();
        data = data.filter(f => 
            f.name.toLowerCase().includes(q) || 
            f.type.toLowerCase().includes(q) || 
            (f.address || '').toLowerCase().includes(q)
        );
    }
    if (statusFilter && statusFilter !== 'all') {
        data = data.filter(f => f.status === statusFilter);
    }
    return data;
}

function searchTickets(query, statusFilter, priorityFilter) {
    let data = DB.getTickets();
    if (query) {
        const q = query.toLowerCase();
        data = data.filter(t => 
            (t.description || '').toLowerCase().includes(q) ||
            t.type.toLowerCase().includes(q) ||
            t.status.toLowerCase().includes(q)
        );
    }
    if (statusFilter && statusFilter !== 'all') {
        data = data.filter(t => t.status === statusFilter);
    }
    if (priorityFilter && priorityFilter !== 'all') {
        data = data.filter(t => t.priority === priorityFilter);
    }
    return data;
}

function searchMaterials(query) {
    let data = DB.getMaterials();
    if (query) {
        const q = query.toLowerCase();
        data = data.filter(m => m.name.toLowerCase().includes(q));
    }
    return data;
}

function searchBrigades(query) {
    let data = DB.getBrigades();
    if (query) {
        const q = query.toLowerCase();
        data = data.filter(b => 
            b.name.toLowerCase().includes(q) ||
            (b.description || '').toLowerCase().includes(q)
        );
    }
    return data;
}

// ============================================================
// СОРТИРОВКА
// ============================================================
function sortTable(tableName, field) {
    const config = PAGINATION[tableName];
    if (!config) return;
    if (config.sort === field) {
        config.order = config.order === 'asc' ? 'desc' : 'asc';
    } else {
        config.sort = field;
        config.order = 'asc';
    }
    config.page = 1;
    updateSortIcons(tableName, field);
    const loaders = {
        facilities: loadFacilities,
        brigades: loadBrigades,
        tickets: loadTickets,
        materials: loadMaterials
    };
    if (loaders[tableName]) loaders[tableName]();
}

function updateSortIcons(tableName, field) {
    const headers = document.querySelectorAll(`#page-${tableName} .data-table th`);
    headers.forEach(th => {
        const icon = th.querySelector('i');
        if (icon) {
            const sortField = th.dataset.sort;
            if (sortField === field) {
                const config = PAGINATION[tableName];
                icon.className = config.order === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
            } else {
                icon.className = 'fas fa-sort';
            }
        }
    });
}

function sortData(data, field, order) {
    return [...data].sort((a, b) => {
        let valA = a[field] || '';
        let valB = b[field] || '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
    });
}

// ============================================================
// ПАГИНАЦИЯ
// ============================================================
function changePage(tableName, delta) {
    const config = PAGINATION[tableName];
    if (!config) return;
    const newPage = config.page + delta;
    if (newPage < 1) return;
    config.page = newPage;
    const loaders = {
        facilities: loadFacilities,
        brigades: loadBrigades,
        tickets: loadTickets,
        materials: loadMaterials
    };
    if (loaders[tableName]) loaders[tableName]();
}

function renderPagination(tableName, total, page, perPage) {
    const totalPages = Math.ceil(total / perPage) || 1;
    const infoEl = document.getElementById(`${tableName}PaginationInfo`);
    const pageEl = document.getElementById(`${tableName}CurrentPage`);
    const prevBtn = document.getElementById(`${tableName}PrevBtn`);
    const nextBtn = document.getElementById(`${tableName}NextBtn`);
    if (infoEl) {
        const start = (page - 1) * perPage + 1;
        const end = Math.min(page * perPage, total);
        infoEl.textContent = total > 0 ? `Показано ${start}-${end} из ${total}` : 'Нет данных';
    }
    if (pageEl) pageEl.textContent = page;
    if (prevBtn) prevBtn.disabled = page <= 1;
    if (nextBtn) nextBtn.disabled = page >= totalPages;
}

// ============================================================
// АВТОРИЗАЦИЯ
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = DB.getCurrentUser();
    if (currentUser) {
        showApp(currentUser);
    }

    document.getElementById('showRegister')?.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    });

    document.getElementById('showLogin')?.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
    });

    // === ЛОГИН: Пропускаем ВСЕХ, но назначаем роли по логину ===
    document.getElementById('loginBtn')?.addEventListener('click', function() {
        const login = document.getElementById('loginInput').value.trim();
        const password = document.getElementById('passwordInput').value.trim();

        if (!validateForm({ 'Логин': login, 'Пароль': password })) return;

        let users = DB.getUsers();
        
        // Если пользователь уже существует в базе, берем его роль!
        let user = users.find(u => u.login === login);
        if (user) {
            DB.setCurrentUser(user);
            showToast('✅ Добро пожаловать, ' + user.fullName + '!', 'success');
            showApp(user);
            return;
        }

        // Если пользователя нет, создаем нового с определенной ролью
        let role = 'user'; // По умолчанию обычный пользователь

        // ОПРЕДЕЛЯЕМ РОЛЬ НА ОСНОВЕ ЛОГИНА (логины ниже)
        if (login.toLowerCase() === 'admin') {
            role = 'admin';
        } else if (login.toLowerCase() === 'dispetcher') {
            role = 'dispetcher';
        } else if (login.toLowerCase() === 'master') {
            role = 'master';
        } else if (login.toLowerCase() === 'mehanik') {
            role = 'mehanik';
        } else if (login.toLowerCase() === 'rukovoditel') {
            role = 'rukovoditel';
        }

        const newUser = {
            id: generateId(),
            fullName: login,
            login: login,
            email: 'auto@teploset.ru',
            password: password,
            role: role,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        DB.setUsers(users);
        DB.setCurrentUser(newUser);
        showToast('✅ Добро пожаловать, ' + login + '!', 'success');
        showApp(newUser);
    });

    // === РЕГИСТРАЦИЯ ===
    document.getElementById('registerBtn')?.addEventListener('click', function() {
        const fullName = document.getElementById('regFullName').value.trim();
        const login = document.getElementById('regLogin').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value.trim();
        const confirm = document.getElementById('regConfirm').value.trim();

        if (!validateForm({ 'ФИО': fullName, 'Логин': login, 'Email': email, 'Пароль': password, 'Подтверждение': confirm })) return;

        if (password.length < 8) {
            showToast('⚠️ Пароль должен содержать минимум 8 символов!', 'warning');
            return;
        }

        if (password !== confirm) {
            showToast('⚠️ Пароли не совпадают!', 'warning');
            return;
        }

        if (!validateEmail(email)) {
            showToast('⚠️ Введите корректный Email!', 'warning');
            return;
        }

        const users = DB.getUsers();
        if (users.find(u => u.login === login)) {
            showToast('❌ Пользователь с таким логином уже существует!', 'error');
            return;
        }
        if (users.find(u => u.email === email)) {
            showToast('❌ Пользователь с таким Email уже существует!', 'error');
            return;
        }

        const newUser = {
            id: generateId(),
            fullName,
            login,
            email,
            password,
            role: 'user', // Всем новым пользователям даем роль "user"
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        DB.setUsers(users);
        DB.setCurrentUser(newUser);

        showToast('✅ Регистрация успешна!', 'success');
        showApp(newUser);
    });

    document.getElementById('logoutBtn')?.addEventListener('click', function() {
        showModal('Выход', 'Вы уверены, что хотите выйти из системы?', 'Выйти').then(confirmed => {
            if (confirmed) {
                DB.clear();
                showToast('👋 До свидания!', 'info');
                location.reload();
            }
        });
    });

    // === УСТАНОВКА ДАТ ПО УМОЛЧАНИЮ ДЛЯ ОТЧЕТОВ (НАЧАЛО И КОНЕЦ МЕСЯЦА) ===
    setDefaultReportDates();
});

// ============================================================
// ПОКАЗ ПРИЛОЖЕНИЯ (С УПРАВЛЕНИЕМ РОЛЯМИ)
// ============================================================
function showApp(user) {
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('appMain').style.display = 'flex';

    document.getElementById('userName').textContent = user.fullName || user.login;
    document.getElementById('userRole').textContent = user.role || 'user';
    document.getElementById('userAvatar').textContent = (user.fullName || user.login)[0].toUpperCase();

    // === РАЗДЕЛЕНИЕ МЕНЮ ПО РОЛЯМ ===
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const page = item.dataset.page;
        
        // РУКОВОДИТЕЛЬ: Видит всё
        if (user.role === 'rukovoditel') {
            item.style.display = 'flex';
        } 
        // АДМИН: Видит всё
        else if (user.role === 'admin') {
            item.style.display = 'flex';
        } 
        // ДИСПЕТЧЕР: Заявки, График, Объекты, Бригады, Документы
        else if (user.role === 'dispetcher') {
            if (['dashboard', 'tickets', 'schedule', 'facilities', 'brigades', 'documents'].includes(page)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        } 
        // МАСТЕР: Заявки, Объекты, Бригады, Документы
        else if (user.role === 'master') {
            if (['dashboard', 'tickets', 'facilities', 'brigades', 'documents'].includes(page)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        } 
        // МЕХАНИК: Только Склад, Автопарк, График
        else if (user.role === 'mehanik') {
            if (['dashboard', 'warehouse', 'vehicles', 'schedule'].includes(page)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        } 
        // ОБЫЧНЫЙ ПОЛЬЗОВАТЕЛЬ: Только Заявки и Дашборд
        else if (user.role === 'user') {
            if (['dashboard', 'tickets'].includes(page)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        }
    });

    loadAllData();
    initNavigation();
    initForms();
    updateNotifications();
}

// ============================================================
// НАВИГАЦИЯ
// ============================================================
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    const pageTitle = document.getElementById('pageTitle');

    const pageTitles = {
        'dashboard': 'Панель управления',
        'facilities': 'Объекты',
        'brigades': 'Бригады',
        'tickets': 'Заявки',
        'schedule': 'График ППР',
        'warehouse': 'Склад',
        'vehicles': 'Автопарк',
        'documents': 'Документы',
        'reports': 'Отчеты',
        'admin': 'Администрирование'
    };

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            this.classList.add('active');

            const pageId = this.dataset.page;
            pages.forEach(p => p.classList.remove('active'));
            const target = document.getElementById('page-' + pageId);
            if (target) target.classList.add('active');

            if (pageTitle) pageTitle.textContent = pageTitles[pageId] || pageId;

            if (pageId === 'dashboard') {
                setTimeout(updateCharts, 100);
            }

            if (history.pushState) {
                history.pushState(null, '', '#' + pageId);
            }
        });
    });

    if (window.location.hash) {
        const hash = window.location.hash.replace('#', '');
        const target = document.querySelector('.nav-item[data-page="' + hash + '"]');
        if (target) target.click();
    }
}

// ============================================================
// ЗАГРУЗКА ВСЕХ ДАННЫХ
// ============================================================
function loadAllData() {
    loadFacilities();
    loadBrigades();
    loadTickets();
    loadSchedule();
    loadMaterials();
    loadVehicles();
    loadUsers();
    updateDashboard();
    updateReports();
    loadDocuments();
    setTimeout(updateCharts, 300);
}

// ============================================================
// ГРАФИКИ
// ============================================================
function updateCharts() {
    const tickets = DB.getTickets();
    const facilities = DB.getFacilities();

    const statusCtx = document.getElementById('ticketStatusChart');
    if (statusCtx) {
        if (chartInstances.status) chartInstances.status.destroy();
        const statuses = {
            'new': tickets.filter(t => t.status === 'new').length,
            'in_progress': tickets.filter(t => t.status === 'in_progress').length,
            'completed': tickets.filter(t => t.status === 'completed').length,
            'cancelled': tickets.filter(t => t.status === 'cancelled').length
        };
        chartInstances.status = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Новые', 'В работе', 'Завершены', 'Отменены'],
                datasets: [{
                    data: [statuses.new, statuses.in_progress, statuses.completed, statuses.cancelled],
                    backgroundColor: ['#ef4444', '#f59e0b', '#22c55e', '#94a3b8'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 12,
                            font: { size: 11 }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    const facilityCtx = document.getElementById('facilityTypeChart');
    if (facilityCtx) {
        if (chartInstances.facility) chartInstances.facility.destroy();
        const types = {};
        facilities.forEach(f => {
            types[f.type] = (types[f.type] || 0) + 1;
        });
        const colors = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];
        chartInstances.facility = new Chart(facilityCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(types),
                datasets: [{
                    label: 'Объекты',
                    data: Object.values(types),
                    backgroundColor: colors.slice(0, Object.keys(types).length),
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }
}

// ============================================================
// ОБНОВЛЕНИЕ УВЕДОМЛЕНИЙ
// ============================================================
function updateNotifications() {
    const tickets = DB.getTickets();
    const newTickets = tickets.filter(t => t.status === 'new').length;
    const badge = document.getElementById('notifBadge');
    if (badge) {
        badge.textContent = newTickets;
        badge.style.display = newTickets > 0 ? 'inline-block' : 'none';
    }
}

// ============================================================
// ОБНОВЛЕНИЕ ДАШБОРДА
// ============================================================
function updateDashboard() {
    const facilities = DB.getFacilities();
    const brigades = DB.getBrigades();
    const tickets = DB.getTickets();
    const completed = tickets.filter(t => t.status === 'completed').length;

    document.getElementById('statFacilities').textContent = facilities.length;
    document.getElementById('statBrigades').textContent = brigades.length;
    document.getElementById('statTickets').textContent = tickets.length;
    document.getElementById('statDone').textContent = completed;

    const body = document.getElementById('dashboardTicketsBody');
    if (body) {
        const recent = tickets.slice(-5).reverse();
        body.innerHTML = recent.map(t => {
            const facility = facilities.find(f => f.id === t.facilityId);
            const statusMap = {
                'new': '<span class="badge-tag danger">Новая</span>',
                'in_progress': '<span class="badge-tag warning">В работе</span>',
                'completed': '<span class="badge-tag success">Завершена</span>',
                'cancelled': '<span class="badge-tag info">Отменена</span>'
            };
            const priorityMap = {
                'low': '<span class="badge-tag info">Низкий</span>',
                'medium': '<span class="badge-tag warning">Средний</span>',
                'high': '<span class="badge-tag danger">Высокий</span>',
                'critical': '<span class="badge-tag danger">Критический</span>'
            };
            const typeMap = {
                'emergency': '<span class="badge-tag danger">Аварийная</span>',
                'planned': '<span class="badge-tag info">Плановая</span>'
            };
            return `<tr>
                <td>#${t.id.slice(0, 6)}</td>
                <td>${facility ? facility.name : '—'}</td>
                <td>${typeMap[t.type] || t.type}</td>
                <td>${statusMap[t.status] || t.status}</td>
                <td>${priorityMap[t.priority] || t.priority}</td>
                <td>${formatDateShort(t.createdAt)}</td>
            </tr>`;
        }).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--gray-500);padding:20px;">📋 Нет заявок</td></tr>';
    }
}

// ============================================================
// ОБЪЕКТЫ (CRUD + Поиск + Пагинация + Сортировка)
// ============================================================
function loadFacilities() {
    const searchQuery = document.getElementById('facilitySearch')?.value || '';
    const statusFilter = document.getElementById('facilityFilterStatus')?.value || 'all';
    const config = PAGINATION.facilities;
    
    let data = searchFacilities(searchQuery, statusFilter);
    data = sortData(data, config.sort, config.order);
    
    const total = data.length;
    const start = (config.page - 1) * config.perPage;
    const end = Math.min(start + config.perPage, total);
    const pageData = data.slice(start, end);
    
    const body = document.getElementById('facilitiesBody');
    if (!body) return;

    body.innerHTML = pageData.map((item) => `
        <tr>
            <td>${item.name}</td>
            <td>${item.type}</td>
            <td>${item.address || '—'}</td>
            <td><span class="badge-tag ${item.status === 'active' ? 'success' : item.status === 'repair' ? 'warning' : item.status === 'emergency' ? 'danger' : 'info'}">${item.status === 'active' ? 'Работает' : item.status === 'repair' ? 'Ремонт' : item.status === 'emergency' ? 'Авария' : 'Отключен'}</span></td>
            <td>
                <button class="btn-icon" onclick="editFacility('${item.id}')" title="Редактировать"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" onclick="deleteFacility('${item.id}')" title="Удалить"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--gray-500);padding:20px;">🔍 Ничего не найдено</td></tr>';

    renderPagination('facilities', total, config.page, config.perPage);
    updateFacilitySelects();
}

function updateFacilitySelects() {
    const data = DB.getFacilities();
    const selects = ['ticketFacility', 'scheduleFacility'];
    selects.forEach(id => {
        const sel = document.getElementById(id);
        if (sel) {
            sel.innerHTML = data.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
        }
    });
}

function deleteFacility(id) {
    showModal('Удаление объекта', 'Вы уверены, что хотите удалить этот объект?').then(confirmed => {
        if (confirmed) {
            let data = DB.getFacilities();
            data = data.filter(f => f.id !== id);
            DB.setFacilities(data);
            loadFacilities();
            updateDashboard();
            updateReports();
            showToast('✅ Объект удален', 'success');
        }
    });
}

function editFacility(id) {
    const data = DB.getFacilities();
    const item = data.find(f => f.id === id);
    if (!item) return;

    const form = document.getElementById('facilityForm');
    form.style.display = 'block';
    document.getElementById('facilityFormTitle').textContent = '✏️ Редактировать объект';
    document.getElementById('facilityName').value = item.name;
    document.getElementById('facilityType').value = item.type;
    document.getElementById('facilityAddress').value = item.address || '';
    document.getElementById('facilityDate').value = item.date || '';
    document.getElementById('facilityLifespan').value = item.lifespan || 30;
    document.getElementById('facilityStatus').value = item.status;

    const saveBtn = document.getElementById('saveFacilityBtn');
    saveBtn.textContent = '💾 Обновить';
    saveBtn.dataset.editId = id;
}

function saveFacility() {
    const name = document.getElementById('facilityName').value.trim();
    const type = document.getElementById('facilityType').value;
    const address = document.getElementById('facilityAddress').value.trim();
    const date = document.getElementById('facilityDate').value;
    const lifespan = document.getElementById('facilityLifespan').value;
    const status = document.getElementById('facilityStatus').value;

    if (!validateForm({ 'Название': name })) return;

    const data = DB.getFacilities();
    data.push({
        id: generateId(),
        name, type, address, date, lifespan, status,
        createdAt: new Date().toISOString()
    });
    DB.setFacilities(data);
    resetFacilityForm();
    loadFacilities();
    updateDashboard();
    updateReports();
    showToast('✅ Объект добавлен!', 'success');
}

function updateFacility(id) {
    const name = document.getElementById('facilityName').value.trim();
    const type = document.getElementById('facilityType').value;
    const address = document.getElementById('facilityAddress').value.trim();
    const date = document.getElementById('facilityDate').value;
    const lifespan = document.getElementById('facilityLifespan').value;
    const status = document.getElementById('facilityStatus').value;

    if (!validateForm({ 'Название': name })) return;

    let data = DB.getFacilities();
    const index = data.findIndex(f => f.id === id);
    if (index === -1) return;

    data[index] = { ...data[index], name, type, address, date, lifespan, status };
    DB.setFacilities(data);

    resetFacilityForm();
    loadFacilities();
    updateDashboard();
    updateReports();
    showToast('✅ Объект обновлен!', 'success');
}

function resetFacilityForm() {
    document.getElementById('facilityForm').style.display = 'none';
    document.getElementById('facilityFormTitle').textContent = '➕ Добавить объект';
    document.getElementById('facilityName').value = '';
    document.getElementById('facilityAddress').value = '';
    document.getElementById('facilityDate').value = '';
    document.getElementById('facilityLifespan').value = '30';
    document.getElementById('facilityStatus').value = 'active';
    const saveBtn = document.getElementById('saveFacilityBtn');
    saveBtn.textContent = '💾 Сохранить';
    delete saveBtn.dataset.editId;
}

// ============================================================
// БРИГАДЫ (CRUD + Поиск + Пагинация + Сортировка)
// ============================================================
function loadBrigades() {
    const searchQuery = document.getElementById('brigadeSearch')?.value || '';
    const config = PAGINATION.brigades;
    
    let data = searchBrigades(searchQuery);
    data = sortData(data, config.sort, config.order);
    
    const total = data.length;
    const start = (config.page - 1) * config.perPage;
    const end = Math.min(start + config.perPage, total);
    const pageData = data.slice(start, end);
    
    const body = document.getElementById('brigadesBody');
    if (!body) return;

    const tickets = DB.getTickets();

    body.innerHTML = pageData.map((item) => {
        const count = tickets.filter(t => t.brigadeId === item.id).length;
        return `
        <tr>
            <td>${item.name}</td>
            <td>${item.description || '—'}</td>
            <td><span class="badge-tag ${count > 0 ? 'warning' : 'info'}">${count}</span></td>
            <td>
                <button class="btn-icon" onclick="editBrigade('${item.id}')" title="Редактировать"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" onclick="deleteBrigade('${item.id}')" title="Удалить"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `}).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--gray-500);padding:20px;">🔍 Ничего не найдено</td></tr>';

    renderPagination('brigades', total, config.page, config.perPage);
    updateBrigadeSelects();
}

function updateBrigadeSelects() {
    const data = DB.getBrigades();
    const selects = ['ticketBrigade', 'scheduleBrigade'];
    selects.forEach(id => {
        const sel = document.getElementById(id);
        if (sel) {
            sel.innerHTML = data.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
        }
    });
}

function deleteBrigade(id) {
    showModal('Удаление бригады', 'Вы уверены, что хотите удалить эту бригаду?').then(confirmed => {
        if (confirmed) {
            let data = DB.getBrigades();
            data = data.filter(b => b.id !== id);
            DB.setBrigades(data);
            loadBrigades();
            updateDashboard();
            showToast('✅ Бригада удалена', 'success');
        }
    });
}

function editBrigade(id) {
    const data = DB.getBrigades();
    const item = data.find(b => b.id === id);
    if (!item) return;

    const form = document.getElementById('brigadeForm');
    form.style.display = 'block';
    document.getElementById('brigadeName').value = item.name;
    document.getElementById('brigadeDesc').value = item.description || '';

    const saveBtn = document.getElementById('saveBrigadeBtn');
    saveBtn.textContent = '💾 Обновить';
    saveBtn.dataset.editId = id;
}

function saveBrigade() {
    const name = document.getElementById('brigadeName').value.trim();
    const description = document.getElementById('brigadeDesc').value.trim();

    if (!validateForm({ 'Название': name })) return;

    const data = DB.getBrigades();
    data.push({
        id: generateId(),
        name, description,
        createdAt: new Date().toISOString()
    });
    DB.setBrigades(data);
    resetBrigadeForm();
    loadBrigades();
    updateDashboard();
    updateReports();
    showToast('✅ Бригада добавлена!', 'success');
}

function updateBrigade(id) {
    const name = document.getElementById('brigadeName').value.trim();
    const description = document.getElementById('brigadeDesc').value.trim();

    if (!validateForm({ 'Название': name })) return;

    let data = DB.getBrigades();
    const index = data.findIndex(b => b.id === id);
    if (index === -1) return;

    data[index] = { ...data[index], name, description };
    DB.setBrigades(data);

    resetBrigadeForm();
    loadBrigades();
    updateDashboard();
    updateReports();
    showToast('✅ Бригада обновлена!', 'success');
}

function resetBrigadeForm() {
    document.getElementById('brigadeForm').style.display = 'none';
    document.getElementById('brigadeName').value = '';
    document.getElementById('brigadeDesc').value = '';
    const saveBtn = document.getElementById('saveBrigadeBtn');
    saveBtn.textContent = '💾 Сохранить';
    delete saveBtn.dataset.editId;
}

// ============================================================
// ЗАЯВКИ (CRUD + Поиск + Фильтры + Пагинация + Сортировка)
// ============================================================
function loadTickets() {
    const searchQuery = document.getElementById('ticketSearch')?.value || '';
    const statusFilter = document.getElementById('ticketFilterStatus')?.value || 'all';
    const priorityFilter = document.getElementById('ticketFilterPriority')?.value || 'all';
    const config = PAGINATION.tickets;
    
    let data = searchTickets(searchQuery, statusFilter, priorityFilter);
    
    if (config.sort === 'facility') {
        const facilities = DB.getFacilities();
        data = [...data].sort((a, b) => {
            const fa = facilities.find(f => f.id === a.facilityId);
            const fb = facilities.find(f => f.id === b.facilityId);
            const valA = fa ? fa.name : '';
            const valB = fb ? fb.name : '';
            return config.order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        });
    } else if (config.sort === 'brigade') {
        const brigades = DB.getBrigades();
        data = [...data].sort((a, b) => {
            const ba = brigades.find(b => b.id === a.brigadeId);
            const bb = brigades.find(b => b.id === b.brigadeId);
            const valA = ba ? ba.name : '';
            const valB = bb ? bb.name : '';
            return config.order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        });
    } else {
        data = sortData(data, config.sort, config.order);
    }
    
    const total = data.length;
    const start = (config.page - 1) * config.perPage;
    const end = Math.min(start + config.perPage, total);
    const pageData = data.slice(start, end);
    
    const body = document.getElementById('ticketsBody');
    if (!body) return;

    const facilities = DB.getFacilities();
    const brigades = DB.getBrigades();

    const statusMap = {
        'new': '<span class="badge-tag danger">Новая</span>',
        'in_progress': '<span class="badge-tag warning">В работе</span>',
        'completed': '<span class="badge-tag success">Завершена</span>',
        'cancelled': '<span class="badge-tag info">Отменена</span>'
    };
    const priorityMap = {
        'low': '<span class="badge-tag info">Низкий</span>',
        'medium': '<span class="badge-tag warning">Средний</span>',
        'high': '<span class="badge-tag danger">Высокий</span>',
        'critical': '<span class="badge-tag danger">Критический</span>'
    };
    const typeMap = {
        'emergency': '<span class="badge-tag danger">Аварийная</span>',
        'planned': '<span class="badge-tag info">Плановая</span>'
    };

    body.innerHTML = pageData.map(item => {
        const facility = facilities.find(f => f.id === item.facilityId);
        const brigade = brigades.find(b => b.id === item.brigadeId);
        return `
        <tr>
            <td>#${item.id.slice(0, 6)}</td>
            <td>${facility ? facility.name : '—'}</td>
            <td>${typeMap[item.type] || item.type}</td>
            <td>${statusMap[item.status] || item.status}</td>
            <td>${priorityMap[item.priority] || item.priority}</td>
            <td>${brigade ? brigade.name : '—'}</td>
            <td>${formatDateShort(item.createdAt)}</td>
            <td>
                <button class="btn-icon" onclick="editTicket('${item.id}')" title="Редактировать"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" onclick="changeTicketStatus('${item.id}', 'in_progress')" title="В работу"><i class="fas fa-play"></i></button>
                <button class="btn-icon" onclick="changeTicketStatus('${item.id}', 'completed')" title="Завершить"><i class="fas fa-check"></i></button>
                <button class="btn-icon" onclick="deleteTicket('${item.id}')" title="Удалить"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `}).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--gray-500);padding:20px;">🔍 Ничего не найдено</td></tr>';

    renderPagination('tickets', total, config.page, config.perPage);
    updateNotifications();
}

function changeTicketStatus(id, status) {
    let data = DB.getTickets();
    const item = data.find(t => t.id === id);
    if (item) {
        item.status = status;
        if (status === 'completed') {
            item.completedAt = new Date().toISOString();
        }
        DB.setTickets(data);
        loadTickets();
        updateDashboard();
        showToast(`✅ Статус заявки изменен на "${status}"`, 'success');
    }
}

function deleteTicket(id) {
    showModal('Удаление заявки', 'Вы уверены, что хотите удалить эту заявку?').then(confirmed => {
        if (confirmed) {
            let data = DB.getTickets();
            data = data.filter(t => t.id !== id);
            DB.setTickets(data);
            loadTickets();
            updateDashboard();
            showToast('✅ Заявка удалена', 'success');
        }
    });
}

function editTicket(id) {
    const data = DB.getTickets();
    const item = data.find(t => t.id === id);
    if (!item) return;

    const form = document.getElementById('ticketForm');
    form.style.display = 'block';
    document.getElementById('ticketType').value = item.type;
    document.getElementById('ticketFacility').value = item.facilityId;
    document.getElementById('ticketBrigade').value = item.brigadeId || '';
    document.getElementById('ticketPriority').value = item.priority;
    document.getElementById('ticketDesc').value = item.description || '';

    updateFacilitySelects();
    updateBrigadeSelects();

    const saveBtn = document.getElementById('saveTicketBtn');
    saveBtn.textContent = '💾 Обновить';
    saveBtn.dataset.editId = id;
}

function saveTicket() {
    const type = document.getElementById('ticketType').value;
    const facilityId = document.getElementById('ticketFacility').value;
    const brigadeId = document.getElementById('ticketBrigade').value;
    const priority = document.getElementById('ticketPriority').value;
    const description = document.getElementById('ticketDesc').value.trim();

    if (!validateForm({ 'Объект': facilityId })) return;

    const data = DB.getTickets();
    data.push({
        id: generateId(),
        type, facilityId, brigadeId, priority,
        description,
        status: 'new',
        createdAt: new Date().toISOString()
    });
    DB.setTickets(data);
    resetTicketForm();
    loadTickets();
    updateDashboard();
    updateReports();
    updateNotifications();
    showToast('✅ Заявка создана!', 'success');
}

function updateTicket(id) {
    const type = document.getElementById('ticketType').value;
    const facilityId = document.getElementById('ticketFacility').value;
    const brigadeId = document.getElementById('ticketBrigade').value;
    const priority = document.getElementById('ticketPriority').value;
    const description = document.getElementById('ticketDesc').value.trim();

    if (!validateForm({ 'Объект': facilityId })) return;

    let data = DB.getTickets();
    const index = data.findIndex(t => t.id === id);
    if (index === -1) return;

    data[index] = { ...data[index], type, facilityId, brigadeId, priority, description };
    DB.setTickets(data);

    resetTicketForm();
    loadTickets();
    updateDashboard();
    updateReports();
    showToast('✅ Заявка обновлена!', 'success');
}

function resetTicketForm() {
    document.getElementById('ticketForm').style.display = 'none';
    document.getElementById('ticketDesc').value = '';
    const saveBtn = document.getElementById('saveTicketBtn');
    saveBtn.textContent = '💾 Сохранить';
    delete saveBtn.dataset.editId;
}

// ============================================================
// ГРАФИК ППР (CRUD)
// ============================================================
function loadSchedule() {
    const data = DB.getSchedule();
    const body = document.getElementById('scheduleBody');
    if (!body) return;

    const facilities = DB.getFacilities();
    const brigades = DB.getBrigades();

    body.innerHTML = data.map((item, index) => {
        const facility = facilities.find(f => f.id === item.facilityId);
        const brigade = brigades.find(b => b.id === item.brigadeId);
        return `
        <tr>
            <td>${index + 1}</td>
            <td>${facility ? facility.name : '—'}</td>
            <td>${brigade ? brigade.name : '—'}</td>
            <td>${formatDateShort(item.start)}</td>
            <td>${formatDateShort(item.end)}</td>
            <td>${item.description || '—'}</td>
            <td>
                <button class="btn-icon" onclick="deleteSchedule('${item.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `}).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--gray-500);padding:20px;">📋 Нет записей</td></tr>';
}

function deleteSchedule(id) {
    showModal('Удаление записи', 'Вы уверены, что хотите удалить эту запись?').then(confirmed => {
        if (confirmed) {
            let data = DB.getSchedule();
            data = data.filter(s => s.id !== id);
            DB.setSchedule(data);
            loadSchedule();
            showToast('✅ Запись удалена', 'success');
        }
    });
}

function saveSchedule() {
    const facilityId = document.getElementById('scheduleFacility').value;
    const brigadeId = document.getElementById('scheduleBrigade').value;
    const start = document.getElementById('scheduleStart').value;
    const end = document.getElementById('scheduleEnd').value;
    const description = document.getElementById('scheduleDesc').value.trim();

    if (!validateForm({ 'Объект': facilityId, 'Дата начала': start, 'Дата окончания': end })) return;

    const data = DB.getSchedule();
    data.push({
        id: generateId(),
        facilityId, brigadeId, start, end, description,
        createdAt: new Date().toISOString()
    });
    DB.setSchedule(data);
    document.getElementById('scheduleForm').style.display = 'none';
    document.getElementById('scheduleDesc').value = '';
    loadSchedule();
    showToast('✅ Запись добавлена в график!', 'success');
}

// ============================================================
// СКЛАД (CRUD + Поиск + Пагинация + Сортировка)
// ============================================================
function loadMaterials() {
    const searchQuery = document.getElementById('materialSearch')?.value || '';
    const config = PAGINATION.materials;
    
    let data = searchMaterials(searchQuery);
    data = sortData(data, config.sort, config.order);
    
    const total = data.length;
    const start = (config.page - 1) * config.perPage;
    const end = Math.min(start + config.perPage, total);
    const pageData = data.slice(start, end);
    
    const body = document.getElementById('materialsBody');
    if (!body) return;

    body.innerHTML = pageData.map((item) => {
        const status = item.quantity <= item.minStock ? 'Критический' : 'Достаточно';
        const statusClass = item.quantity <= item.minStock ? 'danger' : 'success';
        return `
        <tr>
            <td>${item.name}</td>
            <td>${item.unit}</td>
            <td>${item.quantity}</td>
            <td>${item.minStock}</td>
            <td><span class="badge-tag ${statusClass}">${status}</span></td>
            <td>
                <button class="btn-icon" onclick="editMaterial('${item.id}')" title="Редактировать"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" onclick="deleteMaterial('${item.id}')" title="Удалить"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `}).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--gray-500);padding:20px;">🔍 Ничего не найдено</td></tr>';

    renderPagination('materials', total, config.page, config.perPage);
}

function deleteMaterial(id) {
    showModal('Удаление материала', 'Вы уверены, что хотите удалить этот материал?').then(confirmed => {
        if (confirmed) {
            let data = DB.getMaterials();
            data = data.filter(m => m.id !== id);
            DB.setMaterials(data);
            loadMaterials();
            showToast('✅ Материал удален', 'success');
        }
    });
}

function editMaterial(id) {
    const data = DB.getMaterials();
    const item = data.find(m => m.id === id);
    if (!item) return;

    const form = document.getElementById('materialForm');
    form.style.display = 'block';
    document.getElementById('materialName').value = item.name;
    document.getElementById('materialUnit').value = item.unit;
    document.getElementById('materialQty').value = item.quantity;
    document.getElementById('materialMin').value = item.minStock;

    const saveBtn = document.getElementById('saveMaterialBtn');
    saveBtn.textContent = '💾 Обновить';
    saveBtn.dataset.editId = id;
}

function saveMaterial() {
    const name = document.getElementById('materialName').value.trim();
    const unit = document.getElementById('materialUnit').value;
    const quantity = parseFloat(document.getElementById('materialQty').value) || 0;
    const minStock = parseFloat(document.getElementById('materialMin').value) || 10;

    if (!validateForm({ 'Наименование': name })) return;

    const data = DB.getMaterials();
    data.push({
        id: generateId(),
        name, unit, quantity, minStock,
        createdAt: new Date().toISOString()
    });
    DB.setMaterials(data);
    resetMaterialForm();
    loadMaterials();
    showToast('✅ Материал добавлен!', 'success');
}

function updateMaterial(id) {
    const name = document.getElementById('materialName').value.trim();
    const unit = document.getElementById('materialUnit').value;
    const quantity = parseFloat(document.getElementById('materialQty').value) || 0;
    const minStock = parseFloat(document.getElementById('materialMin').value) || 10;

    if (!validateForm({ 'Наименование': name })) return;

    let data = DB.getMaterials();
    const index = data.findIndex(m => m.id === id);
    if (index === -1) return;

    data[index] = { ...data[index], name, unit, quantity, minStock };
    DB.setMaterials(data);

    resetMaterialForm();
    loadMaterials();
    showToast('✅ Материал обновлен!', 'success');
}

function resetMaterialForm() {
    document.getElementById('materialForm').style.display = 'none';
    document.getElementById('materialName').value = '';
    document.getElementById('materialQty').value = '0';
    document.getElementById('materialMin').value = '10';
    const saveBtn = document.getElementById('saveMaterialBtn');
    saveBtn.textContent = '💾 Сохранить';
    delete saveBtn.dataset.editId;
}

// ============================================================
// АВТОПАРК (CRUD)
// ============================================================
function loadVehicles() {
    const data = DB.getVehicles();
    const body = document.getElementById('vehiclesBody');
    if (!body) return;

    const statusMap = {
        'free': '<span class="badge-tag success">Свободен</span>',
        'working': '<span class="badge-tag warning">На выезде</span>',
        'repair': '<span class="badge-tag danger">В ремонте</span>'
    };

    body.innerHTML = data.map((item) => `
        <tr>
            <td>${item.type}</td>
            <td>${item.model || '—'}</td>
            <td>${item.plate || '—'}</td>
            <td>${statusMap[item.status] || item.status}</td>
            <td>
                <button class="btn-icon" onclick="editVehicle('${item.id}')" title="Редактировать"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" onclick="deleteVehicle('${item.id}')" title="Удалить"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--gray-500);padding:20px;">🚗 Нет техники</td></tr>';
}

function deleteVehicle(id) {
    showModal('Удаление техники', 'Вы уверены, что хотите удалить эту технику?').then(confirmed => {
        if (confirmed) {
            let data = DB.getVehicles();
            data = data.filter(v => v.id !== id);
            DB.setVehicles(data);
            loadVehicles();
            showToast('✅ Техника удалена', 'success');
        }
    });
}

function editVehicle(id) {
    const data = DB.getVehicles();
    const item = data.find(v => v.id === id);
    if (!item) return;

    const form = document.getElementById('vehicleForm');
    form.style.display = 'block';
    document.getElementById('vehicleType').value = item.type;
    document.getElementById('vehicleModel').value = item.model || '';
    document.getElementById('vehiclePlate').value = item.plate || '';
    document.getElementById('vehicleStatus').value = item.status;

    const saveBtn = document.getElementById('saveVehicleBtn');
    saveBtn.textContent = '💾 Обновить';
    saveBtn.dataset.editId = id;
}

function saveVehicle() {
    const type = document.getElementById('vehicleType').value;
    const model = document.getElementById('vehicleModel').value.trim();
    const plate = document.getElementById('vehiclePlate').value.trim();
    const status = document.getElementById('vehicleStatus').value;

    if (!validateForm({ 'Гос. номер': plate })) return;

    const data = DB.getVehicles();
    data.push({
        id: generateId(),
        type, model, plate, status,
        createdAt: new Date().toISOString()
    });
    DB.setVehicles(data);
    resetVehicleForm();
    loadVehicles();
    showToast('✅ Техника добавлена!', 'success');
}

function updateVehicle(id) {
    const type = document.getElementById('vehicleType').value;
    const model = document.getElementById('vehicleModel').value.trim();
    const plate = document.getElementById('vehiclePlate').value.trim();
    const status = document.getElementById('vehicleStatus').value;

    if (!validateForm({ 'Гос. номер': plate })) return;

    let data = DB.getVehicles();
    const index = data.findIndex(v => v.id === id);
    if (index === -1) return;

    data[index] = { ...data[index], type, model, plate, status };
    DB.setVehicles(data);

    resetVehicleForm();
    loadVehicles();
    showToast('✅ Техника обновлена!', 'success');
}

function resetVehicleForm() {
    document.getElementById('vehicleForm').style.display = 'none';
    document.getElementById('vehicleModel').value = '';
    document.getElementById('vehiclePlate').value = '';
    const saveBtn = document.getElementById('saveVehicleBtn');
    saveBtn.textContent = '💾 Сохранить';
    delete saveBtn.dataset.editId;
}

// ============================================================
// ПОЛЬЗОВАТЕЛИ (CRUD)
// ============================================================
function loadUsers() {
    const data = DB.getUsers();
    const body = document.getElementById('usersBody');
    if (!body) return;

    body.innerHTML = data.map(user => `
        <tr>
            <td>${user.fullName}</td>
            <td>${user.login}</td>
            <td>${user.email || '—'}</td>
            <td>${user.role}</td>
            <td>
                <button class="btn-icon" onclick="deleteUser('${user.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--gray-500);padding:20px;">👤 Нет пользователей</td></tr>';
}

function deleteUser(id) {
    showModal('Удаление пользователя', 'Вы уверены, что хотите удалить этого пользователя?').then(confirmed => {
        if (confirmed) {
            let data = DB.getUsers();
            const current = DB.getCurrentUser();
            if (current && current.id === id) {
                showToast('❌ Нельзя удалить себя!', 'error');
                return;
            }
            data = data.filter(u => u.id !== id);
            DB.setUsers(data);
            loadUsers();
            showToast('✅ Пользователь удален', 'success');
        }
    });
}

function saveUser() {
    const fullName = document.getElementById('userFullName').value.trim();
    const login = document.getElementById('userLogin').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const role = document.getElementById('userRole').value;
    const password = document.getElementById('userPassword').value.trim();

    if (!validateForm({ 'ФИО': fullName, 'Логин': login, 'Email': email, 'Пароль': password })) return;

    if (password.length < 8) {
        showToast('⚠️ Пароль должен содержать минимум 8 символов!', 'warning');
        return;
    }

    if (!validateEmail(email)) {
        showToast('⚠️ Введите корректный Email!', 'warning');
        return;
    }

    const users = DB.getUsers();
    if (users.find(u => u.login === login)) {
        showToast('❌ Пользователь с таким логином уже существует!', 'error');
        return;
    }
    if (users.find(u => u.email === email)) {
        showToast('❌ Пользователь с таким Email уже существует!', 'error');
        return;
    }

    users.push({
        id: generateId(),
        fullName, login, email, password, role,
        createdAt: new Date().toISOString()
    });
    DB.setUsers(users);
    document.getElementById('userForm').style.display = 'none';
    document.getElementById('userFullName').value = '';
    document.getElementById('userLogin').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('userPassword').value = '';
    loadUsers();
    showToast('✅ Пользователь добавлен!', 'success');
}

// ============================================================
// ОТЧЕТЫ
// ============================================================
function updateReports() {
    const facilities = DB.getFacilities();
    const tickets = DB.getTickets();
    const brigades = DB.getBrigades();

    const reportFac = document.getElementById('reportFacilities');
    if (reportFac) {
        const types = {};
        facilities.forEach(f => {
            types[f.type] = (types[f.type] || 0) + 1;
        });
        reportFac.innerHTML = Object.entries(types).map(([key, val]) =>
            `<div class="report-stat-item"><span class="label">${key}</span><span class="value">${val}</span></div>`
        ).join('') || '<div class="report-stat-item"><span class="label">Нет данных</span></div>';
    }

    const reportTic = document.getElementById('reportTickets');
    if (reportTic) {
        const statuses = {};
        tickets.forEach(t => {
            statuses[t.status] = (statuses[t.status] || 0) + 1;
        });
        const statusMap = {
            'new': 'Новые',
            'in_progress': 'В работе',
            'completed': 'Завершены',
            'cancelled': 'Отменены'
        };
        reportTic.innerHTML = Object.entries(statuses).map(([key, val]) =>
            `<div class="report-stat-item"><span class="label">${statusMap[key] || key}</span><span class="value">${val}</span></div>`
        ).join('') || '<div class="report-stat-item"><span class="label">Нет данных</span></div>';
    }

    const reportBr = document.getElementById('reportBrigades');
    if (reportBr) {
        const counts = {};
        brigades.forEach(b => {
            counts[b.name] = tickets.filter(t => t.brigadeId === b.id).length;
        });
        reportBr.innerHTML = Object.entries(counts).map(([key, val]) =>
            `<div class="report-stat-item"><span class="label">${key}</span><span class="value">${val} заявок</span></div>`
        ).join('') || '<div class="report-stat-item"><span class="label">Нет данных</span></div>';
    }
}

// ============================================================
// ВЫБОР ПЕРИОДА ДЛЯ ОТЧЕТОВ
// ============================================================
function setDefaultReportDates() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const formatDateInput = (date) => {
        return date.toISOString().split('T')[0];
    };

    const startInput = document.getElementById('reportStartDate');
    const endInput = document.getElementById('reportEndDate');

    if (startInput && !startInput.value) {
        startInput.value = formatDateInput(firstDay);
    }
    if (endInput && !endInput.value) {
        endInput.value = formatDateInput(lastDay);
    }
    
    if (startInput.value && endInput.value) {
        applyReportPeriod();
    }
}

function applyReportPeriod() {
    const startDate = document.getElementById('reportStartDate')?.value;
    const endDate = document.getElementById('reportEndDate')?.value;
    
    if (!startDate || !endDate) {
        showToast('⚠️ Пожалуйста, выберите начальную и конечную даты!', 'warning');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showToast('⚠️ Дата начала не может быть позже даты окончания!', 'warning');
        return;
    }
    
    showToast(`✅ Период установлен: ${formatDateShort(startDate)} — ${formatDateShort(endDate)}`, 'success');
    loadReportsData();
}

function getFilteredData() {
    const startDate = document.getElementById('reportStartDate')?.value;
    const endDate = document.getElementById('reportEndDate')?.value;

    const allTickets = DB.getTickets();
    const allFacilities = DB.getFacilities();
    const allBrigades = DB.getBrigades();
    const allMaterials = DB.getMaterials();
    const allVehicles = DB.getVehicles();
    const allSchedule = DB.getSchedule();

    let filteredTickets = allTickets;
    let filteredFacilities = allFacilities;
    let filteredBrigades = allBrigades;
    let filteredMaterials = allMaterials;
    let filteredVehicles = allVehicles;
    let filteredSchedule = allSchedule;

    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        filteredTickets = allTickets.filter(t => {
            const ticketDate = new Date(t.createdAt);
            return ticketDate >= start && ticketDate <= end;
        });
        
        filteredSchedule = allSchedule.filter(s => {
            const scheduleDate = new Date(s.start);
            return scheduleDate >= start && scheduleDate <= end;
        });
    }

    return {
        facilities: filteredFacilities,
        brigades: filteredBrigades,
        tickets: filteredTickets,
        materials: filteredMaterials,
        vehicles: filteredVehicles,
        schedule: filteredSchedule
    };
}

function loadReportsData() {
    const data = getFilteredData();
    
    const reportFac = document.getElementById('reportFacilities');
    if (reportFac) {
        const types = {};
        data.facilities.forEach(f => {
            types[f.type] = (types[f.type] || 0) + 1;
        });
        reportFac.innerHTML = Object.entries(types).map(([key, val]) =>
            `<div class="report-stat-item"><span class="label">${key}</span><span class="value">${val}</span></div>`
        ).join('') || '<div class="report-stat-item"><span class="label">Нет данных</span></div>';
    }

    const reportTic = document.getElementById('reportTickets');
    if (reportTic) {
        const statuses = {};
        data.tickets.forEach(t => {
            statuses[t.status] = (statuses[t.status] || 0) + 1;
        });
        const statusMap = {
            'new': 'Новые',
            'in_progress': 'В работе',
            'completed': 'Завершены',
            'cancelled': 'Отменены'
        };
        reportTic.innerHTML = Object.entries(statuses).map(([key, val]) =>
            `<div class="report-stat-item"><span class="label">${statusMap[key] || key}</span><span class="value">${val}</span></div>`
        ).join('') || '<div class="report-stat-item"><span class="label">Нет данных</span></div>';
    }

    const reportBr = document.getElementById('reportBrigades');
    if (reportBr) {
        const counts = {};
        data.brigades.forEach(b => {
            counts[b.name] = data.tickets.filter(t => t.brigadeId === b.id).length;
        });
        reportBr.innerHTML = Object.entries(counts).map(([key, val]) =>
            `<div class="report-stat-item"><span class="label">${key}</span><span class="value">${val} заявок</span></div>`
        ).join('') || '<div class="report-stat-item"><span class="label">Нет данных</span></div>';
    }
}

// ============================================================
// ЭКСПОРТЫ (Excel, Word, PDF) С ВЫБОРОМ ПЕРИОДА
// ============================================================
function exportToExcel() {
    const data = getFilteredData();
    const facilities = data.facilities;
    const brigades = data.brigades;
    const tickets = data.tickets;
    const materials = data.materials;
    const vehicles = data.vehicles;
    const schedule = data.schedule;

    const wb = XLSX.utils.book_new();

    const facData = facilities.map((f, i) => ({ '№': i+1, 'Название': f.name, 'Тип': f.type, 'Адрес': f.address || '', 'Статус': f.status }));
    const ws1 = XLSX.utils.json_to_sheet(facData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Объекты');

    const brData = brigades.map((b, i) => ({ '№': i+1, 'Название': b.name, 'Описание': b.description || '' }));
    const ws2 = XLSX.utils.json_to_sheet(brData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Бригады');

    const facilitiesMap = Object.fromEntries(facilities.map(f => [f.id, f.name]));
    const brigadesMap = Object.fromEntries(brigades.map(b => [b.id, b.name]));
    const ticData = tickets.map((t, i) => ({
        '№': i+1,
        'Объект': facilitiesMap[t.facilityId] || '—',
        'Тип': t.type === 'emergency' ? 'Аварийная' : 'Плановая',
        'Статус': t.status,
        'Приоритет': t.priority,
        'Бригада': brigadesMap[t.brigadeId] || '—',
        'Дата': formatDateShort(t.createdAt)
    }));
    const ws3 = XLSX.utils.json_to_sheet(ticData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Заявки');

    const matData = materials.map((m, i) => ({ '№': i+1, 'Наименование': m.name, 'Ед.изм': m.unit, 'Кол-во': m.quantity, 'Мин.остаток': m.minStock }));
    const ws4 = XLSX.utils.json_to_sheet(matData);
    XLSX.utils.book_append_sheet(wb, ws4, 'Склад');

    const vehData = vehicles.map((v, i) => ({ '№': i+1, 'Тип': v.type, 'Модель': v.model || '', 'Гос.номер': v.plate || '', 'Статус': v.status }));
    const ws5 = XLSX.utils.json_to_sheet(vehData);
    XLSX.utils.book_append_sheet(wb, ws5, 'Автопарк');

    const schedData = schedule.map((s, i) => ({
        '№': i+1,
        'Объект': facilitiesMap[s.facilityId] || '—',
        'Бригада': brigadesMap[s.brigadeId] || '—',
        'Начало': formatDateShort(s.start),
        'Окончание': formatDateShort(s.end),
        'Описание': s.description || ''
    }));
    const ws6 = XLSX.utils.json_to_sheet(schedData);
    XLSX.utils.book_append_sheet(wb, ws6, 'График ППР');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `Теплосеть_отчет_${new Date().toISOString().slice(0,10)}.xlsx`;
    
    saveDocument(fileName, 'Excel', wbout, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);

    showToast('✅ Excel файл успешно создан!', 'success');
}

function exportToWord() {
    const data = getFilteredData();
    const facilities = data.facilities;
    const brigades = data.brigades;
    const tickets = data.tickets;

    let html = `
    <html>
    <head><meta charset="UTF-8"><title>Отчет Теплосеть</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1e293b; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th { background: #2563eb; color: white; padding: 8px; text-align: left; }
        td { padding: 8px; border: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        .footer { margin-top: 40px; color: #94a3b8; font-size: 12px; text-align: center; }
    </style>
    </head>
    <body>
        <h1>📋 Отчет по системе "Теплосеть"</h1>
        <p>Дата: ${new Date().toLocaleString('ru-RU')}</p>
    `;

    const startDate = document.getElementById('reportStartDate')?.value;
    const endDate = document.getElementById('reportEndDate')?.value;
    if (startDate && endDate) {
        html += `<p><strong>Период:</strong> ${formatDateShort(startDate)} — ${formatDateShort(endDate)}</p>`;
    } else {
        html += `<p><strong>Период:</strong> За все время</p>`;
    }

    html += `<h2>🏗️ Объекты (${facilities.length})</h2><table><tr><th>№</th><th>Название</th><th>Тип</th><th>Адрес</th><th>Статус</th></tr>`;
    facilities.forEach((f, i) => {
        html += `<tr><td>${i+1}</td><td>${f.name}</td><td>${f.type}</td><td>${f.address || '—'}</td><td>${f.status}</td></tr>`;
    });
    html += `</table>`;

    html += `<h2>👷 Бригады (${brigades.length})</h2><table><tr><th>№</th><th>Название</th><th>Описание</th></tr>`;
    brigades.forEach((b, i) => {
        html += `<tr><td>${i+1}</td><td>${b.name}</td><td>${b.description || '—'}</td></tr>`;
    });
    html += `</table>`;

    html += `<h2>📋 Заявки (${tickets.length})</h2><table><tr><th>№</th><th>Объект</th><th>Тип</th><th>Статус</th><th>Приоритет</th></tr>`;
    const facilitiesMap = Object.fromEntries(facilities.map(f => [f.id, f.name]));
    tickets.slice(-10).forEach((t, i) => {
        html += `<tr><td>${i+1}</td><td>${facilitiesMap[t.facilityId] || '—'}</td><td>${t.type}</td><td>${t.status}</td><td>${t.priority}</td></tr>`;
    });
    html += `</table>`;

    html += `
        <div class="footer">Сгенерировано в системе "Теплосеть" • ${new Date().toLocaleString('ru-RU')}</div>
    </body></html>`;

    const blob = new Blob([html], { type: 'application/msword' });
    const fileName = `Теплосеть_отчет_${new Date().toISOString().slice(0,10)}.doc`;
    
    saveDocument(fileName, 'Word', html, 'application/msword');

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);

    showToast('✅ Word файл успешно создан!', 'success');
}

function exportToPDF() {
    const data = getFilteredData();
    const facilities = data.facilities;
    const brigades = data.brigades;
    const tickets = data.tickets;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235);
    doc.text('Отчет по системе "Теплосеть"', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Дата: ${new Date().toLocaleString('ru-RU')}`, 14, 28);

    const startDate = document.getElementById('reportStartDate')?.value;
    const endDate = document.getElementById('reportEndDate')?.value;
    if (startDate && endDate) {
        doc.text(`Период: ${formatDateShort(startDate)} — ${formatDateShort(endDate)}`, 14, 34);
    } else {
        doc.text(`Период: За все время`, 14, 34);
    }

    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(`Объекты (${facilities.length})`, 14, 44);

    const facData = facilities.map((f, i) => [i+1, f.name, f.type, f.address || '—', f.status]);
    doc.autoTable({
        startY: 48,
        head: [['№', 'Название', 'Тип', 'Адрес', 'Статус']],
        body: facData,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] }
    });

    let y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text(`Бригады (${brigades.length})`, 14, y);
    
    const brData = brigades.map((b, i) => [i+1, b.name, b.description || '—']);
    doc.autoTable({
        startY: y + 4,
        head: [['№', 'Название', 'Описание']],
        body: brData,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] }
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text(`Последние заявки`, 14, y);
    
    const facilitiesMap = Object.fromEntries(facilities.map(f => [f.id, f.name]));
    const ticData = tickets.slice(-10).map((t, i) => [
        i+1,
        facilitiesMap[t.facilityId] || '—',
        t.type === 'emergency' ? 'Аварийная' : 'Плановая',
        t.status,
        t.priority
    ]);
    doc.autoTable({
        startY: y + 4,
        head: [['№', 'Объект', 'Тип', 'Статус', 'Приоритет']],
        body: ticData,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] }
    });

    const pdfOutput = doc.output('arraybuffer');
    const fileName = `Теплосеть_отчет_${new Date().toISOString().slice(0,10)}.pdf`;
    
    saveDocument(fileName, 'PDF', pdfOutput, 'application/pdf');

    doc.save(fileName);
    showToast('✅ PDF файл успешно создан!', 'success');
}

// ============================================================
// ДОКУМЕНТЫ
// ============================================================
function loadDocuments() {
    const data = DB.getDocuments();
    const body = document.getElementById('documentsBody');
    if (!body) return;

    body.innerHTML = data.map(doc => `
        <tr>
            <td>${doc.name}</td>
            <td>${doc.type}</td>
            <td>${formatDateShort(doc.createdAt)}</td>
            <td>
                <button class="btn-icon" onclick="downloadDocument('${doc.id}')" title="Скачать"><i class="fas fa-download"></i></button>
                <button class="btn-icon" onclick="deleteDocument('${doc.id}')" title="Удалить"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--gray-500);padding:20px;">📄 Нет документов</td></tr>';
}

function deleteDocument(id) {
    showModal('Удаление документа', 'Вы уверены, что хотите удалить этот документ?').then(confirmed => {
        if (confirmed) {
            let data = DB.getDocuments();
            data = data.filter(d => d.id !== id);
            DB.setDocuments(data);
            loadDocuments();
            showToast('✅ Документ удален', 'success');
        }
    });
}

function downloadDocument(id) {
    const data = DB.getDocuments();
    const doc = data.find(d => d.id === id);
    if (doc && doc.content) {
        const blob = new Blob([doc.content], { type: doc.mimeType || 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        a.click();
        URL.revokeObjectURL(url);
        showToast('📥 Скачивание началось', 'info');
    } else {
        showToast('❌ Документ не найден', 'error');
    }
}

function saveDocument(name, type, content, mimeType) {
    const docs = DB.getDocuments();
    const doc = {
        id: generateId(),
        name: name,
        type: type,
        content: content,
        mimeType: mimeType,
        createdAt: new Date().toISOString()
    };
    docs.push(doc);
    DB.setDocuments(docs);
    loadDocuments();
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ ФОРМ
// ============================================================
function initForms() {
    // ---- Объекты ----
    document.getElementById('addFacilityBtn')?.addEventListener('click', function() {
        const form = document.getElementById('facilityForm');
        if (form.style.display === 'none' || !form.style.display) {
            form.style.display = 'block';
            document.getElementById('facilityFormTitle').textContent = '➕ Добавить объект';
            const saveBtn = document.getElementById('saveFacilityBtn');
            if (!saveBtn.dataset.editId) {
                document.getElementById('facilityName').value = '';
                document.getElementById('facilityAddress').value = '';
                document.getElementById('facilityDate').value = '';
                document.getElementById('facilityLifespan').value = '30';
                document.getElementById('facilityStatus').value = 'active';
            }
        } else {
            form.style.display = 'none';
        }
    });
    document.getElementById('cancelFacilityBtn')?.addEventListener('click', resetFacilityForm);
    document.getElementById('saveFacilityBtn')?.addEventListener('click', function() {
        const editId = this.dataset.editId;
        if (editId) {
            updateFacility(editId);
        } else {
            saveFacility();
        }
    });

    // ---- Бригады ----
    document.getElementById('addBrigadeBtn')?.addEventListener('click', function() {
        const form = document.getElementById('brigadeForm');
        if (form.style.display === 'none' || !form.style.display) {
            form.style.display = 'block';
            const saveBtn = document.getElementById('saveBrigadeBtn');
            if (!saveBtn.dataset.editId) {
                document.getElementById('brigadeName').value = '';
                document.getElementById('brigadeDesc').value = '';
            }
        } else {
            form.style.display = 'none';
        }
    });
    document.getElementById('cancelBrigadeBtn')?.addEventListener('click', resetBrigadeForm);
    document.getElementById('saveBrigadeBtn')?.addEventListener('click', function() {
        const editId = this.dataset.editId;
        if (editId) {
            updateBrigade(editId);
        } else {
            saveBrigade();
        }
    });

    // ---- Заявки ----
    document.getElementById('addTicketBtn')?.addEventListener('click', function() {
        const form = document.getElementById('ticketForm');
        if (form.style.display === 'none' || !form.style.display) {
            form.style.display = 'block';
            updateFacilitySelects();
            updateBrigadeSelects();
            const saveBtn = document.getElementById('saveTicketBtn');
            if (!saveBtn.dataset.editId) {
                document.getElementById('ticketDesc').value = '';
                document.getElementById('ticketType').value = 'emergency';
                document.getElementById('ticketPriority').value = 'medium';
            }
        } else {
            form.style.display = 'none';
        }
    });
    document.getElementById('cancelTicketBtn')?.addEventListener('click', resetTicketForm);
    document.getElementById('saveTicketBtn')?.addEventListener('click', function() {
        const editId = this.dataset.editId;
        if (editId) {
            updateTicket(editId);
        } else {
            saveTicket();
        }
    });

    // ---- График ППР ----
    document.getElementById('addScheduleBtn')?.addEventListener('click', function() {
        const form = document.getElementById('scheduleForm');
        if (form.style.display === 'none' || !form.style.display) {
            form.style.display = 'block';
            updateFacilitySelects();
            updateBrigadeSelects();
            document.getElementById('scheduleDesc').value = '';
            document.getElementById('scheduleStart').value = '';
            document.getElementById('scheduleEnd').value = '';
        } else {
            form.style.display = 'none';
        }
    });
    document.getElementById('cancelScheduleBtn')?.addEventListener('click', function() {
        document.getElementById('scheduleForm').style.display = 'none';
    });
    document.getElementById('saveScheduleBtn')?.addEventListener('click', saveSchedule);

    // ---- Склад ----
    document.getElementById('addMaterialBtn')?.addEventListener('click', function() {
        const form = document.getElementById('materialForm');
        if (form.style.display === 'none' || !form.style.display) {
            form.style.display = 'block';
            const saveBtn = document.getElementById('saveMaterialBtn');
            if (!saveBtn.dataset.editId) {
                document.getElementById('materialName').value = '';
                document.getElementById('materialQty').value = '0';
                document.getElementById('materialMin').value = '10';
                document.getElementById('materialUnit').value = 'м';
            }
        } else {
            form.style.display = 'none';
        }
    });
    document.getElementById('cancelMaterialBtn')?.addEventListener('click', resetMaterialForm);
    document.getElementById('saveMaterialBtn')?.addEventListener('click', function() {
        const editId = this.dataset.editId;
        if (editId) {
            updateMaterial(editId);
        } else {
            saveMaterial();
        }
    });

    // ---- Автопарк ----
    document.getElementById('addVehicleBtn')?.addEventListener('click', function() {
        const form = document.getElementById('vehicleForm');
        if (form.style.display === 'none' || !form.style.display) {
            form.style.display = 'block';
            const saveBtn = document.getElementById('saveVehicleBtn');
            if (!saveBtn.dataset.editId) {
                document.getElementById('vehicleModel').value = '';
                document.getElementById('vehiclePlate').value = '';
                document.getElementById('vehicleType').value = 'Экскаватор';
                document.getElementById('vehicleStatus').value = 'free';
            }
        } else {
            form.style.display = 'none';
        }
    });
    document.getElementById('cancelVehicleBtn')?.addEventListener('click', resetVehicleForm);
    document.getElementById('saveVehicleBtn')?.addEventListener('click', function() {
        const editId = this.dataset.editId;
        if (editId) {
            updateVehicle(editId);
        } else {
            saveVehicle();
        }
    });

    // ---- Пользователи ----
    document.getElementById('addUserBtn')?.addEventListener('click', function() {
        const form = document.getElementById('userForm');
        if (form.style.display === 'none' || !form.style.display) {
            form.style.display = 'block';
            document.getElementById('userFullName').value = '';
            document.getElementById('userLogin').value = '';
            document.getElementById('userEmail').value = '';
            document.getElementById('userPassword').value = '';
            document.getElementById('userRole').value = 'admin';
        } else {
            form.style.display = 'none';
        }
    });
    document.getElementById('cancelUserBtn')?.addEventListener('click', function() {
        document.getElementById('userForm').style.display = 'none';
    });
    document.getElementById('saveUserBtn')?.addEventListener('click', saveUser);

    // ---- Экспорт ----
    document.getElementById('exportFacilitiesBtn')?.addEventListener('click', exportToExcel);
    document.getElementById('exportBrigadesBtn')?.addEventListener('click', exportToExcel);
    document.getElementById('exportTicketsBtn')?.addEventListener('click', exportToExcel);
    document.getElementById('exportScheduleBtn')?.addEventListener('click', exportToExcel);
    document.getElementById('exportMaterialsBtn')?.addEventListener('click', exportToExcel);
    document.getElementById('exportVehiclesBtn')?.addEventListener('click', exportToExcel);
}

// ============================================================
// ЗАГРУЗКА ПРИ СТАРТЕ
// ============================================================
console.log('🏭 Теплосеть - Система управления теплосетями');
console.log('📊 Версия: 3.0.0');
console.log('✅ Приложение загружено успешно!');
console.log('📦 Добавлены: поиск, фильтры, пагинация, сортировка, графики, темная тема');
console.log('🔒 Регистрация без выбора роли - всем новым пользователям назначается роль "user"');