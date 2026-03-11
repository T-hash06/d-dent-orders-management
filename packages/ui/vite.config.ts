import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
	plugins: [
		react(),
		dts({
			insertTypesEntry: true,
			tsconfigPath: resolve(__dirname, 'tsconfig.app.json'),
		}),
	],

	resolve: {
		alias: {
			// Esto mapea el alias de shadcn a la ruta real de tu proyecto
			'@': resolve(__dirname, './src'),
		},
	},

	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: '@d-dentaditamentos/ui',
			formats: ['es', 'cjs'],
			fileName: (format) => `index.${format}.js`,
		},
		rollupOptions: {
			external: ['react', 'react-dom', 'tailwindcss'],
			output: {
				globals: {
					react: 'React',
					'react-dom': 'ReactDOM',
				},
			},
		},
	},
});
