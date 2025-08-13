document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const tabsContainer = document.getElementById('tabs-container');
    const contentContainer = document.getElementById('content-container');
    // addTabButton is dynamically found after state is loaded

    let tabCounter = 1;
    let draggedItem = null;

    // --- Core Functions ---

    function switchTab(event) {
        if (!event.target.classList.contains('tab-button') || event.target.id === 'add-tab-button') {
            return;
        }

        document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        const tabId = event.target.dataset.tabId;
        event.target.classList.add('active');
        const newActiveContent = document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
        if (newActiveContent) {
            newActiveContent.classList.add('active');
        }
        saveState();
    }

    function addTab() {
        if (tabCounter >= 30) {
            alert('You have reached the maximum number of tabs (30).');
            return;
        }
        const tabName = prompt('Enter a name for the new tab:');
        if (tabName) {
            tabCounter++;
            const tabId = `tab-${Date.now()}`;

            document.querySelector('.tab-button.active')?.classList.remove('active');
            document.querySelector('.tab-content.active')?.classList.remove('active');

            const newTabButton = document.createElement('button');
            newTabButton.className = 'tab-button active';
            newTabButton.textContent = tabName;
            newTabButton.dataset.tabId = tabId;

            const newTabContent = document.createElement('div');
            newTabContent.className = 'tab-content active';
            newTabContent.dataset.tabId = tabId;
            newTabContent.innerHTML = `
                <div class="controls-container">
                    <form class="add-link-form">
                        <input type="text" name="linkName" placeholder="Link Name" required>
                        <input type="url" name="linkUrl" placeholder="https://example.com" required>
                        <button type="submit">Add Link</button>
                    </form>
                    <button class="create-folder-button">Create Folder</button>
                </div>
                <div class="links-container"></div>`;

            const addTabButton = document.getElementById('add-tab-button');
            tabsContainer.insertBefore(newTabButton, addTabButton);
            contentContainer.appendChild(newTabContent);
            saveState();
        }
    }

    function addLink(form) {
        const linkName = form.elements.linkName.value;
        const linkUrl = form.elements.linkUrl.value;
        const activeContent = document.querySelector('.tab-content.active');
        if (!activeContent) return;
        const linksContainer = activeContent.querySelector('.links-container');

        const faviconUrl = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(linkUrl)}`;

        const linkItem = document.createElement('a');
        linkItem.href = linkUrl;
        linkItem.target = '_blank';
        linkItem.className = 'link-item';
        linkItem.draggable = true;
        linkItem.innerHTML = `<img src="${faviconUrl}" alt=""><span>${linkName}</span>`;

        linksContainer.appendChild(linkItem);
        form.reset();
        saveState();
    }

    function createFolder() {
        const folderName = prompt('Enter a name for the new folder:');
        if (folderName) {
            const activeContent = document.querySelector('.tab-content.active');
            if (!activeContent) return;
            const linksContainer = activeContent.querySelector('.links-container');

            const folderItem = document.createElement('div');
            folderItem.className = 'folder-item';
            folderItem.innerHTML = `
                <div class="folder-header"><span class="folder-name">${folderName}</span></div>
                <div class="folder-content"></div>`;
            linksContainer.appendChild(folderItem);
            saveState();
        }
    }

    // --- Drag and Drop Handlers ---

    function handleDragStart(event) {
        if (event.target.classList.contains('link-item')) {
            draggedItem = event.target;
            setTimeout(() => event.target.classList.add('dragging'), 0);
        }
    }

    function handleDragEnd() {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        }
    }

    function handleDragOver(event) {
        const dropTarget = event.target.closest('.folder-content, .links-container');
        if (dropTarget && draggedItem && !dropTarget.contains(draggedItem)) {
            event.preventDefault();
            dropTarget.classList.add('drag-over');
        }
    }

    function handleDragLeave(event) {
        const dropTarget = event.target.closest('.folder-content, .links-container');
        if (dropTarget) {
            dropTarget.classList.remove('drag-over');
        }
    }

    function handleDrop(event) {
        const dropTarget = event.target.closest('.folder-content, .links-container');
        if (dropTarget) {
            event.preventDefault();
            dropTarget.classList.remove('drag-over');
            if (draggedItem) {
                dropTarget.appendChild(draggedItem);
                saveState();
            }
        }
    }

    // --- Data Persistence ---

    function saveState() {
        const activeTab = document.querySelector('.tab-button.active');
        if (!activeTab) return;

        const state = {
            tabsHTML: tabsContainer.innerHTML,
            contentHTML: contentContainer.innerHTML,
            activeTabId: activeTab.dataset.tabId,
            tabCounter: tabCounter
        };
        localStorage.setItem('myHomepageState', JSON.stringify(state));
    }

    function loadState() {
        const savedState = localStorage.getItem('myHomepageState');
        if (savedState) {
            const state = JSON.parse(savedState);
            tabsContainer.innerHTML = state.tabsHTML;
            contentContainer.innerHTML = state.contentHTML;
            tabCounter = state.tabCounter || 1;

            // Re-activate the correct tab
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            const activeTab = document.querySelector(`.tab-button[data-tab-id="${state.activeTabId}"]`);
            const activeContent = document.querySelector(`.tab-content[data-tab-id="${state.activeTabId}"]`);

            if (activeTab && activeContent) {
                activeTab.classList.add('active');
                activeContent.classList.add('active');
            } else { // Fallback if active tab is gone
                document.querySelector('.tab-button:not(#add-tab-button)')?.classList.add('active');
                document.querySelector('.tab-content')?.classList.add('active');
            }
        }
    }

    // --- Initial Setup ---

    loadState();

    // Attach all event listeners after the DOM is potentially rebuilt by loadState
    tabsContainer.addEventListener('click', switchTab);
    document.getElementById('add-tab-button').addEventListener('click', addTab);

    contentContainer.addEventListener('submit', (e) => {
        if (e.target.classList.contains('add-link-form')) {
            e.preventDefault();
            addLink(e.target);
        }
    });

    contentContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('create-folder-button')) {
            createFolder();
        }
    });

    contentContainer.addEventListener('dragstart', handleDragStart);
    contentContainer.addEventListener('dragend', handleDragEnd);
    contentContainer.addEventListener('dragover', handleDragOver);
    contentContainer.addEventListener('dragleave', handleDragLeave);
    contentContainer.addEventListener('drop', handleDrop);
});
