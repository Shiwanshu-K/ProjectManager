describe("TaskManager Module", () => {
	beforeEach(() => {
		Storage.loadDefaultProject();
	});

	it("should add a new task", () => {
		const project = State.getCurrentProject();
		const initialTaskCount = project.tasks.length;
		DOM.taskNameInput.value = "My New Task";
		DOM.taskDaysInput.value = "5";

		TaskManager.saveTask();

		expect(project.tasks.length).to.equal(initialTaskCount + 1);
		const newTask = project.tasks.find((t) => t.name === "My New Task");
		expect(newTask).to.exist;
		expect(newTask.days).to.equal(5);
	});

	it("should edit an existing task", () => {
		const taskToEdit = State.getTaskById(1);
		State.editingTask = taskToEdit;
		DOM.taskNameInput.value = "Edited Task Name";
		DOM.taskDaysInput.value = "10";
		DOM.taskDoneInput.checked = true;

		TaskManager.saveTask();

		expect(taskToEdit.name).to.equal("Edited Task Name");
		expect(taskToEdit.days).to.equal(10);
		expect(taskToEdit.isDoneByUser).to.be.true;
		expect(State.editingTask).to.be.null; // Should reset editing task
	});

	it("should not allow adding a task with a duplicate name", () => {
		const project = State.getCurrentProject();
		const initialTaskCount = project.tasks.length;
		DOM.taskNameInput.value = "Plan Project"; // Name of an existing task

		TaskManager.saveTask();
		expect(project.tasks.length).to.equal(initialTaskCount);
	});

	it("should delete a task and its associated dependencies", () => {
		const project = State.getCurrentProject();
		expect(project.tasks.some((t) => t.id === 2)).to.be.true;
		expect(project.dependencies.some(([f, t]) => f === 1 && t === 2)).to.be.true;
		expect(project.dependencies.some(([f, t]) => f === 2 && t === 4)).to.be.true;

		TaskManager.deleteTask(2);

		expect(project.tasks.some((t) => t.id === 2)).to.be.false;
		expect(project.dependencies.some(([f, t]) => f === 2 || t === 2)).to.be.false;
	});

	it("should add a valid dependency", () => {
		const project = State.getCurrentProject();
		const initialDepCount = project.dependencies.length;

		TaskManager.addDependency(2, 3); // Task 2 to Task 3

		expect(project.dependencies.length).to.equal(initialDepCount + 1);
		expect(project.dependencies.some(([f, t]) => f === 2 && t === 3)).to.be.true;
	});

	it("should not add a circular dependency", () => {
		const project = State.getCurrentProject();
		const initialDepCount = project.dependencies.length;

		TaskManager.addDependency(4, 1); // This would create a cycle

		expect(project.dependencies.length).to.equal(initialDepCount);
	});

	it("should recursively uncheck dependents when a task is marked as not done", () => {
		const project = State.getCurrentProject();
		const task1 = State.getTaskById(1);
		const task2 = State.getTaskById(2);
		const task4 = State.getTaskById(4);

		// Mark all as done
		task1.isDoneByUser = true;
		task2.isDoneByUser = true;
		task4.isDoneByUser = true;
		Logic.updateTaskStatuses();
		expect(task1.status).to.equal("done");
		expect(task2.status).to.equal("done");
		expect(task4.status).to.equal("done");

		// Uncheck the first task
		TaskManager.toggleTaskDone(task1);
		Logic.updateTaskStatuses();

		expect(task1.isDoneByUser).to.be.false;
		expect(task2.isDoneByUser).to.be.false;
		expect(task4.isDoneByUser).to.be.false;
	});
});
