import {createClient, SyncPrerecordedResponse} from '@deepgram/sdk';
import {readFileSync} from 'fs';
import chalk from 'chalk';

export interface DeepgramWord {
    word: string;
    start: number;
    end: number;
    confidence: number;
    punctuated_word?: string;
    speaker?: number;
    speaker_confidence?: number;
    language?: string;
}

export async function transcribeFile(audioFile: string, locale: string): Promise<SyncPrerecordedResponse> {
    const deepgramApiKey = process.env['DEEPGRAM_API_KEY'];
    if (!deepgramApiKey) {
        throw new Error('Environment variable DEEPGRAM_API_KEY is missing.');
    }

    const deepgram = createClient(deepgramApiKey);

    console.log('Start transcription...');

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
        readFileSync(audioFile),
        {
            model: 'nova-2',
            language: locale,
            smart_format: true,
            punctuate: true,
            diarize: true,
        }
    );

    if (error) {
        throw error;
    }

    console.log('Transcription finished!');

    return result;
}

export function printTranscription(transcription: SyncPrerecordedResponse) {
    const transcribedWords = transcription.results.channels[0].alternatives[0].words;

    for (const word of transcribedWords) {
        let coloredWord;

        if (word.confidence > 0.8) {
            coloredWord = chalk.green(word.punctuated_word);
        } else if (word.confidence > 0.5) {
            coloredWord = chalk.yellow(word.punctuated_word);
        } else {
            coloredWord = chalk.red(word.punctuated_word);
        }

        console.log(`${ chalk.blue(word.start) } -> ${ chalk.blue(word.end) }: ${ coloredWord }`);
    }
}