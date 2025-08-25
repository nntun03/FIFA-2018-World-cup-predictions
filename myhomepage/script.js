document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const topTabSystem = document.getElementById('top-tab-system');
    const bottomTabSystem = document.getElementById('bottom-tab-system');
    const header = document.querySelector('header');

    // --- State ---
    let appState = {};
    let clickTimer = null; // For differentiating single/double clicks

    // --- Core Functions ---
    function saveState() {
        localStorage.setItem('myHomepageState_DualTabs', JSON.stringify(appState));
    }

    function loadState() {
        const savedState = localStorage.getItem('myHomepageState_DualTabs');
        if (savedState) {
            appState = JSON.parse(savedState);
        } else {
            // Initialize default state
            appState.top = createDefaultSystemState('top');
            appState.bottom = createDefaultSystemState('bottom');
            appState.theme = 'theme-default'; // Default blue theme
        }
    }

    function applyTheme() {
        document.body.className = appState.theme || 'theme-default';
    }

    function createDefaultSystemState(prefix) {
        const state = { tabs: [], links: {}, activeTabId: `${prefix}-tab-1` };
        for (let i = 1; i <= 10; i++) {
            const tabId = `${prefix}-tab-${i}`;
            state.tabs.push({ id: tabId, name: `Tab ${i}` });
            state.links[tabId] = [];
        }
        return state;
    }

    function renderSystem(systemKey, systemElement) {
        const systemState = appState[systemKey];
        const tabButtonsContainer = systemElement.querySelector('.tab-buttons-container');
        const tabContentsContainer = systemElement.querySelector('.tab-contents-container');

        tabButtonsContainer.innerHTML = '';
        systemState.tabs.forEach(tab => {
            const button = document.createElement('button');
            button.className = 'tab-button';
            button.dataset.tabId = tab.id;
            if (tab.id === systemState.activeTabId) button.classList.add('active');

            const nameSpan = document.createElement('span');
            nameSpan.className = 'tab-name';
            nameSpan.textContent = tab.name;
            button.appendChild(nameSpan);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-tab-button';
            deleteButton.textContent = 'X';
            button.appendChild(deleteButton);

            tabButtonsContainer.appendChild(button);
        });

        const addTabButton = document.createElement('button');
        addTabButton.className = 'add-tab-button';
        addTabButton.textContent = '+';
        tabButtonsContainer.appendChild(addTabButton);

        tabContentsContainer.innerHTML = '';
        systemState.tabs.forEach(tab => {
            const content = document.createElement('div');
            content.className = 'tab-content';
            if (tab.id === systemState.activeTabId) content.classList.add('active');

            const linksList = document.createElement('div');
            linksList.className = 'links-list';

            (systemState.links[tab.id] || []).forEach(link => {
                linksList.appendChild(createLinkElement(link));
            });

            const addUrlInput = document.createElement('input');
            addUrlInput.type = 'url';
            addUrlInput.className = 'add-url-in-tab';
            addUrlInput.placeholder = 'Paste URL & Press Enter...';

            content.appendChild(linksList);
            content.appendChild(addUrlInput);
            tabContentsContainer.appendChild(content);
        });
    }

    function createLinkElement(link) {
        const linkItem = document.createElement('a');
        linkItem.href = link.url;
        linkItem.className = 'link-item';
        linkItem.dataset.linkId = link.id;

        const faviconUrl = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(link.url)}`;

        linkItem.innerHTML = `
            <img src="${faviconUrl}" alt="">
            <span>${link.url}</span>
            <button class="delete-button">X</button>
        `;
        return linkItem;
    }

    function getSystemFromEvent(e) {
        const systemElement = e.target.closest('.tab-system');
        return systemElement ? { key: systemElement.id.split('-')[0], element: systemElement } : null;
    }

    // --- Event Handlers ---
    function handleSystemClick(e) {
        const systemInfo = getSystemFromEvent(e);
        if (!systemInfo) return;
        const { key, element } = systemInfo;

        if (e.target.classList.contains('add-tab-button')) {
            const newTabId = `${key}-tab-${Date.now()}`;
            appState[key].tabs.push({ id: newTabId, name: `Tab ${appState[key].tabs.length + 1}` });
            appState[key].links[newTabId] = [];
            appState[key].activeTabId = newTabId;
            saveState();
            renderSystem(key, element);
            return;
        }

        if (e.target.classList.contains('delete-tab-button')) {
            const tabId = e.target.parentElement.dataset.tabId;
            if (confirm(`Delete tab?`)) {
                appState[key].tabs = appState[key].tabs.filter(t => t.id !== tabId);
                delete appState[key].links[tabId];
                if (appState[key].activeTabId === tabId) {
                    appState[key].activeTabId = appState[key].tabs.length > 0 ? appState[key].tabs[0].id : null;
                }
                saveState();
                renderSystem(key, element);
            }
            return;
        }

        if (e.target.classList.contains('delete-button')) {
            const linkItem = e.target.closest('.link-item');
            const linkId = linkItem.dataset.linkId;
            const activeTabId = appState[key].activeTabId;
            if (confirm(`Delete link ${linkItem.href}?`)) {
                appState[key].links[activeTabId] = appState[key].links[activeTabId].filter(l => l.id !== linkId);
                saveState();
                renderSystem(key, element);
            }
            return;
        }

        const tabButton = e.target.closest('.tab-button');
        if (tabButton) {
            clearTimeout(clickTimer);
            clickTimer = setTimeout(() => {
                appState[key].activeTabId = tabButton.dataset.tabId;
                saveState();
                renderSystem(key, element);
            }, 250);
        }
    }

    function handleSystemKeydown(e) {
        if (e.key !== 'Enter' || !e.target.classList.contains('add-url-in-tab')) return;
        const systemInfo = getSystemFromEvent(e);
        if (!systemInfo) return;
        const { key, element } = systemInfo;

        const input = e.target;
        let url = input.value.trim();
        if (!url) return;

        try {
            if (!url.startsWith('http')) url = 'https://' + url;
            new URL(url);
            const newLink = { id: `link-${Date.now()}`, url };
            appState[key].links[appState[key].activeTabId].push(newLink);
            saveState();
            renderSystem(key, element);
        } catch (error) {
            alert("Invalid URL.");
        }
    }

    function handleSystemDblClick(e) {
        if (!e.target.classList.contains('tab-name')) return;
        clearTimeout(clickTimer); // Cancel single-click action

        const systemInfo = getSystemFromEvent(e);
        if (!systemInfo) return;
        const { key, element } = systemInfo;

        const nameSpan = e.target;
        const tabId = nameSpan.parentElement.dataset.tabId;
        const currentName = nameSpan.textContent;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'tab-name-input';

        nameSpan.replaceWith(input);
        input.focus();
        input.select();

        const saveRename = () => {
            let newName = input.value.trim() || "Untitled";
            if (newName.length > 12) newName = newName.substring(0, 12);
            const tab = appState[key].tabs.find(t => t.id === tabId);
            if (tab) tab.name = newName;
            saveState();
            renderSystem(key, element);
        };

        input.addEventListener('blur', saveRename);
        input.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') saveRename();
            if (ev.key === 'Escape') renderSystem(key, element);
        });
    }

    function handleThemeClick(e) {
        const themeButton = e.target.closest('.theme-button');
        if (themeButton) {
            appState.theme = themeButton.dataset.theme;
            saveState();
            applyTheme();
        }
    }

    // --- Initial Setup & Event Listeners ---
    loadState();
    applyTheme();
    renderSystem('top', topTabSystem);
    renderSystem('bottom', bottomTabSystem);

    header.addEventListener('click', handleThemeClick);
    document.getElementById('left-column').addEventListener('click', handleSystemClick);
    document.getElementById('left-column').addEventListener('keydown', handleSystemKeydown);
    document.getElementById('left-column').addEventListener('dblclick', handleSystemDblClick);

    // --- Clock ---
    const clockElement = document.getElementById('clock');
    if (clockElement) {
        function updateClock() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            clockElement.textContent = `${hours}:${minutes}:${seconds}`;
        }
        setInterval(updateClock, 1000);
        updateClock(); // Initial call
    }

    // --- Random Animation for Logo 2 ---
    const logo2 = document.getElementById('logo2');
    if (logo2) {
        const frequencies = [2, 3, 4];
        const randomFrequency = frequencies[Math.floor(Math.random() * frequencies.length)];
        const duration = 1 / randomFrequency;
        logo2.style.animationDuration = `${duration}s`;
    }
});
