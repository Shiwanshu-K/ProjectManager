/**
 * RENDERER: Handles all drawing operations on the canvas.
 */
const Renderer = {
	init() {
		// Polyfill for rounded rectangles
		CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
			if (w < 2 * r) r = w / 2;
			if (h < 2 * r) r = h / 2;
			this.beginPath();
			this.moveTo(x + r, y);
			this.arcTo(x + w, y, x + w, y + h, r);
			this.arcTo(x + w, y + h, x, y + h, r);
			this.arcTo(x, y + h, x, y, r);
			this.arcTo(x, y, x + w, y, r);
			this.closePath();
			return this;
		};
	},

	draw() {
		const { ctx, canvas } = DOM;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const project = State.getCurrentProject();
		if (!project) return;

		ctx.save();
		ctx.translate(project.camera.x, project.camera.y);
		ctx.scale(project.zoom, project.zoom);

		this._drawDependencies();
		if (State.connectingFrom && State.mouse) {
			this._drawConnectingLine();
		}
		this._drawTasks();

		ctx.restore();
	},

	_drawTasks() {
		State.getCurrentProject().tasks.forEach((task) => {
			const { ctx } = DOM;
			const colors = Config.STATUS_COLORS[task.status];

			// Main task body
			ctx.shadowColor = "rgba(0,0,0,0.2)";
			ctx.shadowBlur = 8;
			ctx.shadowOffsetY = 4;
			ctx.shadowOffsetX = 0;
			ctx.fillStyle = colors.background;
			ctx.strokeStyle = colors.border;
			ctx.lineWidth = 2.5;
			ctx.roundRect(task.x, task.y, task.width, task.height, 10).fill();
			ctx.roundRect(task.x, task.y, task.width, task.height, 10).stroke();
			ctx.shadowColor = "transparent";

			// Highlight for connection
			if (State.connectingFrom === task.id) {
				ctx.strokeStyle = Config.STATUS_COLORS.highlight;
				ctx.lineWidth = 4;
				ctx.roundRect(task.x - 2, task.y - 2, task.width + 4, task.height + 4, 12).stroke();
			}

			// Text content
			ctx.fillStyle = Config.TEXT_COLOR;
			ctx.font = "bold 14px 'JetBrains Mono', monospace";
			ctx.fillText(task.name, task.x + 12, task.y + 28);
			ctx.fillStyle = "#555";
			ctx.font = "11px 'JetBrains Mono', monospace";
			ctx.fillText(`${task.days}d`, task.x + 12, task.y + 45);

			// Status tag
			const statusText = task.status.toUpperCase();
			ctx.font = "bold 10px 'JetBrains Mono', monospace";
			const statusMetrics = ctx.measureText(statusText);
			const tagPadding = 6;
			const tagWidth = statusMetrics.width + tagPadding * 2;
			const tagHeight = 18;
			const tagX = task.x + 10;
			const tagY = task.y + task.height - 10 - tagHeight;
			ctx.fillStyle = colors.border;
			ctx.roundRect(tagX, tagY, tagWidth, tagHeight, 4).fill();
			ctx.fillStyle = colors.background;
			ctx.fillText(statusText, tagX + tagPadding, tagY + 12);

			this._drawCheckbox(task, colors);
			this._drawMenuIcon(task);
		});
	},

	_drawCheckbox(task, colors) {
		const { ctx } = DOM;
		const checkboxX = task.x + task.width - 30;
		const checkboxY = task.y + task.height - 30;
		const size = 16;
		ctx.strokeStyle = colors.border;

		if (task.status === "blocked") {
			// Blocked status shows a cross
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(checkboxX + 3, checkboxY + 3);
			ctx.lineTo(checkboxX + size - 3, checkboxY + size - 3);
			ctx.moveTo(checkboxX + size - 3, checkboxY + 3);
			ctx.lineTo(checkboxX + 3, checkboxY + size - 3);
			ctx.stroke();
		} else {
			// Pending/Done shows a checkbox
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.roundRect(checkboxX, checkboxY, size, size, 3).stroke();
			if (task.isDoneByUser) {
				ctx.lineWidth = 2.5;
				ctx.beginPath();
				ctx.moveTo(checkboxX + 3, checkboxY + size * 0.55);
				ctx.lineTo(checkboxX + size * 0.4, checkboxY + size * 0.8);
				ctx.lineTo(checkboxX + size * 0.9, checkboxY + size * 0.2);
				ctx.stroke();
			}
		}
	},

	_drawMenuIcon(task) {
		const { ctx } = DOM;
		const menuX = task.x + task.width - 15;
		ctx.fillStyle = "#6c757d";
		for (let i = 0; i < 3; i++) {
			ctx.beginPath();
			ctx.arc(menuX, task.y + 12 + i * 5, 1.5, 0, Math.PI * 2);
			ctx.fill();
		}
	},

	_drawDependencies() {
		State.getCurrentProject().dependencies.forEach(([fromId, toId]) => {
			const from = State.getTaskById(fromId);
			const to = State.getTaskById(toId);
			if (!from || !to) return;

			const fromX = from.x + from.width;
			const fromY = from.y + from.height / 2;
			const toX = to.x;
			const toY = to.y + to.height / 2;
			let color = Config.STATUS_COLORS[to.status]?.border || "#555";
			let thickness = 3;

			if (State.hoveringDependency && State.hoveringDependency[0] === fromId && State.hoveringDependency[1] === toId) {
				color = Config.STATUS_COLORS.highlight;
				thickness = 5;
			}

			this._drawArrow(fromX, fromY, toX, toY, color, false, thickness);
		});
	},

	_drawConnectingLine() {
		const from = State.getTaskById(State.connectingFrom);
		if (from) {
			const fromX = from.x + from.width;
			const fromY = from.y + from.height / 2;
			this._drawArrow(fromX, fromY, State.mouse.x, State.mouse.y, "#555", true, 3);
		}
	},

	_drawArrow(x1, y1, x2, y2, color, dashed = false, thickness = 3) {
		const { ctx } = DOM;
		ctx.beginPath();
		ctx.setLineDash(dashed ? [5, 5] : []);
		ctx.strokeStyle = color;
		ctx.lineWidth = thickness;

		const dx = x2 - x1;
		ctx.moveTo(x1, y1);
		ctx.bezierCurveTo(x1 + dx * 0.5, y1, x2 - dx * 0.5, y2, x2, y2);
		ctx.stroke();

		// Arrowhead
		const angle = Math.atan2(y2 - y1, x2 - x1);
		const length = 10;
		ctx.beginPath();
		ctx.moveTo(x2, y2);
		ctx.lineTo(x2 - length * Math.cos(angle - 0.3), y2 - length * Math.sin(angle - 0.3));
		ctx.lineTo(x2 - length * Math.cos(angle + 0.3), y2 - length * Math.sin(angle + 0.3));
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.fill();
		ctx.setLineDash([]);
	},
};
