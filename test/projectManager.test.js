describe("ProjectManager Module", () => {
	beforeEach(() => {
		Storage.loadDefaultProject();
	});

	it("should create a new project and switch to it", () => {
		const initialProjectCount = Object.keys(State.projects).length;
		prompt_val = "New Test Project";
		ProjectManager.createNewProject();

		expect(Object.keys(State.projects).length).to.equal(initialProjectCount + 1);
		expect(State.getCurrentProject().name).to.equal("New Test Project");
	});

	it("should not create a project with an empty name", () => {
		const initialProjectCount = Object.keys(State.projects).length;
		prompt_val = "  "; // Whitespace only
		ProjectManager.createNewProject();
		expect(Object.keys(State.projects).length).to.equal(initialProjectCount);
	});

	it("should rename the current project", () => {
		prompt_val = "Renamed Project";
		ProjectManager.renameProject();
		expect(State.getCurrentProject().name).to.equal("Renamed Project");
	});

	it("should delete the current project and switch to another", () => {
		const originalProjectId = State.currentProjectId;
		prompt_val = "Second Project";
		ProjectManager.createNewProject(); // Now on "Second Project"

		expect(Object.keys(State.projects).length).to.equal(2);
		const secondProjectId = State.currentProjectId;
		expect(secondProjectId).to.not.equal(originalProjectId);

		confirm_val = true;
		ProjectManager.deleteProject();

		expect(State.projects[secondProjectId]).to.be.undefined;
		expect(Object.keys(State.projects).length).to.equal(1);
		expect(State.currentProjectId).to.equal(originalProjectId);
	});

	it("should delete the last project and create a new default one", () => {
		expect(Object.keys(State.projects).length).to.equal(1);
		confirm_val = true;
		ProjectManager.deleteProject();

		expect(Object.keys(State.projects).length).to.equal(1);
		expect(State.getCurrentProject().name).to.equal("My First Project");
	});
});
