import {createClient, SyncPrerecordedResponse} from '@deepgram/sdk';
import {readFileSync} from 'fs';

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