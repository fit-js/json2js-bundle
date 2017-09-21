import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import localResolve from 'rollup-plugin-local-resolve';
import * as pkg from './package.json';

export default {
	input: pkg.module,
	output: {
		file: pkg.main,
		format: 'cjs'
	},
	external: [
		'fit-core',
		'uglify-js',
		'gulp-uglify',
		'gulp-if',

		'babel-core',
		'readable-stream',
		'duplexer2',
		'through2',
		'vinyl-fs'
	],
	name: pkg.name,
	plugins: [
		nodeResolve ({
			module: true,
			jsnext: false,
			main: false,
			preferBuiltins: true,
			modulesOnly: false,
			extensions: ['.js', '.json']
		}),
		localResolve(),
		commonjs ({
			include: 'node_modules/**',
			ignoreGlobal: true,
			sourceMap: false,
			ignore: ['fs', 'path']
		})
	]
};
