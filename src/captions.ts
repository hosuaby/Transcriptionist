import {DateTime} from 'luxon';
import {DeepgramWord} from './transcriber';

const wordsPerCluster = 5;

interface Caption {
    start: string;
    end: string;
    word: string;
}

export function generateCaptions(deepgramWords: DeepgramWord[]): string {
    let clusters: Caption[][] = [];
    let lastCaption: Caption | null = null;
    let lastCluster: Caption[] | null = null;

    for (let word of deepgramWords) {
        const newCaption = deepgramWordToCaption(word);

        const wordCount = lastCluster?.length || 0;

        if (newCaption.start === lastCaption?.end && wordCount < wordsPerCluster) {
            lastCluster!.push(newCaption);
        } else {
            lastCluster = [];
            lastCluster.push(newCaption);
            clusters.push(lastCluster);
        }

        lastCaption = newCaption;
    }

    let n = 1;

    let allCaptions = '';

    for (let cluster of clusters) {
        for (let i = 0; i < cluster.length; i++) {
            const caption = cluster[i];
            let captionWords = '';

            for (let j = 0; j < cluster.length; j++) {
                captionWords += j === i
                    ? `[${cluster[j].word}] `
                    : `${cluster[j].word} `;
            }

            const captionStr = `${n}\n${caption.start} --> ${caption.end}\n${captionWords}\n\n`;
            n++;

            allCaptions += captionStr;
        }
    }

    return allCaptions;
}

function deepgramWordToCaption(deepgramWord: DeepgramWord): Caption {
    const startStr = secondsToTimecodes(deepgramWord.start);
    const endStr = secondsToTimecodes(deepgramWord.end);

    return {
        start: startStr,
        end: endStr,
        word: deepgramWord.punctuated_word!,
    };
}

function secondsToTimecodes(seconds: number): string {
    return DateTime
        .fromSeconds(seconds, { zone: 'utc' }).
        toFormat('HH:mm:ss.SSS');
}