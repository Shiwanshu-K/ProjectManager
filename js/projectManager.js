/**
 * ProjectManager: Handles project-level actions like creating, renaming, deleting, and switching projects.
 */
const ProjectManager = {
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
	},

	renameProject() {
		const project = State.getCurrentProject();
		if (!project) return;
		const newName = prompt("Enter new name for project:", project.name);
		if (newName && newName.trim() !== "") {
			project.name = newName.trim();
			UI.updateProjectUI();
			Storage.saveState();
		}
	},

	deleteProject() {
		const project = State.getCurrentProject();
		if (!project) return;
		if (confirm(`Are you sure you want to delete the project "${project.name}"? This cannot be undone.`)) {
			delete State.projects[State.currentProjectId];
			const remainingProjectIds = Object.keys(State.projects);
			if (remainingProjectIds.length > 0) {
				this.switchProject(remainingProjectIds[0]);
			} else {
				// If no projects are left, create a new default one
				Storage.loadDefaultProject();
				UI.updateProjectUI();
			}
			Storage.saveState();
		}
	},

	switchProject(projectId) {
		State.currentProjectId = projectId;
		UI.updateProjectUI();
		Storage.saveState();
	},

	updateProjectStartDate(date) {
		const project = State.getCurrentProject();
		if (project) {
			project.startDate = date;
			Storage.saveState();
		}
	},
};
