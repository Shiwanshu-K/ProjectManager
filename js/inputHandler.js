/**
 * InputHandler: Manages all user input on the canvas (mouse, touch, wheel).
 */
const InputHandler = {
	offsetX: 0,
	offsetY: 0,
	longPressTimer: null,
	touchStartPos: null,
	initialPinchDistance: null,

	init() {
		const canvas = DOM.canvas;
		// Mouse Listeners
		canvas.addEventListener("mousedown", this.handlePointerDown.bind(this));
		canvas.addEventListener("mousemove", this.handlePointerMove.bind(this));
		canvas.addEventListener("mouseup", this.handlePointerUp.bind(this));
		canvas.addEventListener("dblclick", this.handleDoubleClick.bind(this));
		canvas.addEventListener("wheel", this.handleWheel.bind(this));
		// Touch Listeners
		canvas.addEventListener("touchstart", this.handlePointerDown.bind(this));
		canvas.addEventListener("touchmove", this.handlePointerMove.bind(this));
		canvas.addEventListener("touchend", this.handlePointerUp.bind(this));
		canvas.addEventListener("touchcancel", this.handlePointerUp.bind(this));
	},

	// --- Pointer Position Calculation ---

	_getPointerPos(e) {
		const rect = DOM.canvas.getBoundingClientRect();
		const project = State.getCurrentProject();
		if (!project) return { x: 0, y: 0, canvasX: 0, canvasY: 0, clientX: 0, clientY: 0 };

		const pointer = e.touches ? e.touches[0] || e.changedTouches[0] : e;
		const clientX = pointer.clientX;
		const clientY = pointer.clientY;
		const canvasX = clientX - rect.left;
		const canvasY = clientY - rect.top;

		return {
			x: (canvasX - project.camera.x) / project.zoom, // World coords
			y: (canvasY - project.camera.y) / project.zoom, // World coords
			canvasX,
			canvasY,
			clientX,
			clientY,
		};
	},

	getCanvasCenterInWorld() {
		const project = State.getCurrentProject();
		if (!project) return { x: 0, y: 0 };
		const canvasCenterX = DOM.canvas.width / 2;
		const canvasCenterY = DOM.canvas.height / 2;
		return {
			x: (canvasCenterX - project.camera.x) / project.zoom,
			y: (canvasCenterY - project.camera.y) / project.zoom,
		};
	},

	// --- Event Handlers ---

	handlePointerDown(e) {
		if (e.type === "touchstart") e.preventDefault();

		const pos = this._getPointerPos(e);
		this.touchStartPos = pos;
		UI.hideNodeMenu();
		UI.hideDependencyTooltip();
		clearTimeout(this.longPressTimer);

		const project = State.getCurrentProject();
		if (!project) return;

		// Check for task interaction
		for (const task of [...project.tasks].reverse()) {
			if (task.contains(pos.x, pos.y)) {
				if (e.type === "touchstart") {
					// On touch, long press starts a dependency connection
					this.longPressTimer = setTimeout(() => {
						State.connectingFrom = task.id;
						this.longPressTimer = null;
						State.dragging = null;
						Renderer.draw();
					}, Config.LONG_PRESS_THRESHOLD);
				} else if (task.menuClicked(pos.x, pos.y)) {
					// On mouse, clicking the menu icon shows the menu
					UI.showNodeMenu(task, pos.clientX, pos.clientY);
					return;
				}
				// Otherwise, start dragging the task
				State.dragging = task;
				this.offsetX = pos.x - task.x;
				this.offsetY = pos.y - task.y;
				return;
			}
		}

		// Check for pinch-to-zoom start
		if (e.touches && e.touches.length === 2) {
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			this.initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
		} else {
			// Otherwise, start panning
			State.panning = true;
			State.lastPanPos = { x: pos.clientX, y: pos.clientY };
			DOM.canvas.style.cursor = "grabbing";
		}
	},

	handlePointerMove(e) {
		if (e.type === "touchmove") e.preventDefault();

		const pos = this._getPointerPos(e);
		State.mouse = pos;
		const project = State.getCurrentProject();
		if (!project) return;

		// Cancel long press if finger moves
		if (this.longPressTimer) clearTimeout(this.longPressTimer);

		// Handle pinch-to-zoom
		if (e.touches && e.touches.length === 2 && this.initialPinchDistance) {
			this.handlePinchZoom(e);
			return;
		}

		// Handle panning
		if (State.panning) {
			const dx = pos.clientX - State.lastPanPos.x;
			const dy = pos.clientY - State.lastPanPos.y;
			project.camera.x += dx;
			project.camera.y += dy;
			State.lastPanPos = { x: pos.clientX, y: pos.clientY };
			Renderer.draw();
		} else if (State.dragging) {
			// Handle dragging a task
			State.dragging.x = pos.x - this.offsetX;
			State.dragging.y = pos.y - this.offsetY;
			Renderer.draw();
		} else if (State.connectingFrom) {
			// Draw the connection line
			Renderer.draw();
		} else {
			// Handle hover effects for dependencies
			const isOverTask = project.tasks.some((task) => task.contains(pos.x, pos.y));
			const dependencyHit = this.getDependencyAtPoint(pos.x, pos.y);

			if (dependencyHit && !isOverTask && e.type === "mousemove") {
				DOM.canvas.style.cursor = "pointer";
				if (State.hoveringDependency?.[0] !== dependencyHit[0] || State.hoveringDependency?.[1] !== dependencyHit[1]) {
					UI.showDependencyTooltip([dependencyHit[0], dependencyHit[1]], dependencyHit[2], dependencyHit[3]);
					Renderer.draw();
				}
			} else {
				DOM.canvas.style.cursor = isOverTask ? "default" : "grab";
				if (State.hoveringDependency) {
					UI.hideDependencyTooltip();
					Renderer.draw();
				}
			}
		}
	},

	handlePointerUp(e) {
		clearTimeout(this.longPressTimer);
		this.initialPinchDistance = null;
		let stateChanged = false;

		const pos = this._getPointerPos(e);
		const project = State.getCurrentProject();
		if (!project) return;

		// Check if it was a tap (minimal movement)
		const dx = pos.clientX - this.touchStartPos.clientX;
		const dy = pos.clientY - this.touchStartPos.clientY;
		const isTap = Math.sqrt(dx * dx + dy * dy) < Config.TAP_MOVE_THRESHOLD;

		if (isTap) {
			this.handleTap(pos);
		}

		// End dragging
		if (State.dragging) {
			stateChanged = true;
			State.dragging = null;
		}

		// End panning
		if (State.panning) {
			State.panning = false;
			DOM.canvas.style.cursor = "grab";
			stateChanged = true;
		}

		// End dependency connection (on mouse up)
		if (State.connectingFrom && e.type === "mouseup") {
			const target = project.tasks.find((t) => t.contains(pos.x, pos.y));
			if (target) {
				TaskManager.addDependency(State.connectingFrom, target.id);
				stateChanged = true; // addDependency will save state
			}
			State.connectingFrom = null;
			Renderer.draw();
		}

		if (stateChanged) {
			Storage.saveState();
		}
	},

	handleTap(pos) {
		const project = State.getCurrentProject();
		if (!project) return;

		// If in connecting mode, a tap on a task completes the dependency
		if (State.connectingFrom) {
			const tappedTask = project.tasks.find((t) => t.contains(pos.x, pos.y));
			if (tappedTask) {
				TaskManager.addDependency(State.connectingFrom, tappedTask.id);
			}
			State.connectingFrom = null; // Always exit connecting mode on tap
			Renderer.draw();
			return;
		}

		// Check for checkbox click
		for (const task of project.tasks) {
			if (task.checkboxClicked(pos.x, pos.y)) {
				TaskManager.toggleTaskDone(task);
				return;
			}
		}

		// Check for menu click
		for (const task of project.tasks) {
			if (task.menuClicked(pos.x, pos.y)) {
				UI.showNodeMenu(task, pos.clientX, pos.clientY);
				return;
			}
		}

		// Check for dependency line tap (replaces hover for touch)
		const dependencyHit = this.getDependencyAtPoint(pos.x, pos.y);
		if (dependencyHit) {
			UI.showDependencyTooltip([dependencyHit[0], dependencyHit[1]], dependencyHit[2], dependencyHit[3]);
			Renderer.draw();
			return;
		}

		// If nothing else was tapped, hide any open menus
		UI.hideDependencyTooltip();
		Renderer.draw();
	},

	handleDoubleClick(e) {
		const pos = this._getPointerPos(e);
		const project = State.getCurrentProject();
		if (!project) return;
		const clickedTask = project.tasks.find((t) => t.contains(pos.x, pos.y));
		if (clickedTask) {
			// Double click starts a dependency connection
			State.connectingFrom = clickedTask.id;
			UI.hideDependencyTooltip();
			Renderer.draw();
		}
	},

	handleWheel(e) {
		e.preventDefault();
		const project = State.getCurrentProject();
		if (!project) return;

		const pos = this._getPointerPos(e);
		const zoomFactor = e.deltaY < 0 ? Config.ZOOM_SENSITIVITY : 1 / Config.ZOOM_SENSITIVITY;
		const newZoom = Math.max(Config.MIN_ZOOM, Math.min(Config.MAX_ZOOM, project.zoom * zoomFactor));

		// Adjust camera to zoom towards the cursor
		project.camera.x = pos.canvasX - (pos.canvasX - project.camera.x) * (newZoom / project.zoom);
		project.camera.y = pos.canvasY - (pos.canvasY - project.camera.y) * (newZoom / project.zoom);
		project.zoom = newZoom;

		Storage.saveState();
		Renderer.draw();
	},

	handlePinchZoom(e) {
		const project = State.getCurrentProject();
		if (!project) return;
		const dx = e.touches[0].clientX - e.touches[1].clientX;
		const dy = e.touches[0].clientY - e.touches[1].clientY;
		const currentPinchDistance = Math.sqrt(dx * dx + dy * dy);

		const zoomFactor = currentPinchDistance / this.initialPinchDistance;
		this.initialPinchDistance = currentPinchDistance; // Update for next move

		const newZoom = Math.max(Config.MIN_ZOOM, Math.min(Config.MAX_ZOOM, project.zoom * zoomFactor));

		// Center zoom on midpoint of touches
		const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
		const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
		project.camera.x = midX - (midX - project.camera.x) * (newZoom / project.zoom);
		project.camera.y = midY - (midY - project.camera.y) * (newZoom / project.zoom);
		project.zoom = newZoom;

		Renderer.draw();
	},

	getDependencyAtPoint(x, y) {
		const project = State.getCurrentProject();
		if (!project) return null;
		const tolerance = Config.DEPENDENCY_HIT_TOLERANCE / project.zoom;

		for (const [fromId, toId] of project.dependencies) {
			const from = State.getTaskById(fromId);
			const to = State.getTaskById(toId);
			if (!from || !to) continue;

			// Check along the bezier curve for proximity
			const x1 = from.x + from.width,
				y1 = from.y + from.height / 2;
			const x2 = to.x,
				y2 = to.y + to.height / 2;
			const steps = 10;
			for (let i = 0; i <= steps; i++) {
				const t = i / steps;
				const dx = x2 - x1;
				const px = (1 - t) ** 3 * x1 + 3 * (1 - t) ** 2 * t * (x1 + dx * 0.5) + 3 * (1 - t) * t ** 2 * (x2 - dx * 0.5) + t ** 3 * x2;
				const py = (1 - t) ** 3 * y1 + 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3 * y2;
				if (Math.sqrt((x - px) ** 2 + (y - py) ** 2) <= tolerance) {
					return [fromId, toId, px, py];
				}
			}
		}
		return null;
	},
};
