import * as natural from 'natural';
import * as diff from 'fast-array-diff';
import {DeepgramWord} from './transcriber';

type Token = DeepgramWord | string;

function isDeepgramWord(token: Token): token is DeepgramWord {
    return (token as DeepgramWord).word !== undefined;
}

interface Segment {
    removed: DeepgramWord[] | null,
    inserted: Token[],
}

interface NormalizedSegment {
    removed: DeepgramWord[] | null,
    inserted: DeepgramWord[],
    needAdjustment: boolean;    // need to adjust the start and end of words
}

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
        return Corrector.applyPatch(transcribedWords, patch);
    }

    private static applyPatch(transcribedWords: DeepgramWord[], patch: diff.Patch<Token>): DeepgramWord[] {
        const segments = Corrector
            .buildSegments(transcribedWords, patch)
            .map(Corrector.normalizeSegment);
        const avgWordDuration = avgWordDurationSec(transcribedWords);
        const res: DeepgramWord[] = [];

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];

            if (!segment.needAdjustment) {
                res.push(...segment.inserted);
            } else if (transcribedWords.length) {
                // Adjust the start and end of the words

                let startOfSegment = 0;
                let endOfSegment = 0;

                if (i === 0) {
                    // Inserted at the beginning of transcription
                    const nextSegment = segments[i + 1];
                    startOfSegment = Math.max(nextSegment.inserted[0].start - avgWordDuration * segment.inserted.length, 0);
                    endOfSegment = nextSegment.inserted[0].start;
                } else if (i === segments.length - 1) {
                    // Appended in the end of transcription
                    const precSegment = segments[i - 1];
                    startOfSegment = precSegment.inserted[precSegment.inserted.length - 1].end;
                    endOfSegment = avgWordDuration * segment.inserted.length;
                } else {
                    // Insert in the middle of transcription
                    const precSegment = segments[i - 1];
                    const nextSegment = segments[i + 1];
                    startOfSegment = precSegment.inserted[precSegment.inserted.length - 1].end;
                    endOfSegment = nextSegment.inserted[0].start;
                }

                const adjustedSegment = Corrector.adjustSegment(segment, startOfSegment, endOfSegment);
                res.push(...adjustedSegment.inserted);
            }
        }

        return res;
    }

    private static buildSegments(transcribedWords: DeepgramWord[], patch: diff.Patch<Token>): Segment[] {
        const segments: Segment[] = [];

        let sameStartAt = 0;

        for (const patchItem of patch) {
            if (sameStartAt !== patchItem.oldPos) {
                const preservedSlice = transcribedWords.slice(sameStartAt, patchItem.oldPos);
                segments[sameStartAt] = {
                    removed: null,
                    inserted: preservedSlice,
                };
            }

            if (patchItem.type === 'add') {
                segments[patchItem.newPos] ||= {
                    removed: null,
                    inserted: [],
                };
                segments[patchItem.newPos].inserted = patchItem.items;

                sameStartAt = patchItem.oldPos;
            } else if (patchItem.items) {
                // Replace items
                sameStartAt = patchItem.oldPos + patchItem.items.length;
                segments[patchItem.oldPos] ||= {
                    removed: null,
                    inserted: [],
                };
                segments[patchItem.oldPos].removed = patchItem.items as DeepgramWord[];
            } else {
                // Simply remove items
                sameStartAt = patchItem.oldPos + (patchItem as unknown as { length: number }).length;
            }
        }

        if (sameStartAt !== transcribedWords.length) {
            const remainingSlice = transcribedWords.slice(sameStartAt);
            segments[sameStartAt] = {
                removed: null,
                inserted: remainingSlice,
            };
        }

        return segments.filter(segment => segment != null);
    }

    private static normalizeSegment(segment: Segment): NormalizedSegment {
        if (isDeepgramWord(segment.inserted[0])) {
            // Inserted segments already contains Deepgram words. It's already normalized.
            return segment as NormalizedSegment;
        } else if (segment.removed != null) {
            // It's a replacement, need to provide durations for inserted words.
            const firstRemoved = segment.removed[0];
            const lastRemoved = segment.removed[segment.removed.length - 1];
            const startOfSegment = firstRemoved.start;
            const endOfSegment = lastRemoved.end;

            const normalizedSegment: NormalizedSegment = {
                removed: segment.removed,
                inserted: [],
                needAdjustment: true,
            }

            for (const insertedWord of (segment.inserted as string[])) {
                normalizedSegment.inserted.push({
                    word: insertedWord,
                    punctuated_word: insertedWord,
                    start: 0,
                    end: 0,
                    confidence: 1,
                });
            }

            return Corrector.adjustSegment(normalizedSegment, startOfSegment, endOfSegment);
        } else {
            // It's a pure insertion. Will need to adjust duration of words after.
            const normalizedSegment: NormalizedSegment = {
                removed: null,
                inserted: [],
                needAdjustment: true,
            }

            for (const insertedWord of (segment.inserted as string[])) {
                normalizedSegment.inserted.push({
                    word: insertedWord,
                    punctuated_word: insertedWord,
                    start: 0,
                    end: 0,
                    confidence: 1,
                });
            }

            return normalizedSegment;
        }
    }

    private static adjustSegment(normalizedSegment: NormalizedSegment,
                                 startOfSegment: number,
                                 endOfSegment: number): NormalizedSegment {
        const segmentDuration = endOfSegment - startOfSegment;
        const durationPerInsertedWord = segmentDuration / normalizedSegment.inserted.length;

        let startTime = startOfSegment;

        for (const insertedWord of normalizedSegment.inserted) {
            insertedWord.start = startTime;
            insertedWord.end = (startTime += durationPerInsertedWord);
        }

        normalizedSegment.needAdjustment = false;

        return normalizedSegment;
    }
}