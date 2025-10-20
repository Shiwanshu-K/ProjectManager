/**
 * APP: The main controller that wires everything together.
 */
class App {
	constructor() {
		this.offsetX = 0;
		this.offsetY = 0;
		// --- Touch specific state ---
		this.longPressTimer = null;
		this.lastTap = 0;
		this.touchStartPos = null;
		this.initialPinchDistance = null;
	}

	init() {
		DOM.canvas.width = window.innerWidth;
		DOM.canvas.height = window.innerHeight;

		Renderer.init();
		Coachmarks.init();
		this.setupEventListeners();
		this.loadState(); // Load from localStorage or create default project
		UI.updateProjectUI(); // Populate selector and render canvas

		// Show coachmarks on first visit
		if (!localStorage.getItem(Config.STORAGE_KEY_COACHMARK_DONE)) {
			setTimeout(() => Coachmarks.start(), 500);
		}
	}

	saveState() {
		const stateToSave = {
			projects: State.projects,
			currentProjectId: State.currentProjectId,
		};
		localStorage.setItem(Config.STORAGE_KEY_STATE, JSON.stringify(stateToSave));
	}

	loadState() {
		const savedStateJSON = localStorage.getItem(Config.STORAGE_KEY_STATE);
		if (savedStateJSON) {
			try {
				const savedState = JSON.parse(savedStateJSON);
				State.projects = savedState.projects || {};
				State.currentProjectId = savedState.currentProjectId;

				// Re-instantiate Task objects and ensure camera/zoom exists
				for (const projectId in State.projects) {
					const project = State.projects[projectId];
					if (!project.camera) project.camera = { x: 50, y: 50 }; // Retrofit camera
					if (!project.zoom) project.zoom = 1; // Retrofit zoom

					project.tasks = project.tasks.map((taskData) => new Task(taskData.id, taskData.name, taskData.desc, taskData.x, taskData.y, taskData.isDoneByUser, taskData.days));
				}

				// If the saved current project ID doesn't exist anymore, pick the first one
				if (!State.projects[State.currentProjectId]) {
					State.currentProjectId = Object.keys(State.projects)[0] || null;
				}
			} catch (e) {
				console.error("Failed to parse saved state:", e);
				this.loadDefaultProject();
			}
		}

		// If no projects exist after loading, create a default one
		if (Object.keys(State.projects).length === 0) {
			this.loadDefaultProject();
		}
	}

	loadDefaultProject() {
		const id = `proj_${Date.now()}`;
		const defaultProject = {
			id: id,
			name: "My First Project",
			tasks: [],
			dependencies: [],
			startDate: new Date().toISOString().split("T")[0],
			camera: { x: 50, y: 50 },
			zoom: 1,
		};

		defaultProject.tasks.push(new Task(1, "Plan Project", "Define scope.", 100, 250, true, 5));
		defaultProject.tasks.push(new Task(2, "Design UI/UX", "Create mockups.", 350, 150, false, 8));
		defaultProject.tasks.push(new Task(3, "Setup Database", "Configure schema.", 350, 350, false, 4));
		defaultProject.tasks.push(new Task(4, "Develop Frontend", "Build UI.", 600, 250, false, 12));
		defaultProject.dependencies.push([1, 2], [1, 3], [2, 4], [3, 4]);

		State.projects = { [id]: defaultProject };
		State.currentProjectId = id;
	}

	fullUpdateAndRender() {
		Logic.updateTaskStatuses();
		Renderer.draw();
	}

	setupEventListeners() {
		DOM.sidebarToggle.onclick = () => UI.toggleSidebar();
		DOM.addTaskBtn.onclick = () => UI.showTaskModal();
		DOM.arrangeBtn.onclick = () => this.arrangeTasks();
		DOM.goToContentBtn.onclick = () => this.goToContent();
		DOM.ganttBtn.onclick = () => UI.showGanttModal();
		DOM.deleteProjectBtn.onclick = () => this.deleteProject();

		// Project Management Listeners
		DOM.newProjectBtn.onclick = () => this.createNewProject();
		DOM.renameProjectBtn.onclick = () => this.renameProject();
		DOM.projectSelector.onchange = (e) => this.switchProject(e.target.value);
		DOM.projectStartDateInput.onchange = (e) => this.updateProjectStartDate(e.target.value);

		DOM.saveTaskBtn.onclick = () => this.saveTask();
		DOM.closeModalBtn.onclick = () => UI.hideTaskModal();
		DOM.closeGanttModalBtn.onclick = () => UI.hideGanttModal();
		DOM.exportGanttCsvBtn.onclick = () => this.exportGanttToCSV();
		DOM.dependencyMenu.onclick = () => this.deleteDependency(State.hoveringDependency);
		window.onresize = () => {
			DOM.canvas.width = window.innerWidth;
			DOM.canvas.height = window.innerHeight;
			this.fullUpdateAndRender();
		};

		// Mouse Listeners
		DOM.canvas.addEventListener("mousedown", this.handlePointerDown.bind(this));
		DOM.canvas.addEventListener("mousemove", this.handlePointerMove.bind(this));
		DOM.canvas.addEventListener("mouseup", this.handlePointerUp.bind(this));
		DOM.canvas.addEventListener("dblclick", this.handleDoubleClick.bind(this));
		DOM.canvas.addEventListener("wheel", this.handleWheel.bind(this));
		// Touch Listeners
		DOM.canvas.addEventListener("touchstart", this.handlePointerDown.bind(this));
		DOM.canvas.addEventListener("touchmove", this.handlePointerMove.bind(this));
		DOM.canvas.addEventListener("touchend", this.handlePointerUp.bind(this));
		DOM.canvas.addEventListener("touchcancel", this.handlePointerUp.bind(this));
	}

	// --- Action Handlers ---

	exportGanttToCSV() {
		const project = State.getCurrentProject();
		if (!project) return;

		const ganttData = Logic.calculateTaskSchedule();
		if (ganttData.length === 0) {
			alert("No task data available to export.");
			return;
		}

		const headers = ["Task Name", "Start Date", "End Date", "Duration (days)", "Status", "Dependencies"];

		const formatCsvField = (field) => {
			const str = String(field);
			if (str.includes(",") || str.includes('"') || str.includes("\n")) {
				return `"${str.replace(/"/g, '""')}"`;
			}
			return str;
		};

		const rows = ganttData.map((row) => {
			const taskId = row[0];
			const taskName = row[1];
			const startDate = new Date(row[2]).toISOString().split("T")[0];
			const endDate = new Date(row[3]).toISOString().split("T")[0];
			const percentComplete = row[5];
			const status = percentComplete === 100 ? "Done" : "Pending/Blocked";

			const originalTask = State.getTaskById(taskId);
			const duration = originalTask ? originalTask.days : "N/A";

			const dependencyIds = row[6] ? row[6].split(",") : [];
			const dependencyNames = dependencyIds
				.map((id) => State.getTaskById(id)?.name)
				.filter(Boolean)
				.join("; ");

			return [taskName, startDate, endDate, duration, status, dependencyNames].map(formatCsvField).join(",");
		});

		let csvContent = [headers.join(","), ...rows].join("\n");

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");

		const url = URL.createObjectURL(blob);
		const filename = `${project.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_gantt_export.csv`;
		link.setAttribute("href", url);
		link.setAttribute("download", filename);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	createNewProject() {
		const name = prompt("Enter new project name:");
		if (!name || name.trim() === "") return;

		const id = `proj_${Date.now()}`;
		State.projects[id] = {
			id: id,
			name: name.trim(),
			tasks: [],
			dependencies: [],
			startDate: new Date().toISOString().split("T")[0],
			camera: { x: 50, y: 50 },
			zoom: 1,
		};
		this.switchProject(id);
	}

	renameProject() {
		const project = State.getCurrentProject();
		if (!project) return;
		const newName = prompt("Enter new name for project:", project.name);
		if (newName && newName.trim() !== "") {
			project.name = newName.trim();
			UI.updateProjectUI();
			this.saveState();
		}
	}

	deleteProject() {
		const project = State.getCurrentProject();
		if (!project) return;
		if (confirm(`Are you sure you want to delete the project "${project.name}"? This cannot be undone.`)) {
			delete State.projects[State.currentProjectId];
			const remainingProjectIds = Object.keys(State.projects);
			if (remainingProjectIds.length > 0) {
				this.switchProject(remainingProjectIds[0]);
			} else {
				this.loadDefaultProject();
				UI.updateProjectUI();
			}
			this.saveState();
		}
	}

	switchProject(projectId) {
		State.currentProjectId = projectId;
		UI.updateProjectUI();
		this.saveState();
	}

	updateProjectStartDate(date) {
		const project = State.getCurrentProject();
		if (project) {
			project.startDate = date;
			this.saveState();
		}
	}

	saveTask() {
		const name = DOM.taskNameInput.value.trim();
		if (!name) return;

		const project = State.getCurrentProject();
		if (!project) return;

		const isDuplicate = project.tasks.some((t) => t.name.toLowerCase() === name.toLowerCase() && t !== State.editingTask);
		if (isDuplicate) {
			alert("A task with this name already exists in this project.");
			return;
		}

		const desc = DOM.taskDescInput.value.trim();
		const days = parseFloat(DOM.taskDaysInput.value) || 1;
		const isDone = DOM.taskDoneInput.checked;

		if (State.editingTask) {
			State.editingTask.name = name;
			State.editingTask.desc = desc;
			State.editingTask.days = days;
			State.editingTask.isDoneByUser = isDone;
		} else {
			// Place new task in the center of the current view
			const viewCenterX = (DOM.canvas.width / 2 - project.camera.x) / project.zoom - 90; // Adjust for task width
			const viewCenterY = (DOM.canvas.height / 2 - project.camera.y) / project.zoom - 45; // Adjust for task height
			const newTask = new Task(Date.now(), name, desc, viewCenterX, viewCenterY, isDone, days);
			project.tasks.push(newTask);
		}

		UI.hideTaskModal();
		this.saveState();
		this.fullUpdateAndRender();
	}

	startEditTask(task) {
		UI.hideNodeMenu();
		UI.showTaskModal(task);
	}

	deleteTask(taskId) {
		const project = State.getCurrentProject();
		if (!project) return;
		project.tasks = project.tasks.filter((t) => t.id !== taskId);
		project.dependencies = project.dependencies.filter(([f, t]) => f !== taskId && t !== taskId);
		UI.hideNodeMenu();
		this.saveState();
		this.fullUpdateAndRender();
	}

	deleteDependency([fromId, toId]) {
		const project = State.getCurrentProject();
		if (!project) return;

		project.dependencies = project.dependencies.filter(([f, t]) => !(f === fromId && t === toId));
		State.hoveringDependency = null;
		this.hideDependencyTooltip();
		this.saveState();
		this.fullUpdateAndRender();
	}

	arrangeTasks() {
		const project = State.getCurrentProject();
		if (!project || project.tasks.length === 0) return;

		const rankMap = Logic.calculateRanks();

		const columns = new Map();
		rankMap.forEach((rank, taskId) => {
			if (!columns.has(rank)) columns.set(rank, []);
			columns.get(rank).push(State.getTaskById(taskId));
		});

		columns.forEach((tasksInCol, colIndex) => {
			tasksInCol.sort((a, b) => a.y - b.y);
			tasksInCol.forEach((task, rowIndex) => {
				task.x = Config.CANVAS_PADDING_X + colIndex * Config.COLUMN_SPACING;
				task.y = Config.CANVAS_PADDING_Y + rowIndex * Config.ROW_SPACING;
			});
		});
		this.goToContent(); // Pan to the newly arranged content
	}

	goToContent() {
		const project = State.getCurrentProject();
		if (!project || project.tasks.length === 0) return;

		const minX = Math.min(...project.tasks.map((t) => t.x));
		const minY = Math.min(...project.tasks.map((t) => t.y));

		const PADDING = 50;
		project.camera.x = PADDING - minX * project.zoom;
		project.camera.y = PADDING - minY * project.zoom;

		this.saveState();
		this.fullUpdateAndRender();
	}

	// --- Universal Pointer/Input Handlers ---

	_getPointerPos(e) {
		const rect = DOM.canvas.getBoundingClientRect();
		const project = State.getCurrentProject();
		if (!project) return { x: 0, y: 0, canvasX: 0, canvasY: 0, clientX: 0, clientY: 0 };

		const pointer = e.touches ? e.touches[0] || e.changedTouches[0] : e;
		const clientX = pointer.clientX;
		const clientY = pointer.clientY;
		const canvasX = clientX - rect.left;
		const canvasY = clientY - rect.top;

		return {
			// World coordinates
			x: (canvasX - project.camera.x) / project.zoom,
			y: (canvasY - project.camera.y) / project.zoom,
			// Canvas coordinates
			canvasX: canvasX,
			canvasY: canvasY,
			// Client coordinates
			clientX: clientX,
			clientY: clientY,
		};
	}

	getDependencyAtPoint(x, y) {
		const project = State.getCurrentProject();
		if (!project) return null;
		const tolerance = Config.DEPENDENCY_HIT_TOLERANCE / project.zoom; // Scale tolerance with zoom

		for (const [fromId, toId] of project.dependencies) {
			const from = State.getTaskById(fromId);
			const to = State.getTaskById(toId);
			if (!from || !to) continue;

			const x1 = from.x + from.width;
			const y1 = from.y + from.height / 2;
			const x2 = to.x;
			const y2 = to.y + to.height / 2;

			const steps = 10;
			for (let i = 0; i <= steps; i++) {
				const t = i / steps;
				const dx = x2 - x1;
				const px = (1 - t) ** 3 * x1 + 3 * (1 - t) ** 2 * t * (x1 + dx * 0.5) + 3 * (1 - t) * t ** 2 * (x2 - dx * 0.5) + t ** 3 * x2;
				const py = (1 - t) ** 3 * y1 + 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3 * y2;
				const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);

				if (distance <= tolerance) {
					return [fromId, toId, px, py];
				}
			}
		}
		return null;
	}

	showDependencyTooltip([fromId, toId, x, y]) {
		const project = State.getCurrentProject();
		if (!project) return;
		const rect = DOM.canvas.getBoundingClientRect();
		const menu = DOM.dependencyMenu;
		// Position tooltip relative to canvas, accounting for camera AND zoom
		menu.style.left = `${rect.left + x * project.zoom + project.camera.x + 10}px`;
		menu.style.top = `${rect.top + y * project.zoom + project.camera.y - menu.offsetHeight / 2}px`;
		menu.style.display = "block";
	}

	hideDependencyTooltip() {
		DOM.dependencyMenu.style.display = "none";
	}

	handlePointerDown(e) {
		if (e.type === "touchstart") e.preventDefault();

		const pos = this._getPointerPos(e);
		this.touchStartPos = pos;
		UI.hideNodeMenu();
		this.hideDependencyTooltip();

		const project = State.getCurrentProject();
		if (!project) return;

		// Clear any pending long press or double tap timers
		clearTimeout(this.longPressTimer);

		for (const task of [...project.tasks].reverse()) {
			if (task.contains(pos.x, pos.y)) {
				// For touch, set a timer for long press to show menu
				if (e.type === "touchstart") {
					this.longPressTimer = setTimeout(() => {
						// NEW: Long press on mobile starts dependency connection
						State.connectingFrom = task.id;
						this.longPressTimer = null; // Clear timer
						State.dragging = null; // Prevent drag after menu shows
						this.fullUpdateAndRender(); // Re-render to show highlight
					}, Config.LONG_PRESS_THRESHOLD);
				}
				// For mouse, menu is handled on single click
				else if (task.menuClicked(pos.x, pos.y)) {
					UI.showNodeMenu(task, pos.clientX, pos.clientY);
					return;
				}
				if (task.checkboxClicked(pos.x, pos.y)) {
					return; // Checkbox is handled on pointer up (tap)
				}
				State.dragging = task;
				this.offsetX = pos.x - task.x;
				this.offsetY = pos.y - task.y;
				return;
			}
		}

		if (e.touches && e.touches.length === 2) {
			// Start of a pinch gesture
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			this.initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
		} else {
			// Start of a pan gesture
			State.panning = true;
			State.lastPanPos = { x: pos.clientX, y: pos.clientY };
			DOM.canvas.style.cursor = "grabbing";
		}
	}

	handlePointerMove(e) {
		if (e.type === "touchmove") e.preventDefault();

		const pos = this._getPointerPos(e);
		State.mouse = pos;
		const project = State.getCurrentProject();
		if (!project) return;

		// If moving, it's not a long press
		if (this.longPressTimer) clearTimeout(this.longPressTimer);

		// Pinch to zoom
		if (e.touches && e.touches.length === 2 && this.initialPinchDistance) {
			State.panning = false;
			State.dragging = null;
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			const currentPinchDistance = Math.sqrt(dx * dx + dy * dy);

			const zoomFactor = currentPinchDistance / this.initialPinchDistance;
			this.initialPinchDistance = currentPinchDistance; // Update for next move

			const newZoom = Math.max(Config.MIN_ZOOM, Math.min(Config.MAX_ZOOM, project.zoom * zoomFactor));

			// Center zoom on midpoint of touches
			const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
			const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
			project.camera.x = midX - (midX - project.camera.x) * (newZoom / project.zoom);
			project.camera.y = midY - (midY - project.camera.y) * (newZoom / project.zoom);
			project.zoom = newZoom;
			this.fullUpdateAndRender();
			return;
		}

		if (State.panning) {
			const dx = pos.clientX - State.lastPanPos.x;
			const dy = pos.clientY - State.lastPanPos.y;
			project.camera.x += dx;
			project.camera.y += dy;
			State.lastPanPos = { x: pos.clientX, y: pos.clientY };
			this.fullUpdateAndRender();
		} else if (State.dragging) {
			State.dragging.x = pos.x - this.offsetX;
			State.dragging.y = pos.y - this.offsetY;
			Renderer.draw();
		} else if (State.connectingFrom && e.type === "mousemove") {
			Renderer.draw();
		} else {
			let isOverTask = project.tasks.some((task) => task.contains(pos.x, pos.y));
			const dependencyHit = this.getDependencyAtPoint(pos.x, pos.y);
			const oldHover = State.hoveringDependency;

			if (dependencyHit && !isOverTask && e.type === "mousemove") {
				DOM.canvas.style.cursor = "pointer";
				State.hoveringDependency = [dependencyHit[0], dependencyHit[1]];
				this.showDependencyTooltip([dependencyHit[0], dependencyHit[1], dependencyHit[2], dependencyHit[3]]);
			} else {
				DOM.canvas.style.cursor = isOverTask ? "default" : "grab";
				State.hoveringDependency = null;
				this.hideDependencyTooltip();
			}

			if (oldHover !== State.hoveringDependency) {
				Renderer.draw();
			}
		}
	}

	handlePointerUp(e) {
		clearTimeout(this.longPressTimer);
		this.initialPinchDistance = null;
		let stateChanged = false;

		const pos = this._getPointerPos(e);
		const project = State.getCurrentProject();
		if (!project) return;

		// Check if it was a tap or a drag
		const dx = pos.clientX - this.touchStartPos.clientX;
		const dy = pos.clientY - this.touchStartPos.clientY;
		const isTap = Math.sqrt(dx * dx + dy * dy) < Config.TAP_MOVE_THRESHOLD;

		if (isTap) {
			this.handleTap(pos);
		}

		// End drag/pan
		if (State.dragging) stateChanged = true;
		if (State.panning) {
			State.panning = false;
			DOM.canvas.style.cursor = "grab";
			stateChanged = true; // Save new camera position
		}

		if (State.connectingFrom && e.type === "mouseup") {
			const target = project.tasks.find((t) => t.contains(pos.x, pos.y));
			if (target && target.id !== State.connectingFrom) {
				if (Logic.createsCycle(State.connectingFrom, target.id)) {
					alert("This dependency would create a cycle and is not allowed.");
				} else {
					const exists = project.dependencies.some(([f, t]) => f === State.connectingFrom && t === target.id);
					if (!exists) {
						project.dependencies.push([State.connectingFrom, target.id]);
						stateChanged = true;
					}
				}
			}
			State.connectingFrom = null;
			this.fullUpdateAndRender();
		}
		State.dragging = null;

		if (stateChanged) {
			this.saveState();
		}
	}

	handleTap(pos) {
		const project = State.getCurrentProject();
		if (!project) return;

		if (State.connectingFrom) {
			const tappedTask = project.tasks.find((t) => t.contains(pos.x, pos.y));

			if (tappedTask) {
				if (tappedTask.id === State.connectingFrom) {
					// Tapped the same active node, so cancel the mode
					State.connectingFrom = null;
				} else {
					// Tapped a different node, so create the dependency
					if (Logic.createsCycle(State.connectingFrom, tappedTask.id)) {
						alert("This dependency would create a cycle and is not allowed.");
					} else {
						const exists = project.dependencies.some(([f, t]) => f === State.connectingFrom && t === tappedTask.id);
						if (!exists) {
							project.dependencies.push([State.connectingFrom, tappedTask.id]);
							this.saveState();
						}
					}
					// Deactivate mode after attempting to create the dependency
					State.connectingFrom = null;
				}
				this.fullUpdateAndRender();
				return; // Exit the tap handler since we've handled the action
			}
		}

		// Single Tap Logic
		// Check for checkbox click
		for (const task of project.tasks) {
			if (task.checkboxClicked(pos.x, pos.y) && task.status !== "blocked") {
				task.isDoneByUser = !task.isDoneByUser;
				if (!task.isDoneByUser) {
					const uncheckDependents = (taskId) => {
						project.dependencies
							.filter(([from]) => from === taskId)
							.forEach(([, toId]) => {
								const dependent = State.getTaskById(toId);
								if (dependent && dependent.isDoneByUser) {
									dependent.isDoneByUser = false;
									uncheckDependents(dependent.id);
								}
							});
					};
					uncheckDependents(task.id);
				}
				this.saveState();
				this.fullUpdateAndRender();
				return;
			}
		}

		for (const task of project.tasks) {
			if (task.menuClicked(pos.x, pos.y)) {
				UI.showNodeMenu(task, pos.clientX, pos.clientY);
				return;
			}
		}

		// Check for dependency line tap (replaces hover for touch)
		const dependencyHit = this.getDependencyAtPoint(pos.x, pos.y);
		if (dependencyHit) {
			State.hoveringDependency = [dependencyHit[0], dependencyHit[1]];
			this.showDependencyTooltip(dependencyHit);
			Renderer.draw();
			return;
		}

		this.hideDependencyTooltip();
	}

	handleDoubleClick(e) {
		// Use position from event if available (mouse), or from passed pos (tap)
		const pos = e.clientX ? this._getPointerPos(e) : e;
		const project = State.getCurrentProject();
		if (!project) return;
		const clickedTask = project.tasks.find((t) => t.contains(pos.x, pos.y));
		if (clickedTask) {
			State.connectingFrom = clickedTask.id;
			this.hideDependencyTooltip();
			this.fullUpdateAndRender();
		}
	}

	handleWheel(e) {
		e.preventDefault();
		const project = State.getCurrentProject();
		if (!project) return;

		const pos = this._getPointerPos(e);
		const mouseX = pos.canvasX;
		const mouseY = pos.canvasY;

		const zoomFactor = e.deltaY < 0 ? Config.ZOOM_SENSITIVITY : 1 / Config.ZOOM_SENSITIVITY;
		const newZoom = Math.max(Config.MIN_ZOOM, Math.min(Config.MAX_ZOOM, project.zoom * zoomFactor));

		// Adjust camera to zoom towards the cursor
		project.camera.x = mouseX - (mouseX - project.camera.x) * (newZoom / project.zoom);
		project.camera.y = mouseY - (mouseY - project.camera.y) * (newZoom / project.zoom);
		project.zoom = newZoom;

		this.saveState();
		this.fullUpdateAndRender();
	}
}

// --- INITIALIZATION ----------------------------------------------------- //

/**
 * Task Dependency Visualizer Application
 * This script encapsulates the entire application logic, separating it into
 * distinct modules for configuration, state management, DOM interaction,
 * business logic, rendering, and UI control.
 */
let app;

document.addEventListener("DOMContentLoaded", () => {
	google.charts.load("current", { packages: ["gantt"] });
	google.charts.setOnLoadCallback(() => {
		app = new App();
		app.init();
	});
});