#!/usr/bin/env node

let config = require('./config');
let server = require('./server');

let loadConfig = config.loadConfig;

let main = async () => {
	try {
		let config = await loadConfig();
		server.startServer(config);
	}
	catch (e) {
		console.error(e);
		process.exit(1);
	}
};

main();
