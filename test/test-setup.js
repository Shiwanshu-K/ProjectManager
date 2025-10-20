// Mock browser functions that might interfere with tests
let prompt_val = "";
let confirm_val = false;
window.prompt = () => prompt_val;
window.confirm = () => confirm_val;
window.alert = (msg) => console.log("Alert:", msg); // Log alerts instead of showing them

// Mock Date.now() for predictable IDs
let dateNow = Date.now();
const originalDateNow = Date.now;

// Global test hooks
before(() => {
	// Freeze time for tests
	Date.now = () => ++dateNow;
});

after(() => {
	// Restore time after tests
	Date.now = originalDateNow;
});

beforeEach(() => {
	// Reset state before each test
	localStorage.clear();
	State.projects = {};
	State.currentProjectId = null;
	State.editingTask = null;
	State.connectingFrom = null;
	prompt_val = "";
	confirm_val = false;
});
