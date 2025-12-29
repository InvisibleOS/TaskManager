document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const importantTasksContainer = document.getElementById('important-tasks');
    const upcomingTasksContainer = document.getElementById('upcoming-tasks');
    const pendingTasksContainer = document.getElementById('pending-tasks');
    const completedTasksContainer = document.getElementById('completed-tasks');

    const sectionImportant = document.getElementById('section-important');
    const sectionUpcoming = document.getElementById('section-upcoming');
    const sectionPending = document.getElementById('section-pending');
    const sectionCompleted = document.getElementById('section-completed');

    const viewBtns = document.querySelectorAll('.view-btn');

    // Stats
    const statPendingEl = document.getElementById('stat-pending');
    const statImportantEl = document.getElementById('stat-important');

    // FAB & Modal
    const mainFab = document.getElementById('main-fab');
    const fabOptionsContainer = document.getElementById('fab-options');
    const btnNoDueDate = document.getElementById('btn-no-due-date');
    const btnDueDate = document.getElementById('btn-due-date');

    const addTaskModal = document.getElementById('add-task-modal');
    const cancelTaskBtn = document.getElementById('cancel-task-btn');
    const saveTaskBtn = document.getElementById('save-task-btn');
    const newTaskInput = document.getElementById('new-task-input');
    const modalDateSection = document.getElementById('modal-date-section');
    const taskDateInput = document.getElementById('task-date');
    const taskTimeInput = document.getElementById('task-time');
    let editingTaskId = null; // Track which task is being edited

    // Header Info
    const currentDayEl = document.getElementById('current-day');
    const currentDateEl = document.getElementById('current-date');

    // --- Logic ---

    // View Switcher
    function updateView(view) {
        if (view === 'pending') {
            sectionImportant.classList.remove('hidden');
            sectionUpcoming.classList.remove('hidden');
            sectionPending.classList.remove('hidden');
            sectionCompleted.classList.add('hidden');
        } else if (view === 'completed') {
            sectionImportant.classList.add('hidden');
            sectionUpcoming.classList.add('hidden');
            sectionPending.classList.add('hidden');
            sectionCompleted.classList.remove('hidden');
        }
    }

    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateView(btn.dataset.view);
        });
    });

    // Set Current Date Display
    const date = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    currentDayEl.textContent = days[date.getDay()];
    currentDateEl.textContent = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

    // Initial State
    updateView('pending');
    fetchTasks();

    // --- API Functions ---

    function fetchTasks() {
        fetch('/api/tasks')
            .then(res => res.json())
            .then(data => {
                if (data.message === 'success') {
                    renderTasks(data.data);
                }
            })
            .catch(err => console.error('Error fetching tasks:', err));
    }

    function renderTasks(tasks) {
        // Sort by ID (Created Order) - Descending (Newest First)
        tasks.sort((a, b) => b.id - a.id);

        importantTasksContainer.innerHTML = '';
        upcomingTasksContainer.innerHTML = '';
        pendingTasksContainer.innerHTML = '';
        completedTasksContainer.innerHTML = '';

        // Determine what date to show in "Upcoming"
        // Priority 1: Today
        // Priority 2: Tomorrow (only if no tasks for Today)

        const now = new Date();

        // Today string
        const nowY = now.getFullYear();
        const nowM = String(now.getMonth() + 1).padStart(2, '0');
        const nowD = String(now.getDate()).padStart(2, '0');
        const todayStr = `${nowY}-${nowM}-${nowD}`;

        // Tomorrow string
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const toY = tomorrow.getFullYear();
        const toM = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const toD = String(tomorrow.getDate()).padStart(2, '0');
        const tomorrowStr = `${toY}-${toM}-${toD}`;

        // Check if there are any tasks due TODAY
        const hasTasksToday = tasks.some(t => {
            if (!t.due_date) return false;
            return t.due_date.substring(0, 10) === todayStr;
        });

        // Determine target date for "Upcoming" view
        let targetUpcomingDate = null;
        if (hasTasksToday) {
            targetUpcomingDate = todayStr;
        } else {
            // Check if there are tasks due TOMORROW
            const hasTasksTomorrow = tasks.some(t => {
                if (!t.due_date) return false;
                return t.due_date.substring(0, 10) === tomorrowStr;
            });

            if (hasTasksTomorrow) {
                targetUpcomingDate = tomorrowStr;
            }
        }

        tasks.forEach(task => {
            const card = createTaskCard(task);
            let isUpcoming = false;

            if (task.due_date && targetUpcomingDate) {
                const taskDatePart = task.due_date.substring(0, 10);
                if (taskDatePart === targetUpcomingDate) {
                    isUpcoming = true;
                }
            }

            if (task.status === 'completed') {
                completedTasksContainer.appendChild(card);
            } else if (task.is_important) {
                importantTasksContainer.appendChild(card);
            } else if (isUpcoming) {
                upcomingTasksContainer.appendChild(card);
            } else {
                pendingTasksContainer.appendChild(card);
            }
        });

        // Update Stats
        const pendingCount = tasks.filter(t => t.status !== 'completed').length;
        const importantCount = tasks.filter(t => t.status !== 'completed' && t.is_important).length;

        if (statPendingEl) statPendingEl.textContent = pendingCount;
        if (statImportantEl) statImportantEl.textContent = importantCount;

        // Empty States
        if (importantTasksContainer.children.length === 0) {
            importantTasksContainer.innerHTML = createEmptyState('star', 'No important tasks');
        }
        if (upcomingTasksContainer.children.length === 0) {
            upcomingTasksContainer.innerHTML = createEmptyState('event', 'No upcoming tasks');
        }
        if (pendingTasksContainer.children.length === 0) {
            pendingTasksContainer.innerHTML = createEmptyState('assignment', 'No pending tasks');
        }
        if (completedTasksContainer.children.length === 0) {
            completedTasksContainer.innerHTML = createEmptyState('check_circle', 'No completed tasks');
        }
    }

    function createEmptyState(icon, text) {
        return `
            <div class="empty-state">
                <span class="material-icons-round empty-state-icon">${icon}</span>
                <p class="empty-state-text">${text}</p>
            </div>
        `;
    }

    function createTaskCard(task) {
        const card = document.createElement('div');
        card.className = `task-card ${task.is_important ? 'important' : ''}`;

        // Created Date formatting
        const createdDate = new Date(task.created_at);
        const createdDay = String(createdDate.getDate()).padStart(2, '0');
        const createdMonth = String(createdDate.getMonth() + 1).padStart(2, '0');
        const createdYear = createdDate.getFullYear();
        const createdTime = createdDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const createdString = `Created at: ${createdDay}/${createdMonth}/${createdYear} ${createdTime}`;

        // Due Date formatting
        let topHeader = '';
        if (task.due_date) {
            const dueDate = new Date(task.due_date);
            const dayName = dueDate.toLocaleDateString('en-US', { weekday: 'short' });
            const dDay = String(dueDate.getDate()).padStart(2, '0');
            const dMonth = String(dueDate.getMonth() + 1).padStart(2, '0');
            const dYear = dueDate.getFullYear();

            const hasTime = task.due_date.includes('T');
            const dTime = hasTime ? dueDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';

            const formattedDate = `${dayName}, ${dDay}/${dMonth}/${dYear}`;
            const dueDisplay = `${formattedDate}${dTime ? ' ' + dTime : ''}`;

            topHeader = `<div class="task-due-header">Due by: ${dueDisplay}</div>`;
        }

        const importantBtn = task.status !== 'completed' ? `
            <button class="card-btn btn-important ${task.is_important ? 'active' : ''}" 
                onclick="toggleImportant(${task.id}, ${task.is_important})">
                ${task.is_important ? 'Unpin' : 'Important'}
            </button>` : '';

        const doneBtn = task.status !== 'completed' ? `
            <button class="card-btn btn-done" onclick="markDone(${task.id})">Done</button>` : '';

        const editBtn = task.status !== 'completed' ? `
            <button class="card-btn" style="background:transparent; border: 1px solid #ccc; color: inherit; margin-left: 8px;"
                onclick='openEditModal(${JSON.stringify(task).replace(/'/g, "&#39;")})'>Edit</button>` : '';

        const deleteBtn = task.status === 'completed' ? `
            <button class="card-btn" style="background:transparent; border: 1px solid #ccc; color: inherit;" 
                onclick="deleteTask(${task.id})">Delete</button>` : '';

        card.innerHTML = `
            ${topHeader}
            <div class="task-content">
                ${task.content}
            </div>
            <div class="task-card-footer">
                <div class="created-timestamp">${createdString}</div>
                <div class="card-actions">
                    ${importantBtn}
                    ${doneBtn}
                    ${editBtn}
                    ${deleteBtn}
                </div>
            </div>
        `;
        return card;
    }

    // --- Interaction Listeners ---

    mainFab.addEventListener('click', () => {
        fabOptionsContainer.classList.toggle('hidden');
        mainFab.firstElementChild.textContent = fabOptionsContainer.classList.contains('hidden') ? 'add' : 'close';
    });

    btnNoDueDate.addEventListener('click', () => {
        openModal(false);
    });

    // "Due by" button logic
    btnDueDate.addEventListener('click', () => {
        openModal(true);
    });

    function openModal(showDate, task = null) {
        fabOptionsContainer.classList.add('hidden');
        mainFab.firstElementChild.textContent = 'add';

        if (task) {
            // Edit Mode
            editingTaskId = task.id;
            document.querySelector('#add-task-modal h3').textContent = 'Edit Task';
            newTaskInput.value = task.content;

            if (task.due_date) {
                const dt = new Date(task.due_date);
                // Adjust for local timezone for input value
                // Helper to format date as YYYY-MM-DD
                const yyyy = dt.getFullYear();
                const mm = String(dt.getMonth() + 1).padStart(2, '0');
                const dd = String(dt.getDate()).padStart(2, '0');
                taskDateInput.value = `${yyyy}-${mm}-${dd}`;

                if (task.due_date.includes('T')) {
                    // Get HH:MM
                    const hh = String(dt.getHours()).padStart(2, '0');
                    const min = String(dt.getMinutes()).padStart(2, '0');
                    taskTimeInput.value = `${hh}:${min}`;
                } else {
                    taskTimeInput.value = '';
                }
                modalDateSection.classList.remove('hidden');
            } else {
                taskDateInput.value = '';
                taskTimeInput.value = '';
                // Keep date section open if user wants to add one, or maybe hidden? 
                // Let's decide based on whether we want to encourage adding dates.
                // For now, let's show it if we are editing so they CAN add one.
                modalDateSection.classList.remove('hidden');
            }
        } else {
            // Create Mode
            editingTaskId = null;
            document.querySelector('#add-task-modal h3').textContent = 'New Task';
            newTaskInput.value = '';
            taskDateInput.value = '';
            taskTimeInput.value = '';

            if (showDate) {
                modalDateSection.classList.remove('hidden');
            } else {
                modalDateSection.classList.add('hidden');
            }
        }

        addTaskModal.classList.remove('hidden');
        newTaskInput.focus();
    }

    window.openEditModal = function (task) {
        openModal(true, task);
    }

    cancelTaskBtn.addEventListener('click', () => {
        addTaskModal.classList.add('hidden');
        newTaskInput.value = '';
        taskDateInput.value = '';
        taskTimeInput.value = '';
        editingTaskId = null;
    });

    saveTaskBtn.addEventListener('click', () => {
        const content = newTaskInput.value.trim();
        if (content) {
            // Re-query inputs dynamically to avoid stale references if needed, 
            // but identifiers are constant here so we can use declared vars.
            let dueDate = null;
            if (taskDateInput.value) {
                if (taskTimeInput.value) {
                    dueDate = `${taskDateInput.value}T${taskTimeInput.value}`;
                } else {
                    dueDate = taskDateInput.value;
                }
            }

            if (editingTaskId) {
                updateTaskContent(editingTaskId, content, dueDate);
            } else {
                createTask(content, dueDate);
            }
        }
    });

    // --- Global Helpers for Inline Handlers ---

    function createTask(content, dueDate) {
        fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, due_date: dueDate })
        })
            .then(res => res.json())
            .then(data => {
                if (data.message === 'success') {
                    addTaskModal.classList.add('hidden');
                    newTaskInput.value = '';
                    fetchTasks();
                }
            })
            .catch(err => console.error('Error creating task:', err));
    }

    function updateTaskContent(id, content, dueDate) {
        fetch(`/api/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, due_date: dueDate })
        })
            .then(res => res.json())
            .then(data => {
                if (data.message === 'success') {
                    addTaskModal.classList.add('hidden');
                    editingTaskId = null;
                    fetchTasks();
                }
            })
            .catch(err => console.error('Error updating task:', err));
    }

    window.toggleImportant = function (id, currentStatus) {
        const newStatus = currentStatus ? 0 : 1;
        fetch(`/api/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_important: newStatus })
        })
            .then(res => res.json())
            .then(data => {
                if (data.message === 'success') {
                    fetchTasks();
                }
            });
    }

    window.markDone = function (id) {
        fetch(`/api/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' })
        })
            .then(res => res.json())
            .then(data => {
                if (data.message === 'success') {
                    fetchTasks();
                }
            });
    }

    window.deleteTask = function (id) {
        fetch(`/api/tasks/${id}`, {
            method: 'DELETE'
        })
            .then(res => res.json())
            .then(data => {
                if (data.message === 'deleted') {
                    fetchTasks();
                } else {
                    alert('Failed to delete task');
                }
            })
            .catch(err => console.error('Error deleting task:', err));
    }
});
