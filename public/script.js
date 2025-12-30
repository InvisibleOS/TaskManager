document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration & State ---
    const CONTAINERS = {
        pending: ['section-pending', 'section-upcoming', 'section-important'],
        completed: ['section-completed'],
        notes: ['section-notes', 'section-notes-important']
    };

    const ELEMENTS = {
        importantTasks: document.getElementById('important-tasks'),
        upcomingTasks: document.getElementById('upcoming-tasks'),
        pendingTasks: document.getElementById('pending-tasks'),
        completedTasks: document.getElementById('completed-tasks'),
        notesGrid: document.getElementById('notes-grid'),
        notesGridImportant: document.getElementById('notes-grid-important'),
        mainFab: document.getElementById('main-fab'),
        fabOptions: document.getElementById('fab-options'),
        addTaskModal: document.getElementById('add-task-modal'),
        newTaskInput: document.getElementById('new-task-input'),
        modalDateSection: document.getElementById('modal-date-section'),
        taskDateInput: document.getElementById('task-date'),
        taskTimeInput: document.getElementById('task-time'),
        saveTaskBtn: document.getElementById('save-task-btn'),
        cancelTaskBtn: document.getElementById('cancel-task-btn'),
        viewBtns: document.querySelectorAll('.view-btn'),
        statPending: document.getElementById('stat-pending'),
        statImportant: document.getElementById('stat-important')
    };

    let currentView = 'pending';
    let editingTaskId = null;

    // --- Helpers ---
    const apiCall = async (endpoint, method = 'GET', body = null) => {
        try {
            const opts = { method, headers: { 'Content-Type': 'application/json' } };
            if (body) opts.body = JSON.stringify(body);
            const res = await fetch(`/api/${endpoint}`, opts);
            return await res.json();
        } catch (err) {
            console.error(`API Error (${endpoint}):`, err);
        }
    };

    const qs = (selector) => document.querySelector(selector);
    const createEl = (tag, className = '', html = '') => {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (html) el.innerHTML = html;
        return el;
    };

    // --- View Logic ---
    const updateView = (view) => {
        currentView = view;
        ELEMENTS.fabOptions.classList.add('hidden');
        ELEMENTS.mainFab.firstElementChild.textContent = 'add';

        document.querySelectorAll('.app-container section').forEach(el => el.classList.add('hidden'));

        // Show relevant sections
        if (CONTAINERS[view]) {
            CONTAINERS[view].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove('hidden');
            });
        }

        if (view === 'notes') fetchNotes();
    };

    ELEMENTS.viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            ELEMENTS.viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateView(btn.dataset.view);
        });
    });

    // --- Date & Stats ---
    const updateHeaderDate = () => {
        const date = new Date();
        document.getElementById('current-day').textContent = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
        document.getElementById('current-date').textContent = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    // --- Core Functions ---
    const fetchTasks = async () => {
        const res = await apiCall('tasks');
        if (res && res.message === 'success') renderTasks(res.data);
    };

    const fetchNotes = async () => {
        const res = await apiCall('notes');
        if (res && res.message === 'success') renderNotes(res.data);
    };

    const renderTasks = (tasks) => {
        tasks.sort((a, b) => b.id - a.id);

        ['importantTasks', 'upcomingTasks', 'pendingTasks', 'completedTasks'].forEach(k => ELEMENTS[k].innerHTML = '');

        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const hasTasksToday = tasks.some(t => t.due_date?.startsWith(today));
        const targetUpcoming = hasTasksToday ? today : (tasks.some(t => t.due_date?.startsWith(tomorrow)) ? tomorrow : null);

        tasks.forEach(task => {
            const card = createCard(task, false);
            if (task.status === 'completed') ELEMENTS.completedTasks.appendChild(card);
            else if (task.is_important) ELEMENTS.importantTasks.appendChild(card);
            else if (task.due_date?.startsWith(targetUpcoming)) ELEMENTS.upcomingTasks.appendChild(card);
            else ELEMENTS.pendingTasks.appendChild(card);
        });

        ELEMENTS.statPending.textContent = tasks.filter(t => t.status !== 'completed').length;
        ELEMENTS.statImportant.textContent = tasks.filter(t => t.status !== 'completed' && t.is_important).length;

        if (!ELEMENTS.pendingTasks.children.length) ELEMENTS.pendingTasks.innerHTML = createEmptyState('assignment', 'No pending tasks');
        if (!ELEMENTS.importantTasks.children.length) ELEMENTS.importantTasks.innerHTML = createEmptyState('star', 'No important tasks');
        if (!ELEMENTS.upcomingTasks.children.length) ELEMENTS.upcomingTasks.innerHTML = createEmptyState('event', 'No upcoming tasks');
        if (!ELEMENTS.completedTasks.children.length) ELEMENTS.completedTasks.innerHTML = createEmptyState('check_circle', 'No completed tasks');
    };

    const renderNotes = (notes) => {
        ELEMENTS.notesGrid.innerHTML = '';
        ELEMENTS.notesGridImportant.innerHTML = '';

        if (!notes.length) ELEMENTS.notesGrid.innerHTML = createEmptyState('notes', 'No notes found');

        notes.forEach(note => {
            const card = createCard(note, true);
            (note.is_important ? ELEMENTS.notesGridImportant : ELEMENTS.notesGrid).appendChild(card);
        });

        if (!ELEMENTS.notesGridImportant.children.length) ELEMENTS.notesGridImportant.innerHTML = createEmptyState('star', 'No important notes');
    };

    const createCard = (item, isNote) => {
        const card = createEl('div', `task-card ${item.is_important ? 'important' : ''}`);
        const created = new Date(item.created_at);
        const createdStr = `Created at: ${created.toLocaleDateString()} ${created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        let header = '';
        if (!isNote && item.due_date) {
            const d = new Date(item.due_date);
            const dStr = d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
            const time = item.due_date.includes('T') ? ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            header = `<div class="task-due-header">Due by: ${dStr}${time}</div>`;
        }

        const endpoint = isNote ? 'notes' : 'tasks';

        const actions = `
            <div class="card-actions">
                ${item.status !== 'completed' ? `
                    <button class="card-btn btn-important ${item.is_important ? 'active' : ''}" onclick="window.toggleItem('${endpoint}', ${item.id}, ${item.is_important})">${item.is_important ? 'Unpin' : 'Pin'}</button>
                    ${!isNote ? `<button class="card-btn btn-done" onclick="window.markDone(${item.id})">Done</button>` : ''}
                    <button class="card-btn" style="border: 1px solid #ccc" onclick='window.prepEdit(${JSON.stringify(item).replace(/'/g, "&#39;")}, ${isNote})'>Edit</button>
                ` : ''}
                ${item.status === 'completed' || isNote ? `<button class="card-btn btn-delete" onclick="window.deleteItem('${endpoint}', ${item.id})">Delete</button>` : ''}
            </div>
        `;

        card.innerHTML = `${header}<div class="task-content">${item.content}</div><div class="task-card-footer"><div class="created-timestamp">${createdStr}</div>${actions}</div>`;
        return card;
    };

    const createEmptyState = (icon, text) => `
        <div class="empty-state">
            <span class="material-icons-round empty-state-icon">${icon}</span>
            <p class="empty-state-text">${text}</p>
        </div>`;

    // --- Modal & Interaction ---
    ELEMENTS.mainFab.addEventListener('click', () => {
        if (currentView === 'notes') openModal(false, true);
        else {
            ELEMENTS.fabOptions.classList.toggle('hidden');
            ELEMENTS.mainFab.firstElementChild.textContent = ELEMENTS.fabOptions.classList.contains('hidden') ? 'add' : 'close';
        }
    });

    document.getElementById('btn-no-due-date').addEventListener('click', () => openModal(false));
    document.getElementById('btn-due-date').addEventListener('click', () => openModal(true));
    document.getElementById('cancel-task-btn').addEventListener('click', () => {
        ELEMENTS.addTaskModal.classList.add('hidden');
        editingTaskId = null;
    });

    const openModal = (showDate, isNote = false) => {
        ELEMENTS.fabOptions.classList.add('hidden');
        ELEMENTS.mainFab.firstElementChild.textContent = 'add';
        ELEMENTS.addTaskModal.classList.remove('hidden');
        editingTaskId = null;

        ELEMENTS.newTaskInput.value = '';
        ELEMENTS.taskDateInput.value = '';
        ELEMENTS.taskTimeInput.value = '';

        qs('h3').textContent = isNote ? 'New Note' : 'New Task';
        ELEMENTS.newTaskInput.placeholder = isNote ? 'Enter note content...' : 'What needs to be done?';

        if (showDate && !isNote) ELEMENTS.modalDateSection.classList.remove('hidden');
        else ELEMENTS.modalDateSection.classList.add('hidden');

        ELEMENTS.newTaskInput.focus();
    };

    window.prepEdit = (item, isNote) => {
        openModal(!isNote, isNote);
        qs('h3').textContent = isNote ? 'Edit Note' : 'Edit Task';
        editingTaskId = item.id;
        ELEMENTS.newTaskInput.value = item.content;

        if (!isNote && item.due_date) {
            ELEMENTS.modalDateSection.classList.remove('hidden');
            const d = new Date(item.due_date);
            ELEMENTS.taskDateInput.value = d.toISOString().split('T')[0];
            if (item.due_date.includes('T')) ELEMENTS.taskTimeInput.value = d.toTimeString().slice(0, 5);
        }
    };

    ELEMENTS.saveTaskBtn.addEventListener('click', async () => {
        const content = ELEMENTS.newTaskInput.value.trim();
        if (!content) return;

        const isNote = currentView === 'notes';
        const endpoint = isNote ? 'notes' : 'tasks';
        let body = { content };

        if (!isNote) {
            const d = ELEMENTS.taskDateInput.value;
            const t = ELEMENTS.taskTimeInput.value;
            body.due_date = d ? (t ? `${d}T${t}` : d) : null;
        }

        let res;
        if (editingTaskId) res = await apiCall(`${endpoint}/${editingTaskId}`, 'PATCH', body);
        else res = await apiCall(endpoint, 'POST', body);

        if (res && res.message === 'success') {
            ELEMENTS.addTaskModal.classList.add('hidden');
            isNote ? fetchNotes() : fetchTasks();
        }
    });

    // --- Global Actions (Window) ---
    window.toggleItem = async (endpoint, id, currentStatus) => {
        await apiCall(`${endpoint}/${id}`, 'PATCH', { is_important: currentStatus ? 0 : 1 });
        endpoint === 'notes' ? fetchNotes() : fetchTasks();
    };

    window.markDone = async (id) => {
        await apiCall(`tasks/${id}`, 'PATCH', { status: 'completed' });
        fetchTasks();
    };

    window.deleteItem = async (endpoint, id) => {
        await apiCall(`${endpoint}/${id}`, 'DELETE');
        endpoint === 'notes' ? fetchNotes() : fetchTasks();
    };

    // Init
    updateHeaderDate();
    updateView('pending');
    fetchTasks();
});
