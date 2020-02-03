'use strict';

const PORT = 7542;

let http = require('http');
let fs = require('fs');
let path = require('path');

let internalServerError = (error, res) => {
	console.error(Error(error));

	res.statusCode = 500;
	res.end('Internal server error');
};

let generateDirectoryList = (url, files) => {
	let response = '<!DOCTYPE html><html><head><title>';
	response += url;
	response += '</title><style>';
	response += 'body { font-family: sans-serif; }';
	response += '</style></head><body><h1>';
	response += url;
	response += '</h1><ul>';

	for (let file of files) {
		response += '<li><a href="';
		response += url + '/' + file;
		response += '">';
		response += file;
		response += '</a></li>';
	}

	response += '</ul></body></html>';

	return response;
};

let rangeNotSatisfiable = res => {
	res.statusCode = 416;
	res.end('Requested range not satisfiable');
};

let streamFile = (req, res, fileName, stat) => {
	let fileStream;

	if (req.headers.range) {
		if (!req.headers.range.startsWith('bytes=') ||
			req.headers.range.includes(','))
			return rangeNotSatisfiable(res);

		let range = req.headers.range.replace(/^bytes=/, '').split('-');
		let start = parseInt(range[0]);
		let end = range[1] ? parseInt(range[1]) : stat.size - 1;

		if (start < 0 || end > stat.size - 1 || start >= end)
			return rangeNotSatisfiable(res);

		fileStream = fs.createReadStream(fileName, {
			start: start,
			end: end
		});

		res.statusCode = 206;
		res.setHeader('Content-Range', 'bytes ' +
			start + '-' + end + '/' + stat.size);
		res.setHeader('Content-Length', (end - start) + 1);
	}
	else {
		fileStream = fs.createReadStream(fileName);
		res.setHeader('Content-Length', stat.size);
	}

	fileStream.on('end', () => res.end());
	fileStream.pipe(res);
};

let saveAndSendFile = (fileName, inRes, outRes) => {
	let fileStream = fs.createWriteStream(fileName);

	outRes.removeHeader('Accept-Ranges');
	outRes.setHeader('Content-Type', 'application/octet-stream');
	outRes.setHeader('Content-Length', inRes.headers['content-length']);

	inRes.on('end', () => {
		fileStream.end();
		outRes.end();
	});

	inRes.pipe(fileStream);
	inRes.pipe(outRes);
};

let handleExisting = (config, req, res, fileName) => {
	fs.stat(fileName,
		(err, stat) => {
			if (err) return internalServerError(err, res);

			if (stat.isDirectory()) return fs.readdir(fileName,
				(err, files) => {
					if (err) return internalServerError(err, res);

					res.setHeader('Content-Type', 'text/html; charset=utf-8');
					res.end(generateDirectoryList(req.url, files));
				});

			let urlRepo = req.url.replace(/^\//, '').replace(/\/.*$/, '');

			for (let repo in config.repos) {
				if (repo === urlRepo) {
					for (let distRegex of config.repos[repo].dists) {
						distRegex = new RegExp(distRegex);
						if (req.url.match(distRegex) &&
							Date() - stat.mtime > config.distTimeout * 60000)
							return fs.unlink(fileName,
								() => handleFile(config, req, res, fileName)
							);
					}

					break;
				}
			}

			streamFile(req, res, fileName, stat);
		});
};

let handleFile = (config, req, res, fileName, exists) => {
	if (exists) return handleExisting(config, req, res, fileName);

	let urlRepo = req.url.replace(/^\//, '').replace(/\/.*$/, '');

	for (let repo in config.repos) {
		if (repo === urlRepo) {
			let url = config.repos[repo].mirror;
			url += req.url.replace(new RegExp('^/' + repo), '');

			return http.get(url, getRes => {
				if (getRes.statusCode !== 200) {
					res.writeHead(getRes.statusCode, getRes.headers);
					getRes.on('end', () => res.end());
					return getRes.pipe(res);
				}

				let fileDir = path.dirname(fileName);

				fs.exists(fileDir, exists => {
					if (!exists)
						return fs.mkdir(fileDir, {
							recursive: true
						}, () => saveAndSendFile(fileName, getRes, res));

					fs.stat(fileDir, (err, stat) => {
						if (err) return internalServerError(err, res);

						if (!stat.isDirectory())
							return fs.unlink(fileDir,
								() => fs.mkdir(fileDir, {
									recursive: true
								}, () => saveAndSendFile(fileName, getRes, res))
							);

						saveAndSendFile(fileName, getRes, res);
					});
				});
			});
		}
	}

	res.statusCode = 404;
	res.end('Not found');
};

let handleServer = (config, req, res) => {
	res.setHeader('Accept-Ranges', 'bytes');
	res.setHeader('Content-Type', 'text/plain; charset=utf-8');

	if (req.method !== 'GET') {
		res.statusCode = 405;
		res.setHeader('Allow', 'GET');
		res.end('Method not allowed');
	}

	let fileName = config.cacheDir + req.url;
	fs.exists(fileName, exists => handleFile(config, req, res, fileName, exists));
};

let startServer = config => http.createServer(
	(req, res) => handleServer(config, req, res)
).listen(PORT);

module.exports.startServer = startServer;
