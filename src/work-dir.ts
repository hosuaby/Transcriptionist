import * as path from 'path';
import {mkdirSync, existsSync, writeFileSync, readFileSync} from 'fs';
import {SyncPrerecordedResponse} from '@deepgram/sdk';

const outDir = path.join(__dirname, '..', 'out');

export class WorkDir {
    private readonly workDir: string;

    constructor(private readonly videoInputFile: string) {
        const fileBasename = path.basename(videoInputFile);
        this.workDir = path.join(outDir, fileBasename);

        if (!existsSync(this.workDir)) {
            mkdirSync(this.workDir);
        }

        if (!existsSync(this.transcriptionsDir)) {
            mkdirSync(this.transcriptionsDir);
        }
    }

    public get copiedVideoFile(): string {
        const ext = path.extname(this.videoInputFile);
        return path.join(this.workDir, `original.${ext}`);
    }

    public get audioFile(): string {
        return path.join(this.workDir, 'audio.wav');
    }

    public get teleprompterFile(): string {
        return path.join(this.workDir, 'teleprompter.txt');
    }

    public get transcriptionsDir(): string {
        return path.join(this.workDir, 'transcriptions');
    }

    public isTranscriptionExist(locale: string): boolean {
        const transcriptionFile = this.transcriptionFile(locale);
        return existsSync(transcriptionFile);
    }

    public saveTranscription(locale: string, transcription: SyncPrerecordedResponse) {
        const transcriptionFile = this.transcriptionFile(locale);
        writeFileSync(transcriptionFile, JSON.stringify(transcription, null, 2));
    }

    public loadExistingTranscription(locale: string): SyncPrerecordedResponse {
        const transcriptionFile = this.transcriptionFile(locale);
        return JSON.parse(readFileSync(transcriptionFile, 'utf-8'));
    }

    private transcriptionFile(locale: string): string {
        return path.join(this.transcriptionsDir, `transcription.${locale}.json`);
    }
}