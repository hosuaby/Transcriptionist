import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default [{
    input: 'src/index.ts',
    output: {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true,
    },
    plugins: [
        resolve({
            extensions: ['.ts'],
        }),
        json(),
        commonjs(),
        typescript({
            tsconfig: './tsconfig.json',
        }),
    ],
    external: [
        'fs', 'path', 'os', 'stream', 'util',   // Node.js built-in modules
        'commander', 'fluent-ffmpeg', '@deepgram/sdk', 'natural', 'fast-array-diff', 'chalk',
        '@ffmpeg-installer/ffmpeg',
    ],
}];
