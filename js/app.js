/**
 * APP: The main controller that wires everything together.
 */
const App = {
	init() {
		// Set initial canvas size
		DOM.canvas.width = window.innerWidth;
		DOM.canvas.height = window.innerHeight;

		// Initialize all modules
		Renderer.init();
		Coachmarks.init();
		InputHandler.init();
		this.setupEventListeners();

		// Load data and render the initial view
		Storage.loadState();
		UI.updateProjectUI();

		// Show the feature tour on first visit
		if (!localStorage.getItem(Config.STORAGE_KEY_COACHMARK_DONE)) {
			setTimeout(() => Coachmarks.start(), 500);
		}
	},

	setupEventListeners() {
		// Sidebar & Toolbar buttons
		DOM.sidebarToggle.onclick = () => UI.toggleSidebar();
		DOM.addTaskBtn.onclick = () => UI.showTaskModal();
		DOM.arrangeBtn.onclick = () => this.arrangeTasks();
		DOM.goToContentBtn.onclick = () => this.goToContent();
		DOM.ganttBtn.onclick = () => UI.showGanttModal();

		// Project Management
		DOM.newProjectBtn.onclick = () => ProjectManager.createNewProject();
		DOM.renameProjectBtn.onclick = () => ProjectManager.renameProject();
		DOM.deleteProjectBtn.onclick = () => ProjectManager.deleteProject();
		DOM.projectSelector.onchange = (e) => ProjectManager.switchProject(e.target.value);
		DOM.projectStartDateInput.onchange = (e) => ProjectManager.updateProjectStartDate(e.target.value);

		// Modals and Menus
		DOM.saveTaskBtn.onclick = () => TaskManager.saveTask();
		DOM.closeModalBtn.onclick = () => UI.hideTaskModal();
		DOM.closeGanttModalBtn.onclick = () => UI.hideGanttModal();
		DOM.exportGanttCsvBtn.onclick = () => this.exportGanttToCSV();
		DOM.dependencyMenu.onclick = () => TaskManager.deleteDependency(State.hoveringDependency);

		// Window resize
		window.onresize = () => {
			DOM.canvas.width = window.innerWidth;
			DOM.canvas.height = window.innerHeight;
			Renderer.draw();
		};
	},

	arrangeTasks() {
		const project = State.getCurrentProject();
		if (!project || project.tasks.length === 0) return;

		const rankMap = Logic.calculateRanks();
		const columns = new Map();

		// Group tasks by their calculated rank (column)
		rankMap.forEach((rank, taskId) => {
			if (!columns.has(rank)) columns.set(rank, []);
			columns.get(rank).push(State.getTaskById(taskId));
		});

		// Position tasks in a grid layout
		columns.forEach((tasksInCol, colIndex) => {
			tasksInCol.forEach((task, rowIndex) => {
				task.x = Config.CANVAS_PADDING_X + colIndex * Config.COLUMN_SPACING;
				task.y = Config.CANVAS_PADDING_Y + rowIndex * Config.ROW_SPACING;
			});
		});
		this.goToContent(); // Pan to the newly arranged content
		Storage.saveState(); // Save the new positions
	},

	goToContent() {
		const project = State.getCurrentProject();
		if (!project || project.tasks.length === 0) return;

		// Calculate the bounding box of all tasks
		const minX = Math.min(...project.tasks.map((t) => t.x));
		const minY = Math.min(...project.tasks.map((t) => t.y));

		// Pan the camera to center the content
		const PADDING = 50;
		project.camera.x = PADDING - minX * project.zoom;
		project.camera.y = PADDING - minY * project.zoom;

		Renderer.draw();
	},

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
			return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
		};

		const rows = ganttData.map((row) => {
			const [taskId, taskName, startDate, endDate, , percentComplete, dependencyIdsStr] = row;
			const status = percentComplete === 100 ? "Done" : "Pending/Blocked";
			const originalTask = State.getTaskById(taskId);
			const duration = originalTask ? originalTask.days : "N/A";
			const dependencyNames = (dependencyIdsStr || "")
				.split(",")
				.map((id) => State.getTaskById(id)?.name)
				.filter(Boolean)
				.join("; ");

			return [taskName, new Date(startDate).toISOString().split("T")[0], new Date(endDate).toISOString().split("T")[0], duration, status, dependencyNames]
				.map(formatCsvField)
				.join(",");
		});

		const csvContent = [headers.join(","), ...rows].join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		const url = URL.createObjectURL(blob);
		const filename = `${project.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_gantt.csv`;

		link.setAttribute("href", url);
		link.setAttribute("download", filename);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	},
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
	google.charts.load("current", { packages: ["gantt"] });
	google.charts.setOnLoadCallback(() => {
		App.init();
	});
});
