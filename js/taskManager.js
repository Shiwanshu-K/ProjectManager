/**
 * TaskManager: Handles creating, updating, and deleting tasks and dependencies.
 */
const TaskManager = {
	saveTask() {
		const name = DOM.taskNameInput.value.trim();
		if (!name) return;

		const project = State.getCurrentProject();
		if (!project) return;

		// Prevent duplicate task names within the same project
		const isDuplicate = project.tasks.some((t) => t.name.toLowerCase() === name.toLowerCase() && t !== State.editingTask);
		if (isDuplicate) {
			alert("A task with this name already exists in this project.");
			return;
		}

		const desc = DOM.taskDescInput.value.trim();
		const days = parseFloat(DOM.taskDaysInput.value) || 1;
		const isDone = DOM.taskDoneInput.checked;

		if (State.editingTask) {
			// Update existing task
			State.editingTask.name = name;
			State.editingTask.desc = desc;
			State.editingTask.days = days;
			State.editingTask.isDoneByUser = isDone;
		} else {
			// Create new task in the center of the current view
			const { x: viewCenterX, y: viewCenterY } = InputHandler.getCanvasCenterInWorld();
			const newTask = new Task(Date.now(), name, desc, viewCenterX - 90, viewCenterY - 45, isDone, days);
			project.tasks.push(newTask);
		}

		UI.hideTaskModal();
		Storage.saveState();
		UI.updateProjectUI(); // Full update to reflect changes
	},

	startEditTask(task) {
		UI.hideNodeMenu();
		UI.showTaskModal(task);
	},

	deleteTask(taskId) {
		const project = State.getCurrentProject();
		if (!project) return;
		project.tasks = project.tasks.filter((t) => t.id !== taskId);
		// Also remove dependencies connected to this task
		project.dependencies = project.dependencies.filter(([f, t]) => f !== taskId && t !== taskId);
		UI.hideNodeMenu();
		Storage.saveState();
		UI.updateProjectUI();
	},

	deleteDependency([fromId, toId]) {
		const project = State.getCurrentProject();
		if (!project) return;

		project.dependencies = project.dependencies.filter(([f, t]) => !(f === fromId && t === toId));
		UI.hideDependencyTooltip();
		Storage.saveState();
		UI.updateProjectUI();
	},

	toggleTaskDone(task) {
		if (task.status === "blocked") return; // Can't complete a blocked task

		task.isDoneByUser = !task.isDoneByUser;

		// If unchecking a task, recursively uncheck all tasks that depend on it
		if (!task.isDoneByUser) {
			const uncheckDependents = (taskId) => {
				State.getCurrentProject()
					.dependencies.filter(([from]) => from === taskId)
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
		Storage.saveState();
		UI.updateProjectUI();
	},

	addDependency(fromId, toId) {
		const project = State.getCurrentProject();
		if (!project || fromId === toId) return;

		// Prevent creating a cycle
		if (Logic.createsCycle(fromId, toId)) {
			alert("This dependency would create a cycle and is not allowed.");
			return;
		}

		// Prevent creating duplicate dependencies
		const exists = project.dependencies.some(([f, t]) => f === fromId && t === toId);
		if (!exists) {
			project.dependencies.push([fromId, toId]);
			Storage.saveState();
			UI.updateProjectUI();
		}
	},
};
