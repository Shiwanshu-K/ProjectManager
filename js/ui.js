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
			this.toggleSidebar();
		}
	},

	collapseSidebar() {
		if (!DOM.sidebar.classList.contains("collapsed")) {
			this.toggleSidebar();
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
		Logic.updateTaskStatuses();
		Renderer.draw();
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

		DOM.editBtn.onclick = () => TaskManager.startEditTask(task);
		DOM.deleteBtn.onclick = () => TaskManager.deleteTask(task.id);
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

		const chart = new google.visualization.Gantt(DOM.ganttChartDiv);
		chart.draw(dataTable, options);
	},

	hideGanttModal() {
		DOM.ganttModal.style.display = "none";
		DOM.ganttChartDiv.innerHTML = "";
	},

	showDependencyTooltip(dep, x, y) {
		const project = State.getCurrentProject();
		if (!project) return;
		const rect = DOM.canvas.getBoundingClientRect();
		const menu = DOM.dependencyMenu;
		menu.style.left = `${rect.left + x * project.zoom + project.camera.x + 10}px`;
		menu.style.top = `${rect.top + y * project.zoom + project.camera.y - menu.offsetHeight / 2}px`;
		menu.style.display = "block";
		State.hoveringDependency = dep;
	},

	hideDependencyTooltip() {
		DOM.dependencyMenu.style.display = "none";
		State.hoveringDependency = null;
	},
};
