import App from './App.svelte';
import './jquery.min.js';
import './kendo.all.min.js';
import './rxjs.umd.min.js';

const app = new App({
	target: document.getElementById('app')
	//target: document.body
});

export default app;