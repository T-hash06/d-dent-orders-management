import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import type { PluginOptions } from 'babel-plugin-react-compiler';
import { defineConfig, type PluginOption } from 'vite';
import babel from 'vite-plugin-babel';
import tsconfigPaths from 'vite-tsconfig-paths';

// create a local variable and cast to satisfy Vite's PluginOption type
const paraglidePlugin = paraglideVitePlugin({
	project: './app/features/i18n/project.inlang',
	outdir: './app/features/i18n/paraglide',
	strategy: [
		'url',
		'preferredLanguage',
		'cookie',
		'localStorage',
		'baseLocale',
	],
}) as unknown as PluginOption;

const reactCompilerConfig: PluginOptions = {};

export default defineConfig({
	plugins: [
		paraglidePlugin,
		tailwindcss(),
		reactRouter(),
		babel({
			filter: /\.[jt]sx?$/,
			babelConfig: {
				presets: ['@babel/preset-typescript'],
				plugins: [['babel-plugin-react-compiler', reactCompilerConfig]],
				compact: true,
				generatorOpts: {
					minified: true,
				},
			},
		}),
		tsconfigPaths(),
	],
});
