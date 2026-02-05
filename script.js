// ===== КОНСТАНТЫ И ПЕРЕМЕННЫЕ =====
const CURRENCIES = ['USD', 'EUR', 'KRW', 'VND', 'RUB', 'MBT', 'BIF', 'CRC', 'PAB', 'ADA'];
const DEFAULT_SITES = ['Продакшн', 'Стейджинг', 'Тестовый'];
const MAX_SITES = 6;
const MAX_PRODUCT_IDS = 8;

// Состояние приложения
let state = {
    isReadOnly: false,
    completed: false,
    formData: {},
    notifications: []
};

// ===== DOM ЭЛЕМЕНТЫ =====
const elements = {
    form: document.getElementById('smokeForm'),
    backBtn: document.getElementById('backBtn'),
    menuBtn: document.getElementById('menuBtn'),
    closeMenu: document.getElementById('closeMenu'),
    burgerMenu: document.getElementById('burgerMenu'),
    menuOverlay: document.getElementById('menuOverlay'),
    
    // Динамические поля
    productIdsContainer: document.getElementById('productIdsContainer'),
    addProductIdBtn: document.getElementById('addProductIdBtn'),
    
    // Условные поля
    defaultBets: document.getElementById('defaultBets'),
    defaultBetsStatusContainer: document.getElementById('defaultBetsStatusContainer'),
    defaultBetsStatus: document.getElementById('defaultBetsStatus'),
    
    minBetsChecked: document.getElementById('minBetsChecked'),
    minBetsStatusContainer: document.getElementById('minBetsStatusContainer'),
    minBetsStatus: document.getElementById('minBetsStatus'),
    addedToTaskContainer: document.getElementById('addedToTaskContainer'),
    addedToTask: document.getElementById('addedToTask'),
    
    notifyManager: document.getElementById('notifyManager'),
    managerResponseContainer: document.getElementById('managerResponseContainer'),
    managerResponse: document.getElementById('managerResponse'),
    
    // Валютные секции
    desktopSitesContainer: document.getElementById('desktopSitesContainer'),
    mobileSitesContainer: document.getElementById('mobileSitesContainer'),
    addDesktopSiteBtn: document.getElementById('addDesktopSiteBtn'),
    addMobileSiteBtn: document.getElementById('addMobileSiteBtn'),
    
    // Конвертируемая валюта
    convertibleCurrency: document.getElementById('convertibleCurrency'),
    convertibleCurrencyStatus: document.getElementById('convertibleCurrencyStatus'),
    
    // Валидация
    ticket: document.getElementById('ticket'),
    ticketValidation: document.getElementById('ticketValidation'),
    
    // Кнопки
    submitBtn: document.getElementById('submitBtn'),
    
    // Модальные окна
    confirmModal: document.getElementById('confirmModal'),
    confirmYesBtn: document.getElementById('confirmYesBtn'),
    confirmNoBtn: document.getElementById('confirmNoBtn'),
    
    // Уведомления
    successNotification: document.getElementById('successNotification'),
    closeNotificationBtn: document.getElementById('closeNotificationBtn'),
    errorContainer: document.getElementById('errorContainer'),
    toastContainer: document.getElementById('toastContainer')
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
function init() {
    console.log('🚀 Инициализация Smoke Test Tool...');
    
    // Восстановление состояния
    loadState();
    
    // Инициализация динамических полей
    initProductIds();
    initCurrencySelects();
    initSiteSections();
    
    // Настройка слушателей событий
    setupEventListeners();
    
    // Проверка состояния readonly
    if (state.isReadOnly) {
        enableReadOnlyMode();
    }
    
    console.log('✅ Приложение инициализировано');
}

// ===== СОХРАНЕНИЕ СОСТОЯНИЯ =====
function saveState() {
    try {
        const formData = collectFormData();
        state.formData = formData;
        localStorage.setItem('smokeTestState', JSON.stringify(state));
    } catch (error) {
        console.error('Ошибка сохранения состояния:', error);
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem('smokeTestState');
        if (saved) {
            const parsed = JSON.parse(saved);
            state = { ...state, ...parsed };
            
            // Восстанавливаем данные формы
            if (state.formData && !state.completed) {
                restoreFormData(state.formData);
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки состояния:', error);
    }
}

function collectFormData() {
    const data = {};
    
    // Собираем все данные формы
    const formElements = elements.form.elements;
    for (let element of formElements) {
        if (element.name || element.id) {
            const key = element.id || element.name;
            if (element.type === 'checkbox') {
                data[key] = element.checked;
            } else if (element.type === 'select-multiple') {
                data[key] = Array.from(element.selectedOptions).map(opt => opt.value);
            } else {
                data[key] = element.value;
            }
        }
    }
    
    // Добавляем динамические данные
    data.productIds = getProductIds();
    data.desktopSites = getSitesData('desktop');
    data.mobileSites = getSitesData('mobile');
    
    return data;
}

function restoreFormData(data) {
    // Восстанавливаем простые поля
    for (const [key, value] of Object.entries(data)) {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = value;
            } else {
                element.value = value;
            }
        }
    }
    
    // Восстанавливаем динамические поля
    if (data.productIds) {
        restoreProductIds(data.productIds);
    }
    
    // Обновляем условные поля
    updateConditionalFields();
}

// ===== ДИНАМИЧЕСКИЕ ПОЛЯ ID ПРОДУКТА =====
function initProductIds() {
    // Добавляем первое поле
    addProductIdField();
    
    // Настраиваем кнопку добавления
    elements.addProductIdBtn.addEventListener('click', () => {
        if (getProductIdsCount() < MAX_PRODUCT_IDS) {
            addProductIdField();
        }
    });
}

function addProductIdField(value = '') {
    const count = getProductIdsCount();
    if (count >= MAX_PRODUCT_IDS) return;
    
    const field = document.createElement('div');
    field.className = 'id-field';
    field.innerHTML = `
        <input type="text" class="product-id" placeholder="ID продукта" value="${value}">
        ${count > 0 ? '<button type="button" class="remove-btn"><i class="fas fa-times"></i></button>' : ''}
    `;
    
    elements.productIdsContainer.appendChild(field);
    
    // Настраиваем удаление
    const removeBtn = field.querySelector('.remove-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            field.remove();
            updateProductIdsUI();
        });
    }
    
    // Слушатель для автосохранения
    const input = field.querySelector('.product-id');
    input.addEventListener('input', saveState);
    
    updateProductIdsUI();
}

function getProductIds() {
    const inputs = elements.productIdsContainer.querySelectorAll('.product-id');
    return Array.from(inputs).map(input => input.value.trim()).filter(id => id);
}

function getProductIdsCount() {
    return elements.productIdsContainer.querySelectorAll('.product-id').length;
}

function updateProductIdsUI() {
    const count = getProductIdsCount();
    elements.addProductIdBtn.disabled = count >= MAX_PRODUCT_IDS;
    elements.addProductIdBtn.innerHTML = count >= MAX_PRODUCT_IDS 
        ? `<i class="fas fa-ban"></i> Максимум ${MAX_PRODUCT_IDS} ID`
        : `<i class="fas fa-plus"></i> Добавить ID (${count}/${MAX_PRODUCT_IDS})`;
}

function restoreProductIds(ids) {
    // Очищаем существующие поля
    elements.productIdsContainer.innerHTML = '';
    
    // Добавляем поля с сохраненными значениями
    if (ids && ids.length > 0) {
        ids.forEach(id => addProductIdField(id));
    } else {
        addProductIdField();
    }
}

// ===== ВЫПАДАЮЩИЕ СПИСКИ ВАЛЮТ =====
function initCurrencySelects() {
    // Заполняем выпадающие списки валют
    fillCurrencySelect(elements.convertibleCurrency);
    
    // Настраиваем интерактивную валюту
    elements.convertibleCurrency.addEventListener('change', function() {
        if (this.value) {
            this.classList.add('has-value');
            // Сбрасываем статус при смене валюты
            elements.convertibleCurrencyStatus.textContent = '🔴';
            elements.convertibleCurrencyStatus.dataset.checked = 'false';
            saveState();
        }
    });
    
    // Настраиваем клик по статусу
    elements.convertibleCurrencyStatus.addEventListener('click', function() {
        if (!elements.convertibleCurrency.value) {
            showToast('Сначала выберите валюту', 'warning');
            return;
        }
        
        const isChecked = this.dataset.checked === 'true';
        const currency = elements.convertibleCurrency.value;
        
        if (isChecked) {
            // Подтверждение отмены
            if (confirm(`Отменить проверку ${currency}?`)) {
                this.textContent = '🔴';
                this.dataset.checked = 'false';
                showToast(`${currency} CHECK CANCEL`, 'warning');
                saveState();
            }
        } else {
            // Проверка валюты
            this.textContent = '🟢';
            this.dataset.checked = 'true';
            showToast(`${currency} CHECK`, 'success');
            saveState();
        }
    });
}

function fillCurrencySelect(selectElement) {
    CURRENCIES.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency;
        option.textContent = currency;
        selectElement.appendChild(option);
    });
}

// ===== САЙТЫ И ВАЛЮТЫ =====
function initSiteSections() {
    // Инициализируем обе секции
    initSiteSection('desktop');
    initSiteSection('mobile');
    
    // Настраиваем кнопки добавления
    elements.addDesktopSiteBtn.addEventListener('click', () => addSite('desktop'));
    elements.addMobileSiteBtn.addEventListener('click', () => addSite('mobile'));
}

function initSiteSection(section) {
    const container = section === 'desktop' 
        ? elements.desktopSitesContainer 
        : elements.mobileSitesContainer;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Добавляем 3 сайта по умолчанию
    for (let i = 0; i < 3; i++) {
        addSite(section, DEFAULT_SITES[i]);
    }
    
    updateAddSiteButtons();
}

function addSite(section, presetSite = '') {
    const container = section === 'desktop' 
        ? elements.desktopSitesContainer 
        : elements.mobileSitesContainer;
    
    const siteCount = container.querySelectorAll('.site-row').length;
    if (siteCount >= MAX_SITES) return;
    
    const siteRow = document.createElement('div');
    siteRow.className = 'site-row';
    siteRow.dataset.index = siteCount;
    
    const siteName = presetSite || `Сайт ${siteCount + 1}`;
    
    siteRow.innerHTML = `
        <div class="site-header">
            <select class="site-select">
                <option value="">-- Выберите сайт --</option>
                ${DEFAULT_SITES.map(site => 
                    `<option value="${site}" ${site === siteName ? 'selected' : ''}>${site}</option>`
                ).join('')}
                <option value="Другой сайт 4">Другой сайт 4</option>
                <option value="Другой сайт 5">Другой сайт 5</option>
                <option value="Другой сайт 6">Другой сайт 6</option>
            </select>
            ${siteCount >= 3 ? '<button type="button" class="site-remove"><i class="fas fa-times"></i></button>' : ''}
        </div>
        <div class="currencies-row">
            ${[1, 2, 3].map(i => `
                <div class="currency-field">
                    <select class="currency-select">
                        <option value="">-- Выберите --</option>
                        ${CURRENCIES.map(currency => 
                            `<option value="${currency}">${currency}</option>`
                        ).join('')}
                    </select>
                    <div class="currency-status" data-checked="false">🔴</div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.appendChild(siteRow);
    
    // Настраиваем удаление сайта (только для добавленных)
    const removeBtn = siteRow.querySelector('.site-remove');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            siteRow.remove();
            updateAddSiteButtons();
            saveState();
        });
    }
    
    // Настраиваем выбор валют
    const currencySelects = siteRow.querySelectorAll('.currency-select');
    currencySelects.forEach(select => {
        select.addEventListener('change', function() {
            if (this.value) {
                // Сбрасываем статус при смене валюты
                const status = this.nextElementSibling;
                status.textContent = '🔴';
                status.dataset.checked = 'false';
                saveState();
            }
        });
    });
    
    // Настраиваем клик по статусу валюты
    const currencyStatuses = siteRow.querySelectorAll('.currency-status');
    currencyStatuses.forEach(status => {
        status.addEventListener('click', function() {
            const select = this.previousElementSibling;
            if (!select.value) {
                showToast('Сначала выберите валюту', 'warning');
                return;
            }
            
            const isChecked = this.dataset.checked === 'true';
            const currency = select.value;
            
            if (isChecked) {
                // Подтверждение отмены
                if (confirm(`Отменить проверку ${currency}?`)) {
                    this.textContent = '🔴';
                    this.dataset.checked = 'false';
                    showToast(`${currency} CHECK CANCEL`, 'warning');
                    saveState();
                }
            } else {
                // Проверка валюты
                this.textContent = '🟢';
                this.dataset.checked = 'true';
                showToast(`${currency} CHECK`, 'success');
                saveState();
            }
        });
    });
    
    // Слушатели для автосохранения
    siteRow.querySelector('.site-select').addEventListener('change', saveState);
    currencySelects.forEach(select => select.addEventListener('change', saveState));
    
    updateAddSiteButtons();
    saveState();
}

function getSitesData(section) {
    const container = section === 'desktop' 
        ? elements.desktopSitesContainer 
        : elements.mobileSitesContainer;
    
    const sites = [];
    const siteRows = container.querySelectorAll('.site-row');
    
    siteRows.forEach(row => {
        const siteSelect = row.querySelector('.site-select');
        const currencySelects = row.querySelectorAll('.currency-select');
        const currencyStatuses = row.querySelectorAll('.currency-status');
        
        const currencies = Array.from(currencySelects).map((select, index) => ({
            currency: select.value,
            checked: currencyStatuses[index].dataset.checked === 'true'
        })).filter(c => c.currency); // Фильтруем пустые
        
        if (siteSelect.value) {
            sites.push({
                site: siteSelect.value,
                currencies: currencies
            });
        }
    });
    
    return sites;
}

function updateAddSiteButtons() {
    const desktopCount = elements.desktopSitesContainer.querySelectorAll('.site-row').length;
    const mobileCount = elements.mobileSitesContainer.querySelectorAll('.site-row').length;
    
    elements.addDesktopSiteBtn.disabled = desktopCount >= MAX_SITES;
    elements.addMobileSiteBtn.disabled = mobileCount >= MAX_SITES;
    
    elements.addDesktopSiteBtn.innerHTML = desktopCount >= MAX_SITES
        ? `<i class="fas fa-ban"></i> Максимум ${MAX_SITES} сайтов`
        : `<i class="fas fa-plus"></i> Добавить сайт (${desktopCount}/${MAX_SITES})`;
    
    elements.addMobileSiteBtn.innerHTML = mobileCount >= MAX_SITES
        ? `<i class="fas fa-ban"></i> Максимум ${MAX_SITES} сайтов`
        : `<i class="fas fa-plus"></i> Добавить сайт (${mobileCount}/${MAX_SITES})`;
}

// ===== УСЛОВНЫЕ ПОЛЯ =====
function updateConditionalFields() {
    // Дефолтные ставки
    const showDefaultStatus = elements.defaultBets.value === 'checked';
    toggleElement(elements.defaultBetsStatusContainer, showDefaultStatus);
    if (showDefaultStatus) {
        elements.defaultBetsStatus.required = true;
    }
    
    // Минимальные ставки
    const showMinStatus = elements.minBetsChecked.checked;
    toggleElement(elements.minBetsStatusContainer, showMinStatus);
    if (showMinStatus) {
        elements.minBetsStatus.required = true;
    }
    
    // Добавил в задачу
    const showAddedToTask = showMinStatus && 
        ['exceptions', 'bug'].includes(elements.minBetsStatus.value);
    toggleElement(elements.addedToTaskContainer, showAddedToTask);
    if (showAddedToTask) {
        elements.addedToTask.required = true;
    }
    
    // Ответ менеджеру
    const showManagerResponse = elements.notifyManager.value === 'yes';
    toggleElement(elements.managerResponseContainer, showManagerResponse);
    if (showManagerResponse) {
        elements.managerResponse.required = true;
    }
}

function toggleElement(element, show) {
    if (show) {
        element.style.display = 'block';
        element.classList.add('visible');
    } else {
        element.style.display = 'none';
        element.classList.remove('visible');
        // Очищаем значение при скрытии
        const input = element.querySelector('input, select, textarea');
        if (input) {
            input.value = '';
            input.required = false;
        }
    }
}

// ===== ВАЛИДАЦИЯ =====
function validateForm() {
    const errors = [];
    
    // Обязательные поля
    const requiredFields = [
        { id: 'product', name: 'Продукт' },
        { id: 'game', name: 'Игра' },
        { id: 'freespins', name: 'Фриспины' },
        { id: 'ticket', name: 'Тикет' },
        { id: 'defaultBets', name: 'Дефолтные ставки' },
        { id: 'notifyManager', name: 'Писать менеджеру?' },
        { id: 'convertibleCurrency', name: 'Конвертируемая валюта' }
    ];
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element.value && element.required !== false) {
            errors.push(`Заполните поле "${field.name}"`);
        }
    });
    
    // Проверка ID продукта
    const productIds = getProductIds();
    if (productIds.length === 0) {
        errors.push('Добавьте хотя бы один ID продукта');
    }
    
    // Проверка чекбоксов
    if (!elements.quantityChecked.checked) {
        errors.push('Отметьте "Количество продуктов проверено"');
    }
    
    if (!elements.minBetsChecked.checked) {
        errors.push('Отметьте "Минимальные ставки проверены"');
    }
    
    // Проверка тикета (только цифры)
    if (elements.ticket.value && !/^\d+$/.test(elements.ticket.value)) {
        errors.push('Тикет должен содержать только цифры');
    }
    
    // Проверка конвертируемой валюты
    if (elements.convertibleCurrency.value && 
        elements.convertibleCurrencyStatus.dataset.checked !== 'true') {
        errors.push('Конвертируемая валюта должна быть проверена (🟢)');
    }
    
    // Проверка условных полей
    if (elements.defaultBets.value === 'checked' && !elements.defaultBetsStatus.value) {
        errors.push('Выберите статус для дефолтных ставок');
    }
    
    if (elements.minBetsChecked.checked && !elements.minBetsStatus.value) {
        errors.push('Выберите статус для минимальных ставок');
    }
    
    if (elements.minBetsStatus.value && ['exceptions', 'bug'].includes(elements.minBetsStatus.value) &&
        !elements.addedToTask.checked) {
        errors.push('Отметьте "Добавил в задачу"');
    }
    
    if (elements.notifyManager.value === 'yes' && !elements.managerResponse.value) {
        errors.push('Выберите ответ для менеджера');
    }
    
    return errors;
}

function showErrors(errors) {
    if (errors.length === 0) {
        elements.errorContainer.style.display = 'none';
        return;
    }
    
    const errorList = errors.map(error => `<li>${error}</li>`).join('');
    
    elements.errorContainer.innerHTML = `
        <div class="error-header">
            <i class="fas fa-exclamation-triangle"></i>
            <h4>НЕ ВСЕ ПОЛЯ ЗАПОЛНЕНЫ</h4>
        </div>
        <ul class="error-list">${errorList}</ul>
        <button type="button" class="btn-fix-errors" id="fixErrorsBtn">
            Исправить ошибки
        </button>
    `;
    
    elements.errorContainer.style.display = 'block';
    
    // Настраиваем кнопку исправления
    document.getElementById('fixErrorsBtn').addEventListener('click', () => {
        const firstErrorField = document.querySelector('[id="' + errors[0].match(/"(.*?)"/)[1] + '"]');
        if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstErrorField.focus();
        }
    });
}

// ===== СОБЫТИЯ =====
function setupEventListeners() {
    // Навигация
    elements.backBtn.addEventListener('click', () => {
        if (confirm('Вернуться на главную? Несохраненные данные будут потеряны.')) {
            window.location.href = '/';
        }
    });
    
    elements.menuBtn.addEventListener('click', () => {
        elements.burgerMenu.classList.add('active');
        elements.menuOverlay.classList.add('active');
    });
    
    elements.closeMenu.addEventListener('click', closeMenu);
    elements.menuOverlay.addEventListener('click', closeMenu);
    
    // Валидация тикета
    elements.ticket.addEventListener('input', function() {
        const value = this.value;
        if (!/^\d*$/.test(value)) {
            this.value = value.replace(/\D/g, '');
        }
        
        if (this.value) {
            elements.ticketValidation.textContent = '✓ Корректный номер тикета';
            elements.ticketValidation.className = 'validation-message valid';
        } else {
            elements.ticketValidation.textContent = '';
        }
        
        saveState();
    });
    
    // Условные поля
    elements.defaultBets.addEventListener('change', function() {
        updateConditionalFields();
        saveState();
    });
    
    elements.minBetsChecked.addEventListener('change', function() {
        updateConditionalFields();
        saveState();
    });
    
    elements.minBetsStatus.addEventListener('change', function() {
        updateConditionalFields();
        saveState();
    });
    
    elements.notifyManager.addEventListener('change', function() {
        updateConditionalFields();
        saveState();
    });
    
    // Автосохранение при изменении полей
    const autoSaveElements = [
        'product', 'game', 'freespins', 'quantityChecked',
        'defaultBetsStatus', 'managerResponse'
    ];
    
    autoSaveElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', saveState);
        }
    });
    
    // Кнопка завершения
    elements.submitBtn.addEventListener('click', () => {
        const errors = validateForm();
        if (errors.length > 0) {
            showErrors(errors);
            elements.submitBtn.scrollIntoView({ behavior: 'smooth' });
        } else {
            elements.confirmModal.style.display = 'flex';
        }
    });
    
    // Подтверждение завершения
    elements.confirmYesBtn.addEventListener('click', completeForm);
    elements.confirmNoBtn.addEventListener('click', () => {
        elements.confirmModal.style.display = 'none';
    });
    
    // Закрытие уведомления
    elements.closeNotificationBtn.addEventListener('click', () => {
        elements.successNotification.style.display = 'none';
    });
    
    // Закрытие модального окна при клике вне его
    elements.confirmModal.addEventListener('click', (e) => {
        if (e.target === elements.confirmModal) {
            elements.confirmModal.style.display = 'none';
        }
    });
    
    // Сохранение при закрытии страницы
    window.addEventListener('beforeunload', (e) => {
        if (!state.completed) {
            saveState();
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

function closeMenu() {
    elements.burgerMenu.classList.remove('active');
    elements.menuOverlay.classList.remove('active');
}

// ===== ЗАВЕРШЕНИЕ ФОРМЫ =====
function completeForm() {
    console.log('✅ Завершение формы...');
    
    // Сохраняем финальное состояние
    state.completed = true;
    state.formData = collectFormData();
    state.formData.completedAt = new Date().toISOString();
    saveState();
    
    // Закрываем модальное окно
    elements.confirmModal.style.display = 'none';
    
    // Включаем режим только для чтения
    enableReadOnlyMode();
    
    // Показываем уведомление об успехе
    setTimeout(() => {
        elements.successNotification.style.display = 'flex';
    }, 300);
    
    console.log('🎉 Форма успешно завершена!');
}

function enableReadOnlyMode() {
    state.isReadOnly = true;
    elements.form.classList.add('readonly');
    
    // Скрываем кнопку отправки
    elements.submitBtn.style.display = 'none';
    
    // Добавляем кнопки редактирования и печати
    const actionButtons = document.querySelector('.action-buttons');
    actionButtons.innerHTML = `
        <div class="edit-actions">
            <button type="button" class="btn-edit" id="editBtn">
                <i class="fas fa-edit"></i> Редактировать
            </button>
            <button type="button" class="btn-print" id="printBtn">
                <i class="fas fa-print"></i> Печать
            </button>
        </div>
    `;
    
    // Настраиваем кнопку редактирования
    document.getElementById('editBtn').addEventListener('click', () => {
        if (confirm('Возобновить редактирование завершенной проверки?')) {
            disableReadOnlyMode();
        }
    });
    
    // Настраиваем кнопку печати
    document.getElementById('printBtn').addEventListener('click', () => {
        window.print();
    });
}

function disableReadOnlyMode() {
    state.isReadOnly = false;
    state.completed = false;
    elements.form.classList.remove('readonly');
    
    // Восстанавливаем кнопку отправки
    const actionButtons = document.querySelector('.action-buttons');
    actionButtons.innerHTML = `
        <button type="button" class="btn-submit" id="submitBtn">
            🟢 SMOKE ПРОЙДЕН
        </button>
    `;
    
    // Перепривязываем событие
    document.getElementById('submitBtn').addEventListener('click', () => {
        const errors = validateForm();
        if (errors.length > 0) {
            showErrors(errors);
        } else {
            elements.confirmModal.style.display = 'flex';
        }
    });
    
    saveState();
}

// ===== УВЕДОМЛЕНИЯ =====
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            ${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}
        </div>
        <div class="toast-message">${message}</div>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Автоматическое удаление через 3 секунды
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// ===== ЗАПУСК ПРИЛОЖЕНИЯ =====
document.addEventListener('DOMContentLoaded', init);