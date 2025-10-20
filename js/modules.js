// --- MODULES ---------------------------------------------------------------- //

/**
 * CONFIG: Static configuration values for the application.
 */
const Config = {
	STATUS_COLORS: {
		blocked: { background: "#f8d7da", border: "#dc3545", text: "#dc3545" },
		pending: { background: "#fff3cd", border: "#ffc107", text: "#ffc107" },
		done: { background: "#d4edda", border: "#28a745", text: "#28a745" },
		highlight: "#007bff", // Color for dependency highlight
	},
	TEXT_COLOR: "#333",
	COLUMN_SPACING: 250,
	ROW_SPACING: 120,
	CANVAS_PADDING_X: 50,
	CANVAS_PADDING_Y: 100, // Increased top padding to avoid toolbar
	STORAGE_KEY_STATE: "taskDepVizState_v2", // Updated key for new data structure
	STORAGE_KEY_COACHMARK_DONE: "taskDepVizCoachmarkDone",
	DEPENDENCY_HIT_TOLERANCE: 12, // New config for click/hover area around dependency
	GANTT_OPTIONS: {
		height: 275,
		gantt: {
			labelStyle: {
				fontName: "Roboto Mono",
				fontSize: 14,
				color: "#000000",
			},
		},
	},
	MIN_ZOOM: 0.2,
	MAX_ZOOM: 3,
	ZOOM_SENSITIVITY: 1.1,
	DOUBLE_TAP_THRESHOLD: 300, // ms
	LONG_PRESS_THRESHOLD: 500, // ms
	TAP_MOVE_THRESHOLD: 10, // pixels
};

/**
 * STATE: Manages the dynamic state of the application.
 */
const State = {
	projects: {},
	currentProjectId: null,
	editingTask: null,
	connectingFrom: null,
	dragging: null,
	mouse: { x: 0, y: 0 },
	hoveringDependency: null,
	panning: false, // For canvas panning
	lastPanPos: { x: 0, y: 0 }, // For canvas panning
	getCurrentProject() {
		return this.projects[this.currentProjectId];
	},
	getTaskById(id) {
		const currentProject = this.getCurrentProject();
		if (!currentProject) return null;
		return currentProject.tasks.find((t) => t.id === id);
	},
};

/**
 * DOM: A single point of reference for all DOM elements.
 */
const DOM = {
	canvas: document.getElementById("canvas"),
	ctx: document.getElementById("canvas").getContext("2d"),
	// Sidebar & Toolbar
	sidebar: document.getElementById("sidebar"),
	sidebarToggle: document.getElementById("sidebarToggle"),
	toolbar: document.getElementById("toolbar"),
	addTaskBtn: document.getElementById("addTask"),
	arrangeBtn: document.getElementById("arrangeBtn"),
	goToContentBtn: document.getElementById("goToContentBtn"),
	ganttBtn: document.getElementById("ganttBtn"),
	projectStartDateInput: document.getElementById("projectStartDate"),
	helpBtn: document.getElementById("helpBtn"),
	// Project Management
	projectSelector: document.getElementById("projectSelector"),
	newProjectBtn: document.getElementById("newProjectBtn"),
	renameProjectBtn: document.getElementById("renameProjectBtn"),
	deleteProjectBtn: document.getElementById("deleteProjectBtn"),
	// Task Modal
	taskModal: document.getElementById("taskModal"),
	taskNameInput: document.getElementById("taskName"),
	taskDaysInput: document.getElementById("taskDays"),
	taskDescInput: document.getElementById("taskDesc"),
	taskDoneInput: document.getElementById("taskDone"),
	saveTaskBtn: document.getElementById("saveTask"),
	closeModalBtn: document.getElementById("closeModal"),
	// Gantt Modal
	ganttModal: document.getElementById("ganttModal"),
	ganttChartDiv: document.getElementById("ganttChartDiv"),
	closeGanttModalBtn: document.getElementById("closeGanttModal"),
	exportGanttCsvBtn: document.getElementById("exportGanttCsvBtn"),
	excludeWeekendsCheckbox: document.getElementById("excludeWeekends"), // New line
	// Node Menu
	nodeMenu: document.getElementById("nodeMenu"),
	editBtn: document.getElementById("editBtn"),
	deleteBtn: document.getElementById("deleteBtn"),
	// NEW: Dependency Menu/Tooltip
	dependencyMenu: document.getElementById("dependencyMenu"),
	// Coachmarks
	coachmarkOverlay: document.getElementById("coachmark-overlay"),
	coachmarkHighlight: document.getElementById("coachmark-highlight"),
	coachmarkBox: document.getElementById("coachmark-box"),
	coachmarkTitle: document.getElementById("coachmark-title"),
	coachmarkText: document.getElementById("coachmark-text"),
	coachmarkStepCounter: document.getElementById("coachmark-step-counter"),
	coachmarkPrevBtn: document.getElementById("coachmark-prev"),
	coachmarkNextBtn: document.getElementById("coachmark-next"),
	coachmarkDoneBtn: document.getElementById("coachmark-done"),
	coachmarkArrowSvg: document.getElementById("coachmark-arrow-svg"),
	coachmarkArrowLine: document.getElementById("coachmark-arrow-line"),
};

/**
 * COACHMARKS: Handles the user feature tour.
 */
const Coachmarks = {
	currentStep: 0,
	steps: [
		{
			title: "Welcome!",
			text: "Let's take a quick tour of the Task Dependency Visualizer. This will show you how to manage your project.",
		},
		{
			element: "#projectSelector",
			title: "Toggle Between projects",
			text: "To switch to another project just click the dropdown and select the name of your project",
		},
		{
			element: "#newProjectBtn",
			title: "New Project",
			text: "Click the new button to create a new project. A project is simply a workspace where you can store each of your unqiue execution strategies",
		},
		{
			element: "#addTask",
			title: "Add a Task",
			text: "Click this button to create a new task. You'll be able to set its name, duration, and description.",
		},
		{
			element: "#arrangeBtn",
			title: "Arrange Tasks",
			text: "After adding tasks and dependencies, click here to automatically organize them into a clean, logical layout.",
		},
		{
			element: "#ganttBtn",
			title: "Generate Gantt Chart",
			text: "Visualize your project timeline by generating a Gantt chart. It uses task durations and dependencies to map everything out.",
		},
		{
			element: "#projectStartDate",
			title: "Set Project Start Date",
			text: "This date is the starting point for the Gantt chart calculation. Make sure it's set correctly!",
		},
		{
			isCanvas: true,
			target: "firstTask",
			title: "The Task Node",
			text: "This is a task. You can drag it to move it. Its color indicates its status: pending (yellow), done (green), or blocked (red).",
		},
		{
			isCanvas: true,
			target: "firstTask",
			title: "Create a Dependency",
			text: "Double-click (or double-tap) any task to start drawing a dependency arrow. Then, click on another task to complete the link.",
		},
		{
			isCanvas: true,
			target: "firstTaskCheckbox",
			title: "Complete a Task",
			text: "Click (or tap) the checkbox to mark a task as done. This automatically updates the status of any tasks that depend on it.",
		},
		{
			isCanvas: true,
			target: "firstTaskMenu",
			title: "Edit or Delete",
			text: "Click the three dots (or tap and hold) in the top-right corner of a task to open a menu to edit its details or delete it entirely.",
		},

		{
			title: "You're All Set!",
			text: "That's everything you need to know to get started. Enjoy managing your project!",
		},
	],

	init() {
		DOM.coachmarkNextBtn.onclick = () => this.next();
		DOM.coachmarkPrevBtn.onclick = () => this.prev();
		DOM.coachmarkDoneBtn.onclick = () => this.end();
		DOM.helpBtn.onclick = () => this.start();
	},

	start() {
		this.currentStep = 0;
		DOM.coachmarkOverlay.style.display = "block";
		this.showStep(this.currentStep);
	},

	end() {
		DOM.coachmarkOverlay.style.display = "none";
		localStorage.setItem(Config.STORAGE_KEY_COACHMARK_DONE, "true");
		UI.collapseSidebar(); // Ensure sidebar is closed when tour ends.
	},

	next() {
		if (this.currentStep < this.steps.length - 1) {
			this.currentStep++;
			this.showStep(this.currentStep);
		}
	},

	prev() {
		if (this.currentStep > 0) {
			this.currentStep--;
			this.showStep(this.currentStep);
		}
	},

	getIntersectionPoint(rect, externalPointX, externalPointY) {
		const { left, right, top, bottom, width, height } = rect;
		const centerX = left + width / 2;
		const centerY = top + height / 2;

		const dx = externalPointX - centerX;
		const dy = externalPointY - centerY;

		const t_x = Math.abs(dx) > 0 ? (dx > 0 ? (right - centerX) / dx : (left - centerX) / dx) : Infinity;
		const t_y = Math.abs(dy) > 0 ? (dy > 0 ? (bottom - centerY) / dy : (top - centerY) / dy) : Infinity;

		const t = Math.min(t_x, t_y);

		return {
			x: centerX + t * dx,
			y: centerY + t * dy,
		};
	},

	showStep(index) {
		const step = this.steps[index];
		const { coachmarkHighlight, coachmarkBox, coachmarkTitle, coachmarkText, coachmarkArrowSvg, coachmarkArrowLine } = DOM;

		const showStepContent = () => {
			coachmarkTitle.textContent = step.title;
			coachmarkText.textContent = step.text;
			DOM.coachmarkStepCounter.textContent = `${index + 1} / ${this.steps.length}`;

			DOM.coachmarkPrevBtn.style.display = index === 0 ? "none" : "inline-block";
			DOM.coachmarkNextBtn.style.display = index === this.steps.length - 1 ? "none" : "inline-block";
			DOM.coachmarkDoneBtn.style.display = index === this.steps.length - 1 ? "inline-block" : "none";

			if (step.element || step.isCanvas) {
				let targetRect;
				if (step.isCanvas) {
					const project = State.getCurrentProject();
					const task = project?.tasks[0];
					if (!task) {
						this.end();
						alert("Please add a task to continue the tour.");
						return;
					}

					// Pan camera to the task
					const viewportCenterX = DOM.canvas.width / 2;
					const viewportCenterY = DOM.canvas.height / 2;
					const taskCenterX = task.x + task.width / 2;
					const taskCenterY = task.y + task.height / 2;
					project.camera.x = viewportCenterX - taskCenterX * project.zoom;
					project.camera.y = viewportCenterY - taskCenterY * project.zoom;
					app.fullUpdateAndRender(); // Redraw with new camera position

					const canvasRect = DOM.canvas.getBoundingClientRect();
					let x = canvasRect.left + task.x * project.zoom + project.camera.x;
					let y = canvasRect.top + task.y * project.zoom + project.camera.y;
					let w = task.width * project.zoom;
					let h = task.height * project.zoom;

					if (step.target === "firstTaskCheckbox") {
						const area = 35 * project.zoom;
						x = canvasRect.left + (task.x + task.width) * project.zoom + project.camera.x - area;
						y = canvasRect.top + (task.y + task.height) * project.zoom + project.camera.y - area;
						w = h = area;
					} else if (step.target === "firstTaskMenu") {
						const area = 25 * project.zoom;
						x = canvasRect.left + (task.x + task.width) * project.zoom + project.camera.x - area;
						y = canvasRect.top + task.y * project.zoom + project.camera.y;
						w = h = area;
					}
					targetRect = { top: y, left: x, width: w, height: h, right: x + w, bottom: y + h };
				} else {
					const targetElement = document.querySelector(step.element);
					if (!targetElement) return this.end();
					targetRect = targetElement.getBoundingClientRect();
				}

				coachmarkHighlight.style.top = `${targetRect.top - 5}px`;
				coachmarkHighlight.style.left = `${targetRect.left - 5}px`;
				coachmarkHighlight.style.width = `${targetRect.width + 10}px`;
				coachmarkHighlight.style.height = `${targetRect.height + 10}px`;
				coachmarkHighlight.style.display = "block";

				const modalRect = coachmarkBox.getBoundingClientRect();
				const targetCenterX = targetRect.left + targetRect.width / 2;
				const targetCenterY = targetRect.bottom;
				const startPoint = this.getIntersectionPoint(modalRect, targetCenterX, targetCenterY);

				coachmarkArrowLine.setAttribute("x1", startPoint.x);
				coachmarkArrowLine.setAttribute("y1", startPoint.y);
				coachmarkArrowLine.setAttribute("x2", targetCenterX);
				coachmarkArrowLine.setAttribute("y2", targetCenterY);
				coachmarkArrowSvg.style.opacity = "1";
			} else {
				coachmarkHighlight.style.display = "none";
				coachmarkArrowSvg.style.opacity = "0";
			}
		};

		const targetElement = step.element ? document.querySelector(step.element) : null;
		const isTargetInSidebar = targetElement && DOM.toolbar.contains(targetElement);
		const isSidebarCollapsed = DOM.sidebar.classList.contains("collapsed");
		let needsAnimationDelay = false;

		if (isTargetInSidebar && isSidebarCollapsed) {
			UI.expandSidebar();
			needsAnimationDelay = true;
		} else if (!isTargetInSidebar && !isSidebarCollapsed) {
			UI.collapseSidebar();
			needsAnimationDelay = true;
		}

		if (needsAnimationDelay) {
			setTimeout(showStepContent, 350); // Wait for sidebar CSS transition
		} else {
			showStepContent(); // Show immediately
		}
	},
};

/**
 * LOGIC: Handles pure business logic and state calculations.
 */
const Logic = {
	updateTaskStatuses() {
		const project = State.getCurrentProject();
		if (!project) return;

		const MAX_ITERATIONS = project.tasks.length + 1;
		for (let i = 0; i < MAX_ITERATIONS; i++) {
			let hasChanged = false;
			project.tasks.forEach((task) => {
				const predecessors = project.dependencies.filter(([, to]) => to === task.id).map(([from]) => State.getTaskById(from));
				const isBlocked = predecessors.some((p) => p && p.status !== "done");

				let newStatus = "pending";
				if (isBlocked) {
					newStatus = "blocked";
					if (task.isDoneByUser) {
						task.isDoneByUser = false;
						hasChanged = true;
					}
				} else if (task.isDoneByUser) {
					newStatus = "done";
				}

				if (task.status !== newStatus) {
					task.status = newStatus;
					hasChanged = true;
				}
			});
			if (!hasChanged) break;
		}
	},

	createsCycle(fromId, toId) {
		const project = State.getCurrentProject();
		if (!project) return false;

		const stack = [toId];
		const visited = new Set([toId]);
		while (stack.length > 0) {
			const currentId = stack.pop();
			if (currentId === fromId) return true;

			const neighbors = project.dependencies.filter(([f]) => f === currentId).map(([, t]) => t);
			for (const neighborId of neighbors) {
				if (!visited.has(neighborId)) {
					visited.add(neighborId);
					stack.push(neighborId);
				}
			}
		}
		return false;
	},

	calculateRanks() {
		const project = State.getCurrentProject();
		const rankMap = new Map();
		if (!project) return rankMap;

		project.tasks.forEach((task) => rankMap.set(task.id, 0));

		for (let i = 0; i < project.tasks.length; i++) {
			project.tasks.forEach((task) => {
				const predecessors = project.dependencies.filter(([, to]) => to === task.id).map(([from]) => from);
				if (predecessors.length > 0) {
					const maxPredecessorRank = Math.max(...predecessors.map((id) => rankMap.get(id) || 0));
					rankMap.set(task.id, maxPredecessorRank + 1);
				}
			});
		}
		return rankMap;
	},

	calculateEndDateIgnoringWeekends(startDate, durationInDays) {
		let currentDate = new Date(startDate.getTime());
		// Round up to handle partial days and ensure task finishes.
		let remainingDays = Math.ceil(durationInDays);
		if (remainingDays <= 0) return currentDate;

		// The start day itself counts as the first day of work.
		let daysToAdvance = 0;
		// We loop until we have advanced the required number of business days PAST the start date.
		while (daysToAdvance < remainingDays - 1) {
			// -1 because the start day is day 1
			currentDate.setDate(currentDate.getDate() + 1);
			let dayOfWeek = currentDate.getDay();
			if (dayOfWeek !== 0 && dayOfWeek !== 6) {
				// If it's a weekday
				daysToAdvance++;
			}
		}
		return currentDate;
	},

	calculateTaskSchedule() {
		const project = State.getCurrentProject();
		if (!project || project.tasks.length === 0) return [];

		const excludeWeekends = DOM.excludeWeekendsCheckbox.checked; // Read the checkbox state

		const userStartDate = project.startDate;
		const projectStartDate = userStartDate ? new Date(userStartDate + "T00:00:00") : new Date();
		projectStartDate.setHours(0, 0, 0, 0);

		const taskDataMap = new Map();
		project.tasks.forEach((task) => {
			taskDataMap.set(task.id, {
				task: task,
				earliestStartMs: projectStartDate.getTime(),
				durationMs: task.days * 24 * 3600 * 1000,
				endMs: 0,
			});
		});

		const sortedTasks = [...project.tasks].sort((a, b) => this.calculateRanks().get(a.id) - this.calculateRanks().get(b.id));

		sortedTasks.forEach((task) => {
			const taskInfo = taskDataMap.get(task.id);
			const predecessors = project.dependencies.filter(([, to]) => to === task.id).map(([from]) => from);
			let latestPredecessorEndMs = projectStartDate.getTime();

			predecessors.forEach((predId) => {
				const predInfo = taskDataMap.get(predId);
				if (predInfo) {
					latestPredecessorEndMs = Math.max(latestPredecessorEndMs, predInfo.endMs);
				}
			});

			let startDate = new Date(latestPredecessorEndMs);

			if (excludeWeekends) {
				// If a predecessor exists, the next task starts the following day.
				if (predecessors.length > 0) {
					startDate.setDate(startDate.getDate() + 1);
				}

				// Adjust the start date to the next available business day
				let dayOfWeek = startDate.getDay();
				if (dayOfWeek === 6) {
					// Saturday
					startDate.setDate(startDate.getDate() + 2);
				} else if (dayOfWeek === 0) {
					// Sunday
					startDate.setDate(startDate.getDate() + 1);
				}
			}

			taskInfo.earliestStartMs = startDate.getTime();

			let endDate;
			if (excludeWeekends) {
				endDate = this.calculateEndDateIgnoringWeekends(startDate, task.days);
			} else {
				// Original logic: add raw duration in milliseconds.
				endDate = new Date(taskInfo.earliestStartMs + taskInfo.durationMs - 1); // Subtract 1ms to not spill into the next day
			}

			taskInfo.endMs = endDate.getTime();
		});

		return Array.from(taskDataMap.values()).map((info) => [
			String(info.task.id),
			info.task.name,
			new Date(info.earliestStartMs),
			new Date(info.endMs),
			null,
			info.task.status === "done" ? 100 : 0,
			project.dependencies
				.filter(([, to]) => to === info.task.id)
				.map(([from]) => String(from))
				.join(","),
		]);
	},
};

/**
 * RENDERER: Handles all drawing operations on the canvas.
 */
const Renderer = {
	init() {
		CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
			if (w < 2 * r) r = w / 2;
			if (h < 2 * r) r = h / 2;
			this.beginPath();
			this.moveTo(x + r, y);
			this.arcTo(x + w, y, x + w, y + h, r);
			this.arcTo(x + w, y + h, x, y + h, r);
			this.arcTo(x, y + h, x, y, r);
			this.arcTo(x, y, x + w, y, r);
			this.closePath();
			return this;
		};
	},

	draw() {
		const { ctx, canvas } = DOM;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const project = State.getCurrentProject();
		if (!project) return;

		ctx.save();
		ctx.translate(project.camera.x, project.camera.y);
		ctx.scale(project.zoom, project.zoom);

		this._drawDependencies();
		if (State.connectingFrom && State.mouse) {
			this._drawConnectingLine();
		}
		this._drawTasks();

		ctx.restore();
	},

	_drawTasks() {
		State.getCurrentProject().tasks.forEach((task) => {
			const { ctx } = DOM;
			const colors = Config.STATUS_COLORS[task.status];

			ctx.shadowColor = "rgba(0,0,0,0.2)";
			ctx.shadowBlur = 8;
			ctx.shadowOffsetY = 4;
			ctx.shadowOffsetX = 0;
			ctx.fillStyle = colors.background;
			ctx.strokeStyle = colors.border;
			ctx.lineWidth = 2.5;
			ctx.roundRect(task.x, task.y, task.width, task.height, 10).fill();
			ctx.roundRect(task.x, task.y, task.width, task.height, 10).stroke();
			ctx.shadowColor = "transparent";

			if (State.connectingFrom === task.id) {
				ctx.strokeStyle = Config.STATUS_COLORS.highlight;
				ctx.lineWidth = 4;
				ctx.roundRect(task.x - 2, task.y - 2, task.width + 4, task.height + 4, 12).stroke(); // Draw a slightly larger outline
			}

			ctx.fillStyle = Config.TEXT_COLOR;
			ctx.font = "bold 14px 'JetBrains Mono', monospace";
			ctx.fillText(task.name, task.x + 12, task.y + 28);
			ctx.fillStyle = "#555";
			ctx.font = "11px 'JetBrains Mono', monospace";
			ctx.fillText(`${task.days}d`, task.x + 12, task.y + 45);

			const statusText = task.status.toUpperCase();
			ctx.font = "bold 10px 'JetBrains Mono', monospace";
			const statusMetrics = ctx.measureText(statusText);
			const tagPadding = 6;
			const tagWidth = statusMetrics.width + tagPadding * 2;
			const tagHeight = 18;
			const tagX = task.x + 10;
			const tagY = task.y + task.height - 10 - tagHeight;
			ctx.fillStyle = colors.border;
			ctx.roundRect(tagX, tagY, tagWidth, tagHeight, 4).fill();
			ctx.fillStyle = colors.background;
			ctx.fillText(statusText, tagX + tagPadding, tagY + 12);

			this._drawCheckbox(task, colors);

			const menuX = task.x + task.width - 15;
			ctx.fillStyle = "#6c757d";
			for (let i = 0; i < 3; i++) {
				ctx.beginPath();
				ctx.arc(menuX, task.y + 12 + i * 5, 1.5, 0, Math.PI * 2);
				ctx.fill();
			}
		});
	},

	_drawCheckbox(task, colors) {
		const { ctx } = DOM;
		const checkboxX = task.x + task.width - 30;
		const checkboxY = task.y + task.height - 30;
		const size = 16;
		ctx.strokeStyle = colors.border;

		if (task.status === "blocked") {
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(checkboxX + 3, checkboxY + 3);
			ctx.lineTo(checkboxX + size - 3, checkboxY + size - 3);
			ctx.moveTo(checkboxX + size - 3, checkboxY + 3);
			ctx.lineTo(checkboxX + 3, checkboxY + size - 3);
			ctx.stroke();
		} else {
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.roundRect(checkboxX, checkboxY, size, size, 3).stroke();
			if (task.isDoneByUser) {
				ctx.lineWidth = 2.5;
				ctx.beginPath();
				ctx.moveTo(checkboxX + 3, checkboxY + size * 0.55);
				ctx.lineTo(checkboxX + size * 0.4, checkboxY + size * 0.8);
				ctx.lineTo(checkboxX + size * 0.9, checkboxY + size * 0.2);
				ctx.stroke();
			}
		}
	},

	_drawDependencies() {
		State.getCurrentProject().dependencies.forEach(([fromId, toId]) => {
			const from = State.getTaskById(fromId);
			const to = State.getTaskById(toId);
			if (!from || !to) return;

			const fromX = from.x + from.width;
			const fromY = from.y + from.height / 2;
			const toX = to.x;
			const toY = to.y + to.height / 2;
			let color = Config.STATUS_COLORS[to.status]?.border || "#555";
			let thickness = 3;

			// NEW: Check for highlight
			if (State.hoveringDependency && State.hoveringDependency[0] === fromId && State.hoveringDependency[1] === toId) {
				color = Config.STATUS_COLORS.highlight;
				thickness = 5;
			}

			this._drawArrow(fromX, fromY, toX, toY, color, false, thickness);
		});
	},

	_drawConnectingLine() {
		const from = State.getTaskById(State.connectingFrom);
		if (from) {
			const fromX = from.x + from.width;
			const fromY = from.y + from.height / 2;
			this._drawArrow(fromX, fromY, State.mouse.x, State.mouse.y, "#555", true, 3);
		}
	},

	_drawArrow(x1, y1, x2, y2, color, dashed = false, thickness = 3) {
		const { ctx } = DOM;
		ctx.beginPath();
		ctx.setLineDash(dashed ? [5, 5] : []);
		ctx.strokeStyle = color;
		ctx.lineWidth = thickness;

		const dx = x2 - x1;
		ctx.moveTo(x1, y1);
		ctx.bezierCurveTo(x1 + dx * 0.5, y1, x2 - dx * 0.5, y2, x2, y2);
		ctx.stroke();

		const angle = Math.atan2(y2 - y1, x2 - x1);
		const length = 10;
		ctx.beginPath();
		ctx.moveTo(x2, y2);
		ctx.lineTo(x2 - length * Math.cos(angle - 0.3), y2 - length * Math.sin(angle - 0.3));
		ctx.lineTo(x2 - length * Math.cos(angle + 0.3), y2 - length * Math.sin(angle + 0.3));
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.fill();
		ctx.setLineDash([]);
	},
};

/**
 * UI: Manages interactions with DOM elements like modals and menus.
 */
const UI = {
	toggleSidebar() {
		DOM.sidebar.classList.toggle("collapsed");
		const isCollapsed = DOM.sidebar.classList.contains("collapsed");
		DOM.sidebarToggle.setAttribute("aria-expanded", !isCollapsed);
		DOM.sidebarToggle.innerHTML = isCollapsed ? "&lt;" : "&gt;";
	},
	expandSidebar() {
		if (DOM.sidebar.classList.contains("collapsed")) {
			DOM.sidebar.classList.remove("collapsed");
			DOM.sidebarToggle.setAttribute("aria-expanded", "true");
			DOM.sidebarToggle.innerHTML = "&gt;";
		}
	},
	collapseSidebar() {
		if (!DOM.sidebar.classList.contains("collapsed")) {
			DOM.sidebar.classList.add("collapsed");
			DOM.sidebarToggle.setAttribute("aria-expanded", "false");
			DOM.sidebarToggle.innerHTML = "&lt;";
		}
	},

	populateProjectSelector() {
		DOM.projectSelector.innerHTML = "";
		for (const id in State.projects) {
			const project = State.projects[id];
			const option = document.createElement("option");
			option.value = id;
			option.textContent = project.name;
			DOM.projectSelector.appendChild(option);
		}
		DOM.projectSelector.value = State.currentProjectId;
	},

	updateProjectUI() {
		const project = State.getCurrentProject();
		if (project) {
			DOM.projectStartDateInput.value = project.startDate;
		}
		this.populateProjectSelector();
		app.fullUpdateAndRender();
	},

	showTaskModal(task = null) {
		State.editingTask = task;
		if (task) {
			DOM.taskNameInput.value = task.name;
			DOM.taskDescInput.value = task.desc;
			DOM.taskDaysInput.value = task.days;
			DOM.taskDoneInput.checked = task.isDoneByUser;
		} else {
			DOM.taskNameInput.value = "";
			DOM.taskDescInput.value = "";
			DOM.taskDaysInput.value = 1;
			DOM.taskDoneInput.checked = false;
		}
		DOM.taskModal.style.display = "block";
		DOM.taskNameInput.focus();
	},

	hideTaskModal() {
		DOM.taskModal.style.display = "none";
	},

	showNodeMenu(task, clientX, clientY) {
		DOM.nodeMenu.style.display = "flex";
		const menuWidth = DOM.nodeMenu.offsetWidth;
		DOM.nodeMenu.style.left = clientX + menuWidth > window.innerWidth ? `${clientX - menuWidth}px` : `${clientX}px`;
		DOM.nodeMenu.style.top = `${clientY}px`;

		DOM.editBtn.onclick = () => app.startEditTask(task);
		DOM.deleteBtn.onclick = () => app.deleteTask(task.id);
	},

	hideNodeMenu() {
		DOM.nodeMenu.style.display = "none";
	},

	showGanttModal() {
		DOM.ganttModal.style.display = "flex";
		const ganttData = Logic.calculateTaskSchedule();

		if (ganttData.length === 0) {
			DOM.ganttChartDiv.innerHTML = "<p>No tasks to display in the chart.</p>";
			return;
		}

		const dataTable = new google.visualization.DataTable();
		dataTable.addColumn("string", "Task ID");
		dataTable.addColumn("string", "Task Name");
		dataTable.addColumn("date", "Start Date");
		dataTable.addColumn("date", "End Date");
		dataTable.addColumn("number", "Duration (ms)");
		dataTable.addColumn("number", "Percent Complete");
		dataTable.addColumn("string", "Dependencies");
		dataTable.addRows(ganttData);

		const rowHeight = 41;
		const chartHeight = ganttData.length * rowHeight + 50;

		const options = {
			height: Math.max(chartHeight, 200),
			gantt: {
				trackHeight: 30,
				barHeight: 20,
				criticalPathEnabled: true,
				criticalPathStyle: { stroke: "#e64a19", strokeWidth: 5 },
				arrow: { angle: 100, width: 2, color: "#555", radius: 0 },
			},
		};

		const chart = new google.visualization.Gantt(DOM.ganttChartDiv, Config.GANTT_OPTIONS);
		chart.draw(dataTable, options);
	},

	hideGanttModal() {
		DOM.ganttModal.style.display = "none";
		DOM.ganttChartDiv.innerHTML = "";
	},
};