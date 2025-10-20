/**
 * DOM: A single point of reference for all DOM elements.
 */
const DOM = {
	canvas: document.getElementById("canvas"),
	ctx: document.getElementById("canvas").getContext("2d"),
	// Sidebar & Toolbar
	sidebar: document.getElementById("sidebar"),
	sidebarToggle: document.getElementById("sidebarToggle"),
	toolbar: document.getElementById("toolbar"),
	addTaskBtn: document.getElementById("addTask"),
	arrangeBtn: document.getElementById("arrangeBtn"),
	goToContentBtn: document.getElementById("goToContentBtn"),
	ganttBtn: document.getElementById("ganttBtn"),
	projectStartDateInput: document.getElementById("projectStartDate"),
	helpBtn: document.getElementById("helpBtn"),
	// Project Management
	projectSelector: document.getElementById("projectSelector"),
	newProjectBtn: document.getElementById("newProjectBtn"),
	renameProjectBtn: document.getElementById("renameProjectBtn"),
	deleteProjectBtn: document.getElementById("deleteProjectBtn"),
	// Task Modal
	taskModal: document.getElementById("taskModal"),
	taskNameInput: document.getElementById("taskName"),
	taskDaysInput: document.getElementById("taskDays"),
	taskDescInput: document.getElementById("taskDesc"),
	taskDoneInput: document.getElementById("taskDone"),
	saveTaskBtn: document.getElementById("saveTask"),
	closeModalBtn: document.getElementById("closeModal"),
	// Gantt Modal
	ganttModal: document.getElementById("ganttModal"),
	ganttChartDiv: document.getElementById("ganttChartDiv"),
	closeGanttModalBtn: document.getElementById("closeGanttModal"),
	exportGanttCsvBtn: document.getElementById("exportGanttCsvBtn"),
	excludeWeekendsCheckbox: document.getElementById("excludeWeekends"),
	// Node Menu
	nodeMenu: document.getElementById("nodeMenu"),
	editBtn: document.getElementById("editBtn"),
	deleteBtn: document.getElementById("deleteBtn"),
	// Dependency Menu
	dependencyMenu: document.getElementById("dependencyMenu"),
	// Coachmarks
	coachmarkOverlay: document.getElementById("coachmark-overlay"),
	coachmarkHighlight: document.getElementById("coachmark-highlight"),
	coachmarkBox: document.getElementById("coachmark-box"),
	coachmarkTitle: document.getElementById("coachmark-title"),
	coachmarkText: document.getElementById("coachmark-text"),
	coachmarkStepCounter: document.getElementById("coachmark-step-counter"),
	coachmarkPrevBtn: document.getElementById("coachmark-prev"),
	coachmarkNextBtn: document.getElementById("coachmark-next"),
	coachmarkDoneBtn: document.getElementById("coachmark-done"),
};
