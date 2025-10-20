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
	panning: false,
	lastPanPos: { x: 0, y: 0 },

	/**
	 * Gets the currently active project object.
	 * @returns {object|null} The current project or null if not found.
	 */
	getCurrentProject() {
		return this.projects[this.currentProjectId];
	},

	/**
	 * Finds a task by its ID within the current project.
	 * @param {number|string} id - The ID of the task to find.
	 * @returns {Task|null} The task object or null if not found.
	 */
	getTaskById(id) {
		const currentProject = this.getCurrentProject();
		if (!currentProject) return null;
		return currentProject.tasks.find((t) => t.id === id);
	},
};
