/**
 * COACHMARKS: Handles the user feature tour.
 */
const Coachmarks = {
	currentStep: 0,
	steps: [
		{
			title: "Welcome!",
			text: "Let's take a quick tour of the Task Dependency Visualizer.",
		},
		{
			element: "#addTask",
			title: "Add a Task",
			text: "Click this button to create a new task. You'll set its name, duration, and description.",
		},
		{
			element: "#arrangeBtn",
			title: "Arrange Tasks",
			text: "After adding tasks, click here to automatically organize them into a clean, logical layout.",
		},
		{
			element: "#ganttBtn",
			title: "Generate Gantt Chart",
			text: "Visualize your project timeline by generating a Gantt chart.",
		},
		{
			isCanvas: true,
			target: "firstTask",
			title: "Task Nodes",
			text: "This is a task. Drag it to move it. Its color indicates its status: pending (yellow), done (green), or blocked (red).",
		},
		{
			isCanvas: true,
			target: "firstTask",
			title: "Create Dependencies",
			text: "Double-click (or long-press on mobile) any task to start drawing a dependency line. Then, tap another task to complete the link.",
		},
		{
			isCanvas: true,
			target: "firstTaskCheckbox",
			title: "Complete a Task",
			text: "Click the checkbox to mark a task as done. This updates the status of any dependent tasks.",
		},
		{
			isCanvas: true,
			target: "firstTaskMenu",
			title: "Edit or Delete",
			text: "Click the three dots in the top-right corner of a task to open a menu to edit or delete it.",
		},
		{
			title: "You're All Set!",
			text: "That's everything you need to know. Enjoy managing your project!",
		},
	],

	init() {
		DOM.coachmarkNextBtn.onclick = () => this.next();
		DOM.coachmarkPrevBtn.onclick = () => this.prev();
		DOM.coachmarkDoneBtn.onclick = () => this.end();
		DOM.helpBtn.onclick = () => this.start();
	},

	start() {
		this.currentStep = 0;
		DOM.coachmarkOverlay.style.display = "block";
		this.showStep(this.currentStep);
	},

	end() {
		DOM.coachmarkOverlay.style.display = "none";
		localStorage.setItem(Config.STORAGE_KEY_COACHMARK_DONE, "true");
		UI.collapseSidebar();
	},

	next() {
		if (this.currentStep < this.steps.length - 1) {
			this.currentStep++;
			this.showStep(this.currentStep);
		}
	},

	prev() {
		if (this.currentStep > 0) {
			this.currentStep--;
			this.showStep(this.currentStep);
		}
	},

	showStep(index) {
		const step = this.steps[index];
		const { coachmarkHighlight, coachmarkBox, coachmarkTitle, coachmarkText } = DOM;

		const showStepContent = () => {
			coachmarkTitle.textContent = step.title;
			coachmarkText.textContent = step.text;
			DOM.coachmarkStepCounter.textContent = `${index + 1} / ${this.steps.length}`;

			DOM.coachmarkPrevBtn.style.display = index === 0 ? "none" : "inline-block";
			DOM.coachmarkNextBtn.style.display = index === this.steps.length - 1 ? "none" : "inline-block";
			DOM.coachmarkDoneBtn.style.display = index === this.steps.length - 1 ? "inline-block" : "none";

			if (step.element || step.isCanvas) {
				let targetRect;
				if (step.isCanvas) {
					// Logic to highlight a canvas element (e.g., the first task)
					const project = State.getCurrentProject();
					const task = project?.tasks[0];
					if (!task) {
						this.end();
						alert("Please add a task to continue the tour.");
						return;
					}
					// Pan camera to the task
					App.goToContent();
					const canvasRect = DOM.canvas.getBoundingClientRect();
					let { x, y, width: w, height: h } = task.getRectInCanvas();

					if (step.target === "firstTaskCheckbox") {
						const area = 35 * project.zoom;
						x = x + w - area;
						y = y + h - area;
						w = h = area;
					} else if (step.target === "firstTaskMenu") {
						const area = 25 * project.zoom;
						x = x + w - area;
						w = h = area;
					}
					targetRect = { top: y + canvasRect.top, left: x + canvasRect.left, width: w, height: h };
				} else {
					const targetElement = document.querySelector(step.element);
					if (!targetElement) return this.end();
					targetRect = targetElement.getBoundingClientRect();
				}

				coachmarkHighlight.style.top = `${targetRect.top - 5}px`;
				coachmarkHighlight.style.left = `${targetRect.left - 5}px`;
				coachmarkHighlight.style.width = `${targetRect.width + 10}px`;
				coachmarkHighlight.style.height = `${targetRect.height + 10}px`;
				coachmarkHighlight.style.display = "block";
				coachmarkBox.style.bottom = "30px"; // Position the box at the bottom
			} else {
				coachmarkHighlight.style.display = "none";
				coachmarkBox.style.top = "50%"; // Center the box
				coachmarkBox.style.left = "50%";
				coachmarkBox.style.transform = "translate(-50%, -50%)";
			}
		};

		const targetElement = step.element ? document.querySelector(step.element) : null;
		const isTargetInSidebar = targetElement && DOM.toolbar.contains(targetElement);
		const isSidebarCollapsed = DOM.sidebar.classList.contains("collapsed");
		let needsAnimationDelay = false;

		if (isTargetInSidebar && isSidebarCollapsed) {
			UI.expandSidebar();
			needsAnimationDelay = true;
		} else if (!isTargetInSidebar && !isSidebarCollapsed) {
			UI.collapseSidebar();
			needsAnimationDelay = true;
		}

		setTimeout(showStepContent, needsAnimationDelay ? 350 : 0);
	},
};
