/**
 * Represents a single task node in the graph.
 */
class Task {
	constructor(id, name, desc, x, y, isDoneByUser = false, days = 1) {
		this.id = id;
		this.name = name;
		this.desc = desc;
		this.x = x;
		this.y = y;
		this.days = days;
		this.width = 180;
		this.height = 90;
		this.status = "pending"; // This is calculated by the Logic module
		this.isDoneByUser = isDoneByUser;
	}

	/** Checks if a point (x, y) is within the task's main body. */
	contains(x, y) {
		return x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height;
	}

	/** Checks if a click is on the top-right menu area. */
	menuClicked(x, y) {
		const menuHitArea = 25;
		return x > this.x + this.width - menuHitArea && x < this.x + this.width && y > this.y && y < this.y + menuHitArea;
	}

	/** Checks if a click is on the bottom-right checkbox area. */
	checkboxClicked(x, y) {
		const checkboxHitArea = 35;
		const checkboxX = this.x + this.width - checkboxHitArea;
		const checkboxY = this.y + this.height - checkboxHitArea;
		return x >= checkboxX && x <= checkboxX + checkboxHitArea && y >= checkboxY && y <= checkboxY + checkboxHitArea;
	}

	/** Gets the task's bounding box in canvas screen coordinates */
	getRectInCanvas() {
		const project = State.getCurrentProject();
		if (!project) return { x: 0, y: 0, width: 0, height: 0 };
		return {
			x: this.x * project.zoom + project.camera.x,
			y: this.y * project.zoom + project.camera.y,
			width: this.width * project.zoom,
			height: this.height * project.zoom,
		};
	}
}
