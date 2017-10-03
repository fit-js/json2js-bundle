import fs from 'fs';
import path from 'path';

import del from 'del';
import vfs from 'vinyl-fs';
import gulpPlumber from 'gulp-plumber';
import gulpBabel from 'gulp-babel';
import gulpConcat from 'gulp-concat';
import gulpIf from 'gulp-if';
import gulpUglify from 'gulp-uglify';
import babelArrowPlugin from 'babel-plugin-transform-es2015-arrow-functions';

let utils, develop, watchers = {}, output, source_cwd, cwd;

export function init (config, core) {
	utils  = core.utils;
	develop = core.args.env() === 'develop';

	output = config.output;
	source_cwd = path.join (process.cwd(), config.cwd);
	buildAll();

	let bs = core.globals.get('bs');

	if (develop && bs) {
		// change/add callback
		let modify = (file) => {

			let name = path.basename (file, '.json') + '.js';
			let contents = core.utils.json (path.join (source_cwd, file));
			cwd = contents.cwd || source_cwd;

			if (watchers.hasOwnProperty (name)) {
				// build current list of files
				build (contents, name);

				// unwatch old list of files inside json
				watchers[name].close();
			}

			// watch new list of files inside
			watchers[name] = bs.watch (contents.files, {
				cwd: cwd
			})
				.on('change', () => {
					build (contents, name);
				});
		};

		// delete callback
		let unlink = (file) => {
			let name = path.basename (file, '.json');

			// unwatch files inside json
			if (watchers.hasOwnProperty (name)) {
				watchers[name].close();
			}

			// remove json's related js
			del ([name + '.js', name + '.map'], {
				cwd: output
			});
		};

		bs.watch ('*.json', {
			cwd: source_cwd,
			ignoreInitial: false
		})
			.on ('add', modify)
			.on ('change', modify)
			.on ('unlink', unlink);
	}
}

function applyToFiles (cb) {
	let items = fs.readdirSync (source_cwd)
		.filter (function (file) {
			return file.toString().endsWith ('.json');
		});

	for (let i = 0, len = items.length; i < len; i++) {
		cb (items[i]);
	}
}

function build (contents, name) {
	if (!contents) return false;
	let sourcemaps = (!contents.skip && contents.sourcemaps !== false) && develop;
	let minimize = (!contents.skip && contents.minimize !== false) || !develop;
	let opts = {
		sourcemaps: sourcemaps,
		cwd: contents.cwd ?
			path.join (process.cwd(), contents.cwd) : source_cwd
	};

	contents.files = utils.filterNonExistingFiles (contents.files, opts.cwd);

	return vfs.src (contents.files, opts)
		.pipe (gulpPlumber())
		.pipe (gulpBabel ({ plugins: [babelArrowPlugin] }))
		.pipe (gulpConcat (name))
		.pipe (gulpIf (minimize, gulpUglify()))
		.pipe (vfs.dest (output, {
			sourcemaps: (!contents.skip && develop) ? '.' : false
		}));
}

function buildAll () {
	applyToFiles ((file) => {
		let name = path.basename (file, '.json') + '.js';
		let contents = utils.json (path.join (source_cwd, file));

		// build current list of files
		build(contents, name);
	});
}
