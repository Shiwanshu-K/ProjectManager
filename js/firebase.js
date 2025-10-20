// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// SECURITY WARNING: Exposing API keys in client-side code can be a risk.
// Ensure you have set up proper Firebase Security Rules and/or App Check to protect your data.
const firebaseConfig = {
	apiKey: "AIzaSyBRkq7Ad3C0oMSkQZUoMORMp4O6IsrxpDU",
	authDomain: "projectmanager-3457f.firebaseapp.com",
	projectId: "projectmanager-3457f",
	storageBucket: "projectmanager-3457f.firebasestorage.app",
	messagingSenderId: "416783862541",
	appId: "1:416783862541:web:41550e058112c0df60fe44",
	measurementId: "G-NNCQWY723B",
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const analytics = getAnalytics(firebaseApp);