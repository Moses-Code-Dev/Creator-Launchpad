document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // == CONFIGURATION & STATE
    // =========================================================================
    const defaultLinks = [
        { name: 'YouTube', url: 'https://youtube.com', category: 'Publishing' },
        { name: 'Canva', url: 'https://canva.com', category: 'Design' },
        { name: 'Claude', url: 'https://claude.ai', category: 'AI Tools' },
        { name: 'CapCut', url: 'https://capcut.com', category: 'Video & Audio' },
        { name: 'Google Analytics', url: 'https://analytics.google.com', category: 'Analytics' },
        { name: 'Google Drive', url: 'https://drive.google.com', category: 'Storage' },
        { name: 'X (Twitter)', url: 'https://x.com', category: 'Publishing' },
        { name: 'Figma', url: 'https://figma.com', category: 'Design' },
    ];

    let links = [];
    let categoryOrder = [];
    let theme = {};
    let userLogo = null;
    let trackingLink = null; // For tracking view time
    let confirmCallback = null; // For custom confirm modal

    // DOM Element References
    const categoriesContainer = document.getElementById('categories');
    const searchInput = document.getElementById('searchInput');
    const addModal = document.getElementById('addModal');
    const addForm = document.getElementById('addLinkForm');
    const settingsModal = document.getElementById('settingsModal');
    const analyticsModal = document.getElementById('analyticsModal');
    const logoContainer = document.getElementById('logoContainer');
    const logoUploadInput = document.getElementById('logoUpload');
    const confirmModal = document.getElementById('confirmModal');
    const alertModal = document.getElementById('alertModal');

    // =========================================================================
    // == INITIALIZATION
    // =========================================================================
    function init() {
        loadData();
        applyTheme();
        applyLogo();
        render();
        setupEventListeners();
        updateClock();
        setInterval(updateClock, 1000);
    }

    // =========================================================================
    // == DATA MANAGEMENT (localStorage)
    // =========================================================================
    function loadData() {
        const loadedLinks = JSON.parse(localStorage.getItem('creatorLinks'));
        if (loadedLinks) {
            links = loadedLinks.map(link => ({
                ...link,
                clickCount: link.clickCount || 0,
                totalViewTime: link.totalViewTime || 0,
            }));
        } else {
            links = defaultLinks.map(link => ({
                ...link,
                clickCount: 0,
                totalViewTime: 0,
            }));
        }

        categoryOrder = JSON.parse(localStorage.getItem('categoryOrder')) || [];
        theme = JSON.parse(localStorage.getItem('userTheme')) || {};
        userLogo = localStorage.getItem('userLogo') || null;
    }

    function saveData() {
        localStorage.setItem('creatorLinks', JSON.stringify(links));
        localStorage.setItem('categoryOrder', JSON.stringify(categoryOrder));
        localStorage.setItem('userTheme', JSON.stringify(theme));
        if (userLogo) {
            localStorage.setItem('userLogo', userLogo);
        } else {
            localStorage.removeItem('userLogo');
        }
    }

    // =========================================================================
    // == THEME & UI CUSTOMIZATION
    // =========================================================================
    function applyTheme() {
        for (const [key, value] of Object.entries(theme)) {
            document.documentElement.style.setProperty(key, value);
        }
    }

    function applyLogo() {
        const logoContent = document.getElementById('logoContent');
        if (userLogo) {
            logoContent.innerHTML = `<img src="${userLogo}" alt="Custom Logo">`;
        } else {
            logoContent.innerHTML = '🚀';
        }
    }

    function handleThemeChange(e) {
        const { id, value } = e.target;
        const varMap = {
            'bgColorPrimary': '--bg-primary',
            'bgColorSecondary': '--bg-secondary',
            'accentColor': '--accent'
        };
        const cssVar = varMap[id];
        if (cssVar) {
            document.documentElement.style.setProperty(cssVar, value);
            theme[cssVar] = value;
            saveData();
        }
    }

    function handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            userLogo = event.target.result;
            applyLogo();
            saveData();
        };
        reader.readAsDataURL(file);
    }

    function resetTheme() {
        localStorage.removeItem('userTheme');
        theme = {};
        document.documentElement.style.cssText = '';
        closeSettingsModal();
    }

    // =========================================================================
    // == RENDERING
    // =========================================================================
    function render() {
        renderLinks(searchInput.value);
        updateCategoryDatalist();
    }

    function renderLinks(searchTerm = '') {
        categoriesContainer.innerHTML = '';

        const filteredLinks = links.filter(link =>
            link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            link.url.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const categorized = filteredLinks.reduce((acc, link) => {
            (acc[link.category] = acc[link.category] || []).push(link);
            return acc;
        }, {});

        const allCategoryNames = [...new Set(links.map(l => l.category))];
        const orderedCategories = [...new Set([...categoryOrder, ...allCategoryNames.sort()])];

        orderedCategories.forEach(categoryName => {
            if (!categorized[categoryName] && searchTerm) return;

            const categoryLinks = categorized[categoryName] || [];

            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';
            categoryDiv.dataset.categoryName = categoryName;

            categoryDiv.innerHTML = `
                <div class="category-header">
                  <h2 class="category-title">${categoryName}</h2>
                </div>
                <div class="links-grid">
                  ${categoryLinks.map(createLinkCard).join('')}
                </div>
            `;
            categoriesContainer.appendChild(categoryDiv);
        });

        initSortable();
    }

    function createLinkCard(link) {
        const hostname = new URL(link.url).hostname;
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
        const fallbackLetter = link.name.charAt(0).toUpperCase();

        return `
            <a class="link-card" href="${link.url}" data-url="${link.url}" target="_blank" rel="noopener noreferrer">
                <img class="link-favicon" src="${faviconUrl}" alt="" onerror="this.parentElement.innerHTML = '<div class=\\'link-favicon\\'>${fallbackLetter}</div>'; this.remove();">
                <div class="link-content">
                    <div class="link-name">${link.name}</div>
                    <div class="link-url">${hostname.replace('www.','')}</div>
                    <div class="link-stats">
                        <span class="stat" title="Times Opened">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            ${link.clickCount || 0}
                        </span>
                        <span class="stat" title="Total View Time">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            ${formatTime(link.totalViewTime || 0)}
                        </span>
                    </div>
                </div>
                <button class="link-remove" data-url="${link.url}">✕</button>
            </a>
        `;
    }

    function updateCategoryDatalist() {
        const datalist = document.getElementById('categoryOptions');
        const uniqueCategories = [...new Set(links.map(l => l.category))];
        datalist.innerHTML = uniqueCategories.map(c => `<option value="${c}"></option>`).join('');
    }

    // =========================================================================
    // == EVENT LISTENERS & ACTIONS
    // =========================================================================
    function setupEventListeners() {
        searchInput.addEventListener('input', () => renderLinks(searchInput.value));

        // Modals
        document.getElementById('addLinkBtn').addEventListener('click', openAddModal);
        document.getElementById('cancelAddBtn').addEventListener('click', closeAddModal);
        document.getElementById('settingsBtn').addEventListener('click', openSettingsModal);
        document.getElementById('closeSettingsBtn').addEventListener('click', closeSettingsModal);
        document.getElementById('analyticsBtn').addEventListener('click', openAnalyticsModal);
        document.getElementById('closeAnalyticsBtn').addEventListener('click', closeAnalyticsModal);

        addModal.addEventListener('click', (e) => { if (e.target === addModal) closeAddModal(); });
        settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) closeSettingsModal(); });
        analyticsModal.addEventListener('click', (e) => { if (e.target === analyticsModal) closeAnalyticsModal(); });


        // Forms, Buttons, Logo
        addForm.addEventListener('submit', handleAddLink);
        logoContainer.addEventListener('click', () => logoUploadInput.click());
        logoContainer.addEventListener('contextmenu', e => {
            e.preventDefault();
            userLogo = null;
            applyLogo();
            saveData();
        });
        logoUploadInput.addEventListener('change', handleLogoUpload);
        document.getElementById('exportBtn').addEventListener('click', exportData);
        document.getElementById('importBtn').addEventListener('click', importData);
        document.getElementById('resetThemeBtn').addEventListener('click', resetTheme);
        document.getElementById('resetStatsBtn').addEventListener('click', resetLinkStats);

        categoriesContainer.addEventListener('click', handleContainerClick);

        // Theme pickers
        ['bgColorPrimary', 'bgColorSecondary', 'accentColor'].forEach(id => {
            document.getElementById(id).addEventListener('input', handleThemeChange);
        });

        // Custom Modals
        setupCustomModals();

        // Global Listeners
        window.addEventListener('focus', handleWindowFocus);
        document.addEventListener('keydown', e => {
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
                e.preventDefault();
                searchInput.focus();
            }
            if (e.key === 'Escape') {
                closeAddModal();
                closeSettingsModal();
                closeAnalyticsModal();
                hideConfirmModal();
                hideAlertModal();
            }
        });
    }

    function handleContainerClick(e) {
        const removeBtn = e.target.closest('.link-remove');
        if (removeBtn) {
            e.preventDefault();
            e.stopPropagation();
            removeLink(removeBtn.dataset.url);
            return;
        }

        const linkCard = e.target.closest('.link-card');
        if (linkCard) {
            const url = linkCard.dataset.url;
            const link = links.find(l => l.url === url);
            if (link) {
                link.clickCount = (link.clickCount || 0) + 1;
                trackingLink = { url: url, startTime: Date.now() };
                saveData();
                const countEl = linkCard.querySelector('.stat:first-of-type');
                if(countEl) {
                    const svg = countEl.querySelector('svg');
                    countEl.innerHTML = (svg ? svg.outerHTML : '') + ` ${link.clickCount}`;
                }
            }
        }
    }

    function handleWindowFocus() {
        if (!trackingLink) return;

        const elapsedTime = (Date.now() - trackingLink.startTime) / 1000;
        const link = links.find(l => l.url === trackingLink.url);

        if (link) {
            link.totalViewTime = (link.totalViewTime || 0) + elapsedTime;
            saveData();
            render();
        }
        trackingLink = null;
    }

    function handleAddLink(e) {
        e.preventDefault();
        const newLink = {
            name: document.getElementById('linkName').value.trim(),
            url: document.getElementById('linkUrl').value.trim(),
            category: document.getElementById('linkCategoryInput').value.trim() || 'Other',
            clickCount: 0,
            totalViewTime: 0
        };
        links.push(newLink);
        saveData();
        render();
        closeAddModal();
    }

    function removeLink(url) {
        showConfirmModal('Remove this link?', `You are about to remove the link to ${url}.`, () => {
            links = links.filter(l => l.url !== url);
            saveData();
            render();
            hideConfirmModal();
        });
    }

    function resetLinkStats() {
        showConfirmModal('Reset All Link Stats?', 'This will reset all click counts and view times to zero. This action cannot be undone.', () => {
            links.forEach(link => {
                link.clickCount = 0;
                link.totalViewTime = 0;
            });
            saveData();
            render();
            closeSettingsModal();
            hideConfirmModal();
        });
    }

    // =========================================================================
    // == DRAG & DROP
    // =========================================================================
    function initSortable() {
        // Sort categories
        new Sortable(categoriesContainer, {
            animation: 150,
            handle: '.category-header',
            ghostClass: 'sortable-ghost',
            onEnd: () => {
                categoryOrder = Array.from(categoriesContainer.children).map(el => el.dataset.categoryName);
                saveData();
            }
        });

        // Sort links within and between categories
        document.querySelectorAll('.links-grid').forEach(grid => {
            new Sortable(grid, {
                group: 'shared-links',
                animation: 150,
                ghostClass: 'sortable-ghost',
                onEnd: () => {
                    const newLinksOrder = [];
                    document.querySelectorAll('.category').forEach(categoryEl => {
                        const categoryName = categoryEl.dataset.categoryName;
                        categoryEl.querySelectorAll('.link-card').forEach(card => {
                            const linkUrl = card.dataset.url;
                            const originalLink = links.find(l => l.url === linkUrl);
                            if (originalLink) {
                                originalLink.category = categoryName;
                                newLinksOrder.push(originalLink);
                            }
                        });
                    });
                    links = newLinksOrder;
                    saveData();
                }
            });
        });
    }

    // =========================================================================
    // == MODAL CONTROLS & UTILITIES
    // =========================================================================
    function openAddModal() { addModal.classList.add('active'); document.getElementById('linkName').focus(); }
    function closeAddModal() { addModal.classList.remove('active'); addForm.reset(); }
    function openSettingsModal() {
        const rootStyle = getComputedStyle(document.documentElement);
        document.getElementById('bgColorPrimary').value = rootStyle.getPropertyValue('--bg-primary').trim();
        document.getElementById('bgColorSecondary').value = rootStyle.getPropertyValue('--bg-secondary').trim();
        document.getElementById('accentColor').value = rootStyle.getPropertyValue('--accent').trim();
        settingsModal.classList.add('active');
    }
    function closeSettingsModal() { settingsModal.classList.remove('active'); }
    function openAnalyticsModal() {
        generateAnalytics();
        analyticsModal.classList.add('active');
    }
    function closeAnalyticsModal() { analyticsModal.classList.remove('active'); }


    function setupCustomModals() {
        document.getElementById('confirmCancelBtn').addEventListener('click', hideConfirmModal);
        document.getElementById('confirmOkBtn').addEventListener('click', () => {
            if (typeof confirmCallback === 'function') {
                confirmCallback();
            }
        });
        confirmModal.addEventListener('click', (e) => { if (e.target === confirmModal) hideConfirmModal(); });

        document.getElementById('alertOkBtn').addEventListener('click', hideAlertModal);
        alertModal.addEventListener('click', (e) => { if (e.target === alertModal) hideAlertModal(); });
    }

    function showConfirmModal(title, message, onConfirm) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        confirmCallback = onConfirm;
        confirmModal.classList.add('active');
    }

    function hideConfirmModal() {
        confirmModal.classList.remove('active');
        confirmCallback = null;
    }

    function showAlert(message, title = 'Notification') {
        document.getElementById('alertTitle').textContent = title;
        document.getElementById('alertMessage').textContent = message;
        alertModal.classList.add('active');
    }

    function hideAlertModal() {
        alertModal.classList.remove('active');
    }

    // =========================================================================
    // == ANALYTICS
    // =========================================================================
    function generateAnalytics() {
        const analyticsContent = document.getElementById('analyticsContent');
        if (links.length === 0) {
            analyticsContent.innerHTML = '<p>No links added yet. Add some links to see your stats!</p>';
            return;
        }

        const totalClicks = links.reduce((sum, link) => sum + (link.clickCount || 0), 0);
        const totalTime = links.reduce((sum, link) => sum + (link.totalViewTime || 0), 0);

        const topByClicks = [...links].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0)).slice(0, 5);
        const topByTime = [...links].sort((a, b) => (b.totalViewTime || 0) - (a.totalViewTime || 0)).slice(0, 5);

        const createListItems = (items, key) => {
            if (items.every(item => !(item[key] > 0))) {
                return '<p class="analytics-item-name">No usage data recorded yet.</p>';
            }
            return items.map(link => {
                if (!(link[key] > 0)) return '';
                const value = key === 'clickCount' ? `${link.clickCount} opens` : formatTime(link.totalViewTime);
                return `
                    <li class="analytics-item">
                        <span class="analytics-item-name">${link.name}</span>
                        <span class="analytics-item-value">${value}</span>
                    </li>
                `;
            }).join('');
        };

        analyticsContent.innerHTML = `
            <div class="summary-stats">
                <div class="summary-stat-item">
                    <span class="summary-stat-value">${links.length}</span>
                    <span class="summary-stat-label">Total Links</span>
                </div>
                <div class="summary-stat-item">
                    <span class="summary-stat-value">${totalClicks}</span>
                    <span class="summary-stat-label">Total Opens</span>
                </div>
                <div class="summary-stat-item">
                    <span class="summary-stat-value">${formatTime(totalTime)}</span>
                    <span class="summary-stat-label">Total Time</span>
                </div>
            </div>
            <div class="analytics-list-container">
                <h3>Most Opened Links</h3>
                <ul class="analytics-list">
                    ${createListItems(topByClicks, 'clickCount')}
                </ul>
            </div>
            <div class="analytics-list-container">
                <h3>Most Time Spent</h3>
                <ul class="analytics-list">
                    ${createListItems(topByTime, 'totalViewTime')}
                </ul>
            </div>
        `;
    }

    // =========================================================================
    // == UTILITIES
    // =========================================================================
    function exportData() {
        const dataStr = JSON.stringify({ links, categoryOrder, theme, userLogo }, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `launchpad-backup-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = re => {
                try {
                    const content = JSON.parse(re.target.result);
                    if (content.links) {
                        showConfirmModal('Overwrite Current Setup?', 'This will replace your current links, categories, and theme settings.', () => {
                            links = (content.links || []).map(link => ({
                                ...link,
                                clickCount: link.clickCount || 0,
                                totalViewTime: link.totalViewTime || 0
                            }));
                            categoryOrder = content.categoryOrder || [];
                            theme = content.theme || {};
                            userLogo = content.userLogo || null;
                            saveData();
                            applyTheme();
                            applyLogo();
                            render();
                            hideConfirmModal();
                        });
                    } else {
                        showAlert('Invalid backup file: "links" property missing.', 'Import Error');
                    }
                } catch { showAlert('Invalid or corrupt backup file.', 'Import Error'); }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function formatTime(totalSeconds) {
        if (!totalSeconds || totalSeconds < 1) return '0s';
        totalSeconds = Math.floor(totalSeconds);

        const d = Math.floor(totalSeconds / (3600 * 24));
        const h = Math.floor(totalSeconds % (3600 * 24) / 3600);
        const m = Math.floor(totalSeconds % 3600 / 60);
        const s = Math.floor(totalSeconds % 60);

        const parts = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        if (s > 0 || parts.length === 0) parts.push(`${s}s`);

        return parts.slice(0, 2).join(' '); // Show max 2 units for brevity
    }

    function updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
        document.getElementById('clock').textContent = timeStr;
        document.getElementById('date').textContent = dateStr;
    }

    init();
});

