import * as natural from 'natural';
import * as diff from 'fast-array-diff';
import {DeepgramWord} from './transcriber';

type Token = DeepgramWord | string;

function normalizeWord(word: string): string {
    return word
        .normalize('NFD')                   // decomposes the letters and diacritics.
        .replace(/\p{Diacritic}/gu, '')     // removes all the diacritics.
        .replaceAll(/[^\w']/g, '')          // remove all punctuation
        .toLowerCase();
}

function compare(transcriptionWord: Token, teleprompterToken: Token): boolean {
    const normalizedTranscriptionWord = normalizeWord((transcriptionWord as DeepgramWord).punctuated_word!);
    const normalizedTeleprompterToken = normalizeWord(teleprompterToken as string);

    return normalizedTranscriptionWord === normalizedTeleprompterToken;
}

function avgWordDurationSec(transcribedWords: DeepgramWord[]): number {
    return transcribedWords
        .map(word => word.end - word.start)
        .reduce((total, curr) => total + curr) / transcribedWords.length;
}

/**
 * Attaches punctuation signs to the previous word.
 * @param tokens  word tokens
 */
function collapsePunctuation(tokens: string[]) {
    const res = [];

    for (const token of tokens) {
        if (token.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/)) {
            res.push(token);
        } else {
            res[res.length - 1] += ` ${token}`;
        }
    }

    return res;
}

export class Corrector {
    private readonly tokenizer = new natural.RegexpTokenizer({ pattern: /\s+/ });
    private readonly teleprompterTokens: string[];

    constructor(teleprompterText: string) {
        this.teleprompterTokens = collapsePunctuation(this.tokenizer.tokenize(teleprompterText));
    }

    public correct(transcribedWords: DeepgramWord[]): DeepgramWord[] {
        const same = diff.same(transcribedWords, this.teleprompterTokens, compare);
        const similarity = same.length / this.teleprompterTokens.length * 100;

        console.log(`Similarity: ${similarity}%`);

        const patch = diff.getPatch(transcribedWords as Token[], this.teleprompterTokens as Token[], compare);
        const patched: Token[] = diff.applyPatch(transcribedWords as Token[], patch);

        const avgWordDuration = avgWordDurationSec(transcribedWords);
        return Corrector.ajustDurationOfInsertedWords(patched, avgWordDuration);
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