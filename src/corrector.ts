import * as diff from 'fast-array-diff';
import {DeepgramWord} from './transcriber';
import {normalizeWord} from './nlp';
import nlp from 'compromise';

type Token = DeepgramWord | string;

function compare(transcriptionWord: Token, teleprompterToken: Token): boolean {
    const normalizedTranscriptionWord = normalizeWord((transcriptionWord as DeepgramWord).word!);
    const normalizedTeleprompterToken = normalizeWord(teleprompterToken as string);

    return normalizedTranscriptionWord === normalizedTeleprompterToken;
}

function avgWordDurationSec(transcribedWords: DeepgramWord[]): number {
    return transcribedWords
        .map(word => word.end - word.start)
        .reduce((total, curr) => total + curr) / transcribedWords.length;
}

export class Corrector {
    private readonly teleprompterTokens: string[];

    constructor(teleprompterText: string) {
        const doc = nlp(teleprompterText);
        this.teleprompterTokens = doc.terms().out('array');
    }

    public correct(transcribedWords: DeepgramWord[]): DeepgramWord[] {
        const same = diff.same(transcribedWords, this.teleprompterTokens, compare);
        const similarity = same.length / this.teleprompterTokens.length * 100;

        console.log(`Similarity: ${similarity}%`);

        let patch = diff.getPatch(transcribedWords as Token[], this.teleprompterTokens as Token[], compare);
        patch = Corrector.handleReplacements(patch);
        const patched: Token[] = diff.applyPatch(transcribedWords as Token[], patch);

        const avgWordDuration = avgWordDurationSec(transcribedWords);
        return Corrector.ajustDurationOfInsertedWords(patched, avgWordDuration);
    }

    private static handleReplacements(patch: diff.Patch<Token>): diff.Patch<Token> {
        for (let i = 0; i < patch.length; i++) {
            const currentOp = patch[i];
            const precOp: diff.PatchItem<Token> | null = i ? patch[i - 1] : null;

            if (currentOp.type === 'add' && precOp?.type === 'remove') {
                // This is replacement
                let adjustedWords: DeepgramWord[];

                if (currentOp.items.length === precOp.items.length) {
                    // Use the start and the end of every word individually
                    adjustedWords = [];
                    for (let j = 0; j < currentOp.items.length; j++) {
                        const newWord = currentOp.items[j] as string;
                        const replacedWord = precOp.items[j] as DeepgramWord;
                        adjustedWords.push({
                            word: newWord,
                            punctuated_word: newWord,
                            start: replacedWord.start,
                            end: replacedWord.end,
                            confidence: 1,
                        });
                    }
                } else {
                    const startTime = (precOp.items[0] as DeepgramWord).start;
                    const endTime = (precOp.items[precOp.items.length - 1] as DeepgramWord).end;
                    adjustedWords = Corrector.adjustWords(currentOp.items as string[], startTime, endTime);
                }

                currentOp.items = adjustedWords;
            }
        }

        return patch;
    }

    private static ajustDurationOfInsertedWords(patchedTokens: Token[], avgWordDuration: number): DeepgramWord[] {
        const result: DeepgramWord[] = [];

        let segmentStart: number | null = null;
        let segmentEnd: number | null = null;

        for (let i = 0; i < patchedTokens.length; i++) {
            if (typeof patchedTokens[i] === 'string' && segmentStart === null) {
                // Beginning of adjusted segment
                segmentStart = i;
            } else if (typeof patchedTokens[i] != 'string' && segmentStart != null) {
                // Adjusted segment finished
                segmentEnd = i - 1;
                const wordsToAdjust: string[] = patchedTokens.slice(segmentStart, i) as string[];
                const currentToken = patchedTokens[i] as DeepgramWord;

                if (segmentStart === 0) {
                    // Inserted at the beginning of transcription
                    const nbInserted = segmentEnd - segmentStart + 1;
                    const segmentDuration = nbInserted * avgWordDuration;
                    const segmentStartTime = Math.max(currentToken.start - segmentDuration, 0);
                    const segmentEndTime = currentToken.start;
                    const adjustedWords = Corrector.adjustWords(wordsToAdjust, segmentStartTime, segmentEndTime);
                    result.push(...adjustedWords);
                } else {
                    // Insert in the middle of transcription
                    const lastAsjustedWord = result.pop()!;
                    const wordsToReadjust: string[] = [
                        lastAsjustedWord.punctuated_word || lastAsjustedWord.word,
                        ...wordsToAdjust,
                        currentToken.punctuated_word || currentToken.word
                    ];
                    const segmentStartTime = lastAsjustedWord.start
                    const segmentEndTime = currentToken.end;
                    const adjustedWords = Corrector.adjustWords(wordsToReadjust, segmentStartTime, segmentEndTime);
                    result.push(...adjustedWords);
                }

                // Reset adjusted segment
                segmentStart = null;
                segmentEnd = null;

                // Add current element to the result
                result.push(patchedTokens[i] as DeepgramWord);
            } else if (typeof patchedTokens[i] != 'string') {
                // Add current element to the result
                result.push(patchedTokens[i] as DeepgramWord);
            }
        }

        if (segmentStart != null && result.length) {
            // Insert in the end
            const wordsToAdjust: string[] = patchedTokens.slice(segmentStart) as string[];
            const lastAsjustedWord = result[result.length - 1];
            const segmentStartTime = lastAsjustedWord.start;
            const segmentEndTime = segmentStartTime + wordsToAdjust.length * avgWordDuration;
            const adjustedWords = Corrector.adjustWords(wordsToAdjust, segmentStartTime, segmentEndTime);
            result.push(...adjustedWords);
        }

        return result;
    }

    private static adjustWords(words: string[], startTime: number, endTime: number): DeepgramWord[] {
        const segmentDuration = endTime - startTime;
        const durationPerInsertedWord = segmentDuration / words.length;

        let time = startTime;
        const adjustedWords: DeepgramWord[] = [];

        for (const word of words) {
            const deepgramWord: DeepgramWord = {
                word: word,
                punctuated_word: word,
                start: time,
                end: (time += durationPerInsertedWord),
                confidence: 1,
            };
            adjustedWords.push(deepgramWord);
        }

        return adjustedWords;
    }
}