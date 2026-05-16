// File Manager Application
class FileManager {
    constructor() {
        this.currentParentId = null;
        this.files = [];
        this.breadcrumbs = [{ id: null, name: 'Home' }];
        this.viewMode = 'grid';
        this.searchQuery = '';
        this.sortBy = 'name';

        this.initializeStorage();
        this.cacheElements();
        this.attachEventListeners();
        this.loadFiles();
        this.render();
    }

    // Initialize localStorage
    initializeStorage() {
        if (!localStorage.getItem('fileManagerData')) {
            localStorage.setItem('fileManagerData', JSON.stringify([]));
        }
    }

    // Cache DOM elements
    cacheElements() {
        this.els = {
            breadcrumbs: document.getElementById('breadcrumbs'),
            fileCounter: document.getElementById('fileCounter'),
            newFolderBtn: document.getElementById('newFolderBtn'),
            newFolderInput: document.getElementById('newFolderInput'),
            newFolderName: document.getElementById('newFolderName'),
            createFolderBtn: document.getElementById('createFolderBtn'),
            cancelFolderBtn: document.getElementById('cancelFolderBtn'),
            fileInput: document.getElementById('fileInput'),
            searchInput: document.getElementById('searchInput'),
            sortBy: document.getElementById('sortBy'),
            gridViewBtn: document.getElementById('gridViewBtn'),
            listViewBtn: document.getElementById('listViewBtn'),
            gridView: document.getElementById('gridView'),
            listView: document.getElementById('listView'),
            filesGrid: document.getElementById('filesGrid'),
            filesList: document.getElementById('filesList'),
            emptyState: document.getElementById('emptyState'),
            emptyStateList: document.getElementById('emptyStateList'),
        };
    }

    // Attach event listeners
    attachEventListeners() {
        this.els.newFolderBtn.addEventListener('click', () => this.toggleNewFolderInput());
        this.els.createFolderBtn.addEventListener('click', () => this.createFolder());
        this.els.cancelFolderBtn.addEventListener('click', () => this.toggleNewFolderInput());
        this.els.newFolderName.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.createFolder();
        });

        this.els.fileInput.addEventListener('change', (e) => this.uploadFile(e));
        this.els.searchInput.addEventListener('input', () => this.onSearchChange());
        this.els.sortBy.addEventListener('change', () => this.onSortChange());

        this.els.gridViewBtn.addEventListener('click', () => this.setViewMode('grid'));
        this.els.listViewBtn.addEventListener('click', () => this.setViewMode('list'));
    }

    // Toggle new folder input
    toggleNewFolderInput() {
        this.els.newFolderInput.classList.toggle('fm-hidden');
        if (!this.els.newFolderInput.classList.contains('fm-hidden')) {
            this.els.newFolderName.focus();
        } else {
            this.els.newFolderName.value = '';
        }
    }

    // Create folder
    createFolder() {
        const name = this.els.newFolderName.value.trim();
        if (!name) {
            alert('Folder name cannot be empty');
            return;
        }

        const newFolder = {
            id: this.generateId(),
            name: name,
            isFile: 0,
            parent_id: this.currentParentId,
            createdAt: new Date().toISOString(),
        };

        const data = JSON.parse(localStorage.getItem('fileManagerData'));
        data.push(newFolder);
        localStorage.setItem('fileManagerData', JSON.stringify(data));

        this.toggleNewFolderInput();
        this.els.newFolderName.value = '';
        this.loadFiles();
        this.render();
    }

    // Upload file
    uploadFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const fileData = {
                id: this.generateId(),
                name: file.name,
                isFile: 1,
                parent_id: this.currentParentId,
                size: file.size,
                type: file.type,
                data: e.target.result,
                createdAt: new Date().toISOString(),
            };

            const data = JSON.parse(localStorage.getItem('fileManagerData'));
            data.push(fileData);
            localStorage.setItem('fileManagerData', JSON.stringify(data));

            this.els.fileInput.value = '';
            this.loadFiles();
            this.render();
        };
        reader.readAsDataURL(file);
    }

    // Load files from storage
    loadFiles() {
        const data = JSON.parse(localStorage.getItem('fileManagerData'));
        this.files = data.filter((f) => f.parent_id === this.currentParentId);
    }

    // Get filtered and sorted files
    getFilteredAndSortedFiles() {
        let result = [...this.files];

        // Filter by search query
        if (this.searchQuery) {
            result = result.filter((f) =>
                f.name.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        }

        // Sort
        if (this.sortBy === 'type') {
            result.sort((a, b) => {
                const aType = a.isFile ? 'file' : 'folder';
                const bType = b.isFile ? 'file' : 'folder';
                return aType.localeCompare(bType);
            });
        } else {
            result.sort((a, b) => a.name.localeCompare(b.name));
        }

        // Folders first
        result.sort((a, b) => {
            if (a.isFile === b.isFile) return 0;
            return a.isFile ? 1 : -1;
        });

        return result;
    }

    // Get file icon
    getFileIcon(filename, isFile) {
        if (!isFile) return '📁';

        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            pdf: '📄',
            doc: '📝',
            docx: '📝',
            txt: '📄',
            jpg: '🖼️',
            jpeg: '🖼️',
            png: '🖼️',
            gif: '🖼️',
            zip: '🗂️',
            rar: '🗂️',
            mp3: '🎵',
            mp4: '🎬',
            xls: '📊',
            xlsx: '📊',
        };
        return iconMap[ext] || '📎';
    }

    // Open folder
    openFolder(folderId, folderName) {
        this.currentParentId = folderId;
        this.breadcrumbs.push({ id: folderId, name: folderName });
        this.loadFiles();
        this.render();
    }

    // Go to breadcrumb
    goToBreadcrumb(index) {
        this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
        this.currentParentId = this.breadcrumbs[index].id;
        this.loadFiles();
        this.render();
    }

    // Delete file
    deleteFile(fileId, filename, isFile) {
        if (!confirm('Are you sure you want to delete this?')) return;

        let data = JSON.parse(localStorage.getItem('fileManagerData'));

        if (isFile) {
            // Delete single file
            data = data.filter((f) => f.id !== fileId);
        } else {
            // Delete folder and all contents
            data = this.deleteFolderRecursive(data, fileId);
        }

        localStorage.setItem('fileManagerData', JSON.stringify(data));
        this.loadFiles();
        this.render();
    }

    // Delete folder recursively
    deleteFolderRecursive(data, folderId) {
        // Find all children
        const children = data.filter((f) => f.parent_id === folderId);

        // Delete children
        for (const child of children) {
            if (!child.isFile) {
                data = this.deleteFolderRecursive(data, child.id);
            }
        }

        // Delete folder itself
        return data.filter((f) => f.id !== folderId);
    }

    // Set view mode
    setViewMode(mode) {
        this.viewMode = mode;

        if (mode === 'grid') {
            this.els.gridViewBtn.classList.add('fm-view-btn-active');
            this.els.listViewBtn.classList.remove('fm-view-btn-active');
            this.els.gridView.classList.remove('fm-hidden');
            this.els.listView.classList.add('fm-hidden');
        } else {
            this.els.listViewBtn.classList.add('fm-view-btn-active');
            this.els.gridViewBtn.classList.remove('fm-view-btn-active');
            this.els.listView.classList.remove('fm-hidden');
            this.els.gridView.classList.add('fm-hidden');
        }
    }

    // Search change
    onSearchChange() {
        this.searchQuery = this.els.searchInput.value;
        this.render();
    }

    // Sort change
    onSortChange() {
        this.sortBy = this.els.sortBy.value;
        this.render();
    }

    // Render breadcrumbs
    renderBreadcrumbs() {
        this.els.breadcrumbs.innerHTML = '';

        this.breadcrumbs.forEach((b, index) => {
            const sep = document.createElement('span');
            sep.className = 'fm-breadcrumb-sep';
            sep.textContent = index > 0 ? '/' : '';

            const btn = document.createElement('button');
            btn.className = 'fm-breadcrumb-btn';
            if (index === this.breadcrumbs.length - 1) {
                btn.classList.add('active');
            }
            btn.textContent = `📍 ${b.name}`;
            btn.addEventListener('click', () => this.goToBreadcrumb(index));

            if (index > 0) {
                this.els.breadcrumbs.appendChild(sep);
            }
            this.els.breadcrumbs.appendChild(btn);
        });
    }

    // Render grid view
    renderGridView() {
        const files = this.getFilteredAndSortedFiles();
        this.els.filesGrid.innerHTML = '';

        if (files.length === 0) {
            this.els.emptyState.classList.remove('fm-hidden');
            return;
        }

        this.els.emptyState.classList.add('fm-hidden');

        files.forEach((file) => {
            const card = document.createElement('div');
            card.className = 'fm-file-card';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'fm-file-delete';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteFile(file.id, file.name, file.isFile);
            });

            const icon = document.createElement('div');
            icon.className = 'fm-file-icon';
            icon.textContent = this.getFileIcon(file.name, file.isFile);

            const name = document.createElement('div');
            name.className = 'fm-file-name';
            name.textContent = file.name;

            const type = document.createElement('div');
            type.className = 'fm-file-type';
            type.textContent = file.isFile ? '📄 File' : '📁 Folder';

            card.appendChild(deleteBtn);
            card.appendChild(icon);
            card.appendChild(name);
            card.appendChild(type);

            if (!file.isFile) {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => this.openFolder(file.id, file.name));
            }

            this.els.filesGrid.appendChild(card);
        });
    }

    // Render list view
    renderListView() {
        const files = this.getFilteredAndSortedFiles();
        this.els.filesList.innerHTML = '';

        if (files.length === 0) {
            this.els.emptyStateList.classList.remove('fm-hidden');
            return;
        }

        this.els.emptyStateList.classList.add('fm-hidden');

        files.forEach((file) => {
            const item = document.createElement('div');
            item.className = 'fm-list-item';

            const content = document.createElement('div');
            content.className = 'fm-list-item-content';

            const icon = document.createElement('span');
            icon.className = 'fm-list-item-icon';
            icon.textContent = this.getFileIcon(file.name, file.isFile);

            const info = document.createElement('div');
            info.className = 'fm-list-item-info';

            const name = document.createElement('p');
            name.className = 'fm-list-item-name';
            name.textContent = file.name;

            const type = document.createElement('p');
            type.className = 'fm-list-item-type';
            type.textContent = file.isFile ? '📄 File' : '📁 Folder';

            info.appendChild(name);
            info.appendChild(type);
            content.appendChild(icon);
            content.appendChild(info);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'fm-btn fm-btn-danger fm-btn-small';
            deleteBtn.innerHTML = '🗑️ Delete';
            deleteBtn.addEventListener('click', () => {
                this.deleteFile(file.id, file.name, file.isFile);
            });

            item.appendChild(content);
            item.appendChild(deleteBtn);

            if (!file.isFile) {
                content.style.cursor = 'pointer';
                content.addEventListener('click', () => this.openFolder(file.id, file.name));
            }

            this.els.filesList.appendChild(item);
        });
    }

    // Render
    render() {
        const files = this.getFilteredAndSortedFiles();

        this.renderBreadcrumbs();
        this.els.fileCounter.textContent = `📊 ${files.length} item(s)`;
        this.renderGridView();
        this.renderListView();
    }

    // Generate unique ID
    generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new FileManager();
});
