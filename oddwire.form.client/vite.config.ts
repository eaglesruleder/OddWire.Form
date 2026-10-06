import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';

function getDevServerConfig() {
    const baseFolder =
        env.APPDATA !== undefined && env.APPDATA !== ''
            ? `${env.APPDATA}/ASP.NET/https`
            : `${env.HOME}/.aspnet/https`;

    const certificateName = "oddwire.form.client";
    const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
    const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

    if (!fs.existsSync(baseFolder)) {
        fs.mkdirSync(baseFolder, { recursive: true });
    }

    if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
        if (0 !== child_process.spawnSync('dotnet', [
            'dev-certs',
            'https',
            '--export-path',
            certFilePath,
            '--format',
            'Pem',
            '--no-password',
        ], { stdio: 'inherit', }).status) {
            throw new Error("Could not create certificate.");
        }
    }

    const target = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
        env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'https://localhost:7242';

    return {
        proxy: {
            '^/api': {
                target,
                secure: false
            },
            '^/weatherforecast': {
                target,
                secure: false
            }
        },
        port: parseInt(env.DEV_SERVER_PORT || '59392'),
        https: {
            key: fs.readFileSync(keyFilePath),
            cert: fs.readFileSync(certFilePath),
        }
    };
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
    base: env.VITE_BASE_PATH || '/',
    plugins: [plugin()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: command === 'serve' && mode !== 'test' ? getDevServerConfig() : undefined,
    build: mode === 'library'
    ?   {
            outDir: 'dist-package',
            emptyOutDir: true,
            lib: {
                entry: {
                    index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
                    styles: fileURLToPath(new URL('./src/styles.ts', import.meta.url))
                },
                formats: ['es'],
                fileName: (_format, entryName) => `${entryName}.js`,
                cssFileName: 'styles'
            },
            rollupOptions: {
                // Intent: the host owns one React runtime; package code must share it.
                external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client']
            }
        }
    :   undefined,
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        exclude: ['**/node_modules/**', 'consumer-proof/**'],
        css: false,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/**/*.d.ts', 'src/**/index.ts', 'src/main.tsx', 'src/**/*.test.{ts,tsx}']
        }
    }
}))
