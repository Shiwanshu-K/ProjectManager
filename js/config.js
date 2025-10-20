/**
 * CONFIG: Static configuration values for the application.
 */
const Config = {
	STATUS_COLORS: {
		blocked: { background: "#f8d7da", border: "#dc3545", text: "#dc3545" },
		pending: { background: "#fff3cd", border: "#ffc107", text: "#ffc107" },
		done: { background: "#d4edda", border: "#28a745", text: "#28a745" },
		highlight: "#007bff", // Color for dependency highlight
	},
	TEXT_COLOR: "#333",
	COLUMN_SPACING: 250,
	ROW_SPACING: 120,
	CANVAS_PADDING_X: 50,
	CANVAS_PADDING_Y: 100, // Increased top padding to avoid toolbar
	STORAGE_KEY_STATE: "taskDepVizState_v3", // Updated key for new data structure
	STORAGE_KEY_COACHMARK_DONE: "taskDepVizCoachmarkDone",
	DEPENDENCY_HIT_TOLERANCE: 12, // Click/hover area around dependency
	GANTT_OPTIONS: {
		height: 275,
		gantt: {
			labelStyle: {
				fontName: "Roboto Mono",
				fontSize: 14,
				color: "#000000",
			},
		},
	},
	MIN_ZOOM: 0.2,
	MAX_ZOOM: 3,
	ZOOM_SENSITIVITY: 1.1,
	LONG_PRESS_THRESHOLD: 500, // ms
	TAP_MOVE_THRESHOLD: 10, // pixels
};
