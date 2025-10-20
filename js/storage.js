/**
 * STORAGE: Handles saving and loading application state to/from localStorage.
 */
const Storage = {
	saveState() {
		const stateToSave = {
			projects: State.projects,
			currentProjectId: State.currentProjectId,
		};
		localStorage.setItem(Config.STORAGE_KEY_STATE, JSON.stringify(stateToSave));
	},

	loadState() {
		const savedStateJSON = localStorage.getItem(Config.STORAGE_KEY_STATE);
		if (savedStateJSON) {
			try {
				const savedState = JSON.parse(savedStateJSON);
				State.projects = savedState.projects || {};
				State.currentProjectId = savedState.currentProjectId;

				// Re-instantiate Task objects and ensure camera/zoom exists for backwards compatibility
				for (const projectId in State.projects) {
					const project = State.projects[projectId];
					if (!project.camera) project.camera = { x: 50, y: 50 };
					if (!project.zoom) project.zoom = 1;
					project.tasks = project.tasks.map((taskData) => new Task(taskData.id, taskData.name, taskData.desc, taskData.x, taskData.y, taskData.isDoneByUser, taskData.days));
				}

				// If the saved current project ID is invalid, select the first available one
				if (!State.projects[State.currentProjectId]) {
					State.currentProjectId = Object.keys(State.projects)[0] || null;
				}
			} catch (e) {
				console.error("Failed to parse saved state:", e);
				this.loadDefaultProject();
			}
		}

		if (Object.keys(State.projects).length === 0) {
			this.loadDefaultProject();
		}
	},

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

		// Add some sample tasks and dependencies
		defaultProject.tasks.push(new Task(1, "Plan Project", "Define scope.", 100, 250, true, 5));
		defaultProject.tasks.push(new Task(2, "Design UI/UX", "Create mockups.", 350, 150, false, 8));
		defaultProject.tasks.push(new Task(3, "Setup Database", "Configure schema.", 350, 350, false, 4));
		defaultProject.tasks.push(new Task(4, "Develop Frontend", "Build UI.", 600, 250, false, 12));
		defaultProject.dependencies.push([1, 2], [1, 3], [2, 4], [3, 4]);

		State.projects = { [id]: defaultProject };
		State.currentProjectId = id;
	},
};
