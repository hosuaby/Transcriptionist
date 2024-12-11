import {DateTime} from 'luxon';
import {DeepgramWord} from './transcriber';
import {endsWithPunctuation} from './nlp';

interface Caption {
    start: string;
    end: string;
    word: string;
}

export function generateCaptions(deepgramWords: DeepgramWord[], maxWordsPerCaption: number, karaoke = false): string {
    const words = deepgramWords.map(deepgramWordToCaption);
    const clusters = clusterWords(words, maxWordsPerCaption);
    return karaoke ? generateKaraoke(clusters) : generateSimple(clusters);
}

function clusterWords(words: Caption[], maxWordsPerCaption: number): Caption[][] {
    let clusters: Caption[][] = [];
    let lastWord: Caption | null = null;
    let lastCluster: Caption[] | null = null;

    for (let word of words) {
        const wordCount = lastCluster?.length || 0;

        if (word.start === lastWord?.end
            && wordCount < maxWordsPerCaption
            && !endsWithPunctuation(lastWord.word)) {
            lastCluster!.push(word);
        } else {
            lastCluster = [];
            lastCluster.push(word);
            clusters.push(lastCluster);
        }

        lastWord = word;
    }

    return clusters;
}

function generateSimple(clusters: Caption[][]): string {
    let n = 1;

    let allCaptions = '';

    for (let cluster of clusters) {
        const firstWord = cluster[0];
        const lastWord = cluster[cluster.length - 1];
        const captionWords = cluster.map(caption => caption.word).join(' ');

        const captionStr = `${n}\n${firstWord.start} --> ${lastWord.end}\n${captionWords}\n\n`;
        n++;

        allCaptions += captionStr;
    }

    return allCaptions;
}

function generateKaraoke(clusters: Caption[][]): string {
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
        word: deepgramWord.punctuated_word ?? deepgramWord.word,
    };
}

export function secondsToTimecodes(seconds: number): string {
    return DateTime
        .fromSeconds(seconds, { zone: 'utc' }).
        toFormat('HH:mm:ss.SSS');
}