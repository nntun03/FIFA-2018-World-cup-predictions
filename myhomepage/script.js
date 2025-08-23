document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const linksContainer = document.querySelector('.links-container');
    const controlsContainer = document.querySelector('.controls-container');

    let draggedItem = null;

    // --- Event Handlers ---
    function handleDoubleClick(event) {
        window.open(this.href, '_blank');
    }

    function handleSingleClick(event) {
        event.preventDefault();
    }

    function handleContextMenu(event) {
        event.preventDefault();
        const itemType = this.classList.contains('folder-item') ? 'folder' : 'link';
        if (confirm(`Are you sure you want to delete this ${itemType}?`)) {
            this.remove();
            saveState();
        }
    }

    // --- Listener Attachment ---
    function addListenersToElement(element) {
        element.addEventListener('contextmenu', handleContextMenu);

        // Only add click listeners to links, not folders
        if (element.classList.contains('link-item')) {
            element.addEventListener('dblclick', handleDoubleClick);
            element.addEventListener('click', handleSingleClick);
        }
    }

    // --- Core Functions ---
    function addLink(form) {
        const linkName = form.elements.linkName.value;
        const linkUrl = form.elements.linkUrl.value;
        const faviconUrl = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(linkUrl)}`;

        const linkItem = document.createElement('a');
        linkItem.href = linkUrl;
        linkItem.target = '_blank';
        linkItem.className = 'link-item';
        linkItem.draggable = true;
        linkItem.innerHTML = `<img src="${faviconUrl}" alt=""><span>${linkName}</span>`;

        addListenersToElement(linkItem);
        linksContainer.appendChild(linkItem);
        form.reset();
        saveState();
    }

    function createFolder() {
        const folderName = prompt('Enter a name for the new folder:');
        if (folderName) {
            const folderItem = document.createElement('div');
            folderItem.className = 'folder-item';
            folderItem.innerHTML = `
                <div class="folder-header"><span class="folder-name">${folderName}</span></div>
                <div class="folder-content"></div>`;

            addListenersToElement(folderItem);
            linksContainer.appendChild(folderItem);
            saveState();
        }
    }

    // --- Drag and Drop Handlers (Delegated) ---
    function handleDragStart(event) {
        if (event.target.closest('.link-item')) {
            draggedItem = event.target.closest('.link-item');
            setTimeout(() => draggedItem.classList.add('dragging'), 0);
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
        const state = { linksHTML: linksContainer.innerHTML };
        localStorage.setItem('myHomepageState', JSON.stringify(state));
    }

    function loadState() {
        const savedState = localStorage.getItem('myHomepageState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                if (state && typeof state.linksHTML === 'string') {
                    linksContainer.innerHTML = state.linksHTML;
                } else {
                    linksContainer.innerHTML = '';
                }
            } catch (e) {
                console.error("Error parsing myHomepageState from localStorage", e);
                linksContainer.innerHTML = '';
            }
        }
        // Re-attach listeners to all loaded elements
        document.querySelectorAll('.link-item, .folder-item').forEach(addListenersToElement);
    }

    // --- Initial Setup ---
    loadState();

    // Attach delegated and static listeners
    controlsContainer.addEventListener('submit', (e) => {
        if (e.target.classList.contains('add-link-form')) {
            e.preventDefault();
            addLink(e.target);
        }
    });

    controlsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('create-folder-button')) {
            createFolder();
        }
    });

    linksContainer.addEventListener('dragstart', handleDragStart);
    linksContainer.addEventListener('dragend', handleDragEnd);
    linksContainer.addEventListener('dragover', handleDragOver);
    linksContainer.addEventListener('dragleave', handleDragLeave);
    linksContainer.addEventListener('drop', handleDrop);

    document.getElementById('clear-data-button').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear ALL local data? This action cannot be undone.')) {
            localStorage.removeItem('myHomepageState');
            location.reload();
        }
    });
});
