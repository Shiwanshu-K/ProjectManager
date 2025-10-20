describe("Storage Module", () => {
	it("should load a default project if no saved state exists", () => {
		expect(Object.keys(State.projects).length).to.equal(0);
		Storage.loadState();
		expect(Object.keys(State.projects).length).to.equal(1);
		expect(State.getCurrentProject().name).to.equal("My First Project");
	});

	it("should save and load the state correctly", () => {
		// Setup initial state
		Storage.loadDefaultProject();
		const project = State.getCurrentProject();
		project.name = "Saved Project";
		project.tasks.push(new Task(99, "Test Task", "", 1, 1, false, 1));
		const projectId = State.currentProjectId;

		// Save and clear state
		Storage.saveState();
		State.projects = {};
		State.currentProjectId = null;

		// Load state
		Storage.loadState();
		const loadedProject = State.getCurrentProject();
		expect(State.currentProjectId).to.equal(projectId);
		expect(loadedProject.name).to.equal("Saved Project");
		expect(loadedProject.tasks.length).to.equal(5); // 4 default + 1 new
		expect(loadedProject.tasks[4]).to.be.an.instanceof(Task); // Check for re-instantiation
	});

	it("should handle corrupted saved state by loading a default project", () => {
		localStorage.setItem(Config.STORAGE_KEY_STATE, "this is not json");
		Storage.loadState();
		expect(Object.keys(State.projects).length).to.equal(1);
		expect(State.getCurrentProject().name).to.equal("My First Project");
	});
});
