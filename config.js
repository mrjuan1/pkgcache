'use strict';

const CONFIG_PATH = './config.json';

let fs = require('fs');

let validateConfig = config => {
	const requireFields = [
		'cacheDir',
		'distTimeout',
		'repos'
	];

	for (let field of requireFields) {
		if (!config[field])
			return Error('Field "' + field + '" missing from config file "' + CONFIG_PATH + '"');
	}

	let numRepos = Object.keys(config.repos).length;
	if (numRepos < 1)
		return Error('No repos found in the config file "' + CONFIG_PATH + '"');

	for (let repoName in config.repos) {
		let repo = config.repos[repoName];
		if (!repo.mirror)
			return Error('Repo "' + repoName + '" has no mirror in config file "' + CONFIG_PATH + '"');
	}

	return true;
};

let loadConfig = () => new Promise(
	(res, rej) => fs.readFile(CONFIG_PATH, (err, data) => {
		if (err) return rej(Error(err));

		let config;
		try {
			config = JSON.parse(data);
		}
		catch (e) {
			return rej(Error(err));
		}

		let validationResult = validateConfig(config);
		if (validationResult !== true)
			return rej(validationResult);

		res(config);
	})
);

module.exports.loadConfig = loadConfig;
