const
	pug = require(`pug`),
	Vinyl = require(`vinyl`),
	{Transform} = require(`stream`);

module.exports = function pugClient(options = {}) {
	const
		{
			name = `pug`,
			module = false,
		} = options,
		pugClientOptions = Object.assign({
			filename: `Pug`,
			doctype: `html`,
		}, options.options);

	function ii(literals, ...args) {
			let str = '';
			for (var i = 0; i < args.length; i++) {
				let literal = literals[i].match(/(?<rest>.*?)(?<tabs>\t*)$/s).groups;
				str += literal.rest;
				str += String(args[i]).split('\n').map(line => literal.tabs + line).join('\n');
			}

			str += literals[i];
			function leadingTabs(str) {
				return str.match(/^\t*/)[0].length;
			}

			let
				lines = str.split('\n'),
				addedIndent = Number(lines[0][0]) || 0,
				baseIndent = leadingTabs(lines[1]);

			return lines.slice(1, -1)
				.map(line => {
					let tabNum = Math.max(leadingTabs(line) - baseIndent + addedIndent, 0);
					return '\t'.repeat(tabNum) + line.replace(/^\t*/, '');
				}).join('\n');
		}

	const pugs = [];
	let dir;
	return new Transform({
		objectMode: true,
		flush(callback) {
			let bigPug = `case ${pugClientOptions.self ? `self.` : ``}__pug_template_name\n`;
			for (let i = 0; i < pugs.length; i++) {
				bigPug += ii`1
					when '${pugs[i].name}'
						${pugs[i].pug}\n
				`;
			}

			const pwd = process.cwd();
			process.chdir(dir);
				const pugFunction = pug.compileClient(bigPug, pugClientOptions);
			process.chdir(pwd);

			this.push(new Vinyl({
				path: `./${name}.js`,
				contents: Buffer.from(ii`
					${module === true ? `export default ` : ``}function ${name}(name, locals) {
						${pugFunction}

						return template(Object.assign({__pug_template_name: name}, locals));
					}
				`),
			}));

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
