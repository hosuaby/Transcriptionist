import * as path from 'path';
import {Command} from '@commander-js/extra-typings';
import packageJson from '../package.json';

export interface Args {
    videoInputFile: string;
    srtOutputFile: string;
    teleprompterFile?: string
    locale: string;
    maxWordsPerCaption: number;
    karaokeEnabled: boolean;
}

function assertFileExtension(ext: string): (v: string) => void {
    return (value: string) => {
        if (!value.endsWith(ext)) {
            throw new Error(`File should have extension ${ext}!`);
        }
        return value;
    };
}

function parseIntAndAssert(...assertions: ((v: number) => void)[]): (v: string) => number {
    return (value: string) => {
        const int = parseInt(value, 10);
        assertions.forEach(assertion => assertion(int));
        return int;
    }
}

function assertPositive(option: string): (v: number) => void {
    return (value: number) => {
        if (value < 0) {
            throw new Error(`${option} should be positive!`);
        }
    };
}

const program = new Command();

program
    .name('transcribe')
    .description('Tool to transcribe videos using AI.')
    .version(packageJson.version)
    .argument('<file>', 'Path to the original video file.')
    .option('-o, --output <file>',
        'Full or relative path where the created SubRip Subtitle (.srt) file should be written. ' +
        'By default, it will be saved in the same directory as the input video file.',
        assertFileExtension('.srt'))
    .option('-t, --teleprompt <file>',
        'Full or relative path to teleprompter text (.txt) file. ' +
        'If not provided, transcription will not be corrected.',
        assertFileExtension('.txt'))
    .option('-l, --locale <string>',
        'Locale that will be used to transcribe the video.',
        'en-US')
    .option('-n, --length <number>',
        'Maximum number of words per caption.',
        parseIntAndAssert(assertPositive('Max caption length')),
        5)
    .option('-k, --karaoke',
        'Enables Karaoke-style captioning supported by PupCaps.')
    .action((inputFile, options: any) => {
        const absoluteInputFile = path.resolve(inputFile);
        program.args[0] = absoluteInputFile;

        if (!options.output) {
            const outputDir = path.dirname(absoluteInputFile);
            const fileBasename = path.basename(absoluteInputFile, path.extname(inputFile));
            options.output = path.join(outputDir, `${fileBasename}.srt`);
        } else {
            options.output = path.resolve(options.output);
        }

        if (options.teleprompt) {
            options.teleprompt = path.resolve(options.teleprompt);
        }
    });

export function parseArgs(): Args {
    program.parse();
    const opts = program.opts() as any;

    return {
        videoInputFile: program.args[0],
        srtOutputFile: opts.output,
        teleprompterFile: opts.teleprompt,
        locale: opts.locale,
        maxWordsPerCaption: opts.length,
        karaokeEnabled: opts.karaoke,
    };
}