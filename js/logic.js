/**
 * LOGIC: Handles pure business logic and state calculations.
 */
const Logic = {
	updateTaskStatuses() {
		const project = State.getCurrentProject();
		if (!project) return;

		const MAX_ITERATIONS = project.tasks.length + 1;
		for (let i = 0; i < MAX_ITERATIONS; i++) {
			let hasChanged = false;
			project.tasks.forEach((task) => {
				const predecessors = project.dependencies.filter(([, to]) => to === task.id).map(([from]) => State.getTaskById(from));
				const isBlocked = predecessors.some((p) => p && p.status !== "done");

				let newStatus = "pending";
				if (isBlocked) {
					newStatus = "blocked";
					if (task.isDoneByUser) {
						task.isDoneByUser = false;
						hasChanged = true;
					}
				} else if (task.isDoneByUser) {
					newStatus = "done";
				}

				if (task.status !== newStatus) {
					task.status = newStatus;
					hasChanged = true;
				}
			});
			if (!hasChanged) break; // Optimization: stop if no changes in a full pass
		}
	},

	createsCycle(fromId, toId) {
		const project = State.getCurrentProject();
		if (!project) return false;

		const stack = [toId];
		const visited = new Set([toId]);
		while (stack.length > 0) {
			const currentId = stack.pop();
			if (currentId === fromId) return true;

			const neighbors = project.dependencies.filter(([f]) => f === currentId).map(([, t]) => t);
			for (const neighborId of neighbors) {
				if (!visited.has(neighborId)) {
					visited.add(neighborId);
					stack.push(neighborId);
				}
			}
		}
		return false;
	},

	calculateRanks() {
		const project = State.getCurrentProject();
		const rankMap = new Map();
		if (!project) return rankMap;

		project.tasks.forEach((task) => rankMap.set(task.id, 0));

		// Iteratively update ranks
		for (let i = 0; i < project.tasks.length; i++) {
			project.tasks.forEach((task) => {
				const predecessors = project.dependencies.filter(([, to]) => to === task.id).map(([from]) => from);
				if (predecessors.length > 0) {
					const maxPredecessorRank = Math.max(...predecessors.map((id) => rankMap.get(id) || 0));
					rankMap.set(task.id, maxPredecessorRank + 1);
				}
			});
		}
		return rankMap;
	},

	calculateEndDateIgnoringWeekends(startDate, durationInDays) {
		let currentDate = new Date(startDate.getTime());
		let remainingDays = Math.ceil(durationInDays);
		if (remainingDays <= 0) return currentDate;

		let daysToAdvance = 0;
		// Loop until we have advanced the required number of business days PAST the start date.
		// -1 because the start day is day 1
		while (daysToAdvance < remainingDays - 1) {
			currentDate.setDate(currentDate.getDate() + 1);
			let dayOfWeek = currentDate.getDay();
			if (dayOfWeek !== 0 && dayOfWeek !== 6) {
				// 0=Sun, 6=Sat
				daysToAdvance++;
			}
		}
		return currentDate;
	},

	calculateTaskSchedule() {
		const project = State.getCurrentProject();
		if (!project || project.tasks.length === 0) return [];

		const excludeWeekends = DOM.excludeWeekendsCheckbox.checked;
		const projectStartDate = new Date((project.startDate || new Date().toISOString().split("T")[0]) + "T00:00:00");
		projectStartDate.setHours(0, 0, 0, 0);

		const taskDataMap = new Map();
		project.tasks.forEach((task) => {
			taskDataMap.set(task.id, {
				task: task,
				earliestStartMs: projectStartDate.getTime(),
				durationMs: task.days * 24 * 3600 * 1000,
				endMs: 0,
			});
		});

		const sortedTasks = [...project.tasks].sort((a, b) => this.calculateRanks().get(a.id) - this.calculateRanks().get(b.id));

		sortedTasks.forEach((task) => {
			const taskInfo = taskDataMap.get(task.id);
			const predecessors = project.dependencies.filter(([, to]) => to === task.id).map(([from]) => from);
			let latestPredecessorEndMs = projectStartDate.getTime();

			predecessors.forEach((predId) => {
				const predInfo = taskDataMap.get(predId);
				if (predInfo) {
					latestPredecessorEndMs = Math.max(latestPredecessorEndMs, predInfo.endMs);
				}
			});

			let startDate = new Date(latestPredecessorEndMs);

			if (excludeWeekends) {
				if (predecessors.length > 0) {
					startDate.setDate(startDate.getDate() + 1);
				}
				// Adjust start date to the next business day
				let dayOfWeek = startDate.getDay();
				if (dayOfWeek === 6) startDate.setDate(startDate.getDate() + 2); // Saturday
				else if (dayOfWeek === 0) startDate.setDate(startDate.getDate() + 1); // Sunday
			}

			taskInfo.earliestStartMs = startDate.getTime();

			let endDate;
			if (excludeWeekends) {
				endDate = this.calculateEndDateIgnoringWeekends(startDate, task.days);
			} else {
				endDate = new Date(taskInfo.earliestStartMs + taskInfo.durationMs - 1);
			}

			taskInfo.endMs = endDate.getTime();
		});

		return Array.from(taskDataMap.values()).map((info) => [
			String(info.task.id),
			info.task.name,
			new Date(info.earliestStartMs),
			new Date(info.endMs),
			null, // Duration (ms) - Google Charts calculates this
			info.task.status === "done" ? 100 : 0,
			project.dependencies
				.filter(([, to]) => to === info.task.id)
				.map(([from]) => String(from))
				.join(","),
		]);
	},
};
