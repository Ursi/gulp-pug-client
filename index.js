const
	pugClient = require(`pug-client`),
	Vinyl = require(`vinyl`),
	{Transform} = require(`stream`);

module.exports = function(options = {}) {
	const pugs = [];
	let dir;
	return new Transform({
		objectMode: true,
		flush(callback) {
			if (pugs.length) {
				this.push(new Vinyl({
					path: `./${options.name || `pug`}.js`,
					contents: Buffer.from(pugClient(pugs, dir, options)),
				}));
			}

			callback();
		},
		transform(file, encoding, callback) {
			if (!dir) dir = file.base;
			pugs.push({
				name: file.stem,
				pug: file.contents.toString(),
			});

			callback();
		},
	});
}
