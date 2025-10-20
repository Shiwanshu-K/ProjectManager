describe("Logic Module", () => {
	beforeEach(() => {
		// Load a default project for logic tests
		Storage.loadDefaultProject();
	});

	describe("Task Status Updates", () => {
		it("should mark a task as 'blocked' if its predecessor is not 'done'", () => {
			const project = State.getCurrentProject();
			// Task 2 depends on Task 1. Task 1 is not done.
			project.tasks[0].isDoneByUser = false;
			Logic.updateTaskStatuses();
			const task1 = State.getTaskById(1);
			const task2 = State.getTaskById(2);
			expect(task1.status).to.equal("pending");
			expect(task2.status).to.equal("blocked");
		});

		it("should mark a task as 'pending' if its predecessor is 'done'", () => {
			const project = State.getCurrentProject();
			// Task 2 depends on Task 1. Task 1 is done.
			project.tasks[0].isDoneByUser = true;
			Logic.updateTaskStatuses(); // First update to set task 1 to done
			Logic.updateTaskStatuses(); // Second update to reflect change on task 2
			const task1 = State.getTaskById(1);
			const task2 = State.getTaskById(2);
			expect(task1.status).to.equal("done");
			expect(task2.status).to.equal("pending");
		});

		it("should automatically uncheck a 'done' task if it becomes 'blocked'", () => {
			const project = State.getCurrentProject();
			// Mark both as done initially
			project.tasks[0].isDoneByUser = true; // Task 1
			project.tasks[1].isDoneByUser = true; // Task 2
			Logic.updateTaskStatuses(); // Run once to set statuses
			expect(State.getTaskById(1).status).to.equal("done");
			expect(State.getTaskById(2).status).to.equal("done");

			// Now, un-complete the predecessor
			project.tasks[0].isDoneByUser = false;
			Logic.updateTaskStatuses(); // Re-run logic
			expect(State.getTaskById(1).status).to.equal("pending");
			const task2 = State.getTaskById(2);
			expect(task2.status).to.equal("blocked");
			expect(task2.isDoneByUser).to.be.false;
		});
	});

	describe("Cycle Detection", () => {
		it("should detect a direct cycle (A -> B, B -> A)", () => {
			const project = State.getCurrentProject();
			project.dependencies.push([2, 1]); // Task 1 -> 2 exists, now add 2 -> 1
			expect(Logic.createsCycle(2, 1)).to.be.true;
		});

		it("should detect an indirect cycle (A -> B -> C -> A)", () => {
			const project = State.getCurrentProject();
			// A(1) -> B(2), B(2) -> D(4), let's add D(4) -> A(1)
			expect(Logic.createsCycle(4, 1)).to.be.true;
		});

		it("should return false when no cycle is created", () => {
			const project = State.getCurrentProject();
			// Add a valid dependency: Task 1 -> Task 4
			expect(Logic.createsCycle(1, 4)).to.be.false;
		});
	});

	describe("Gantt Chart Schedule Calculation", () => {
		it("should calculate a simple schedule with no weekends", () => {
			const project = State.getCurrentProject();
			project.tasks = [new Task(1, "A", "", 0, 0, false, 3)]; // 3 day task
			project.dependencies = [];
			project.startDate = "2025-10-17"; // A Friday
			DOM.excludeWeekendsCheckbox.checked = true;

			const schedule = Logic.calculateTaskSchedule();
			const taskA = schedule[0];
			const startDate = new Date(taskA[2]);
			const endDate = new Date(taskA[3]);

			// Starts on Fri, Oct 17. Ends on Tue, Oct 21 (Fri, Mon, Tue)
			expect(startDate.toISOString().split("T")[0]).to.equal("2025-10-17");
			expect(endDate.toISOString().split("T")[0]).to.equal("2025-10-21");
		});

		it("should calculate a schedule including weekends", () => {
			const project = State.getCurrentProject();
			project.tasks = [new Task(1, "A", "", 0, 0, false, 3)]; // 3 day task
			project.dependencies = [];
			project.startDate = "2025-10-17"; // A Friday
			DOM.excludeWeekendsCheckbox.checked = false;

			const schedule = Logic.calculateTaskSchedule();
			const taskA = schedule[0];
			const startDate = new Date(taskA[2]);
			const endDate = new Date(taskA[3]);

			// Starts on Fri, Oct 17. Ends on Sun, Oct 19 (Fri, Sat, Sun)
			expect(startDate.toISOString().split("T")[0]).to.equal("2025-10-17");
			expect(endDate.toISOString().split("T")[0]).to.equal("2025-10-19");
		});
	});
});
