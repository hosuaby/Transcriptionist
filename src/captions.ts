import {DeepgramWord} from './transcriber';

interface Caption {
    start: string;
    end: string;
    word: string;
}

export function generateCaptions(wordsClusters: DeepgramWord[][], karaoke = false): string {
    const captions = wordsClusters
        .map(cluster => cluster.map(deepgramWordToCaption));
    return karaoke ? generateKaraoke(captions) : generateSimple(captions);
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
    const millis = Math.floor(seconds * 1000) % 1000;

    const hours = Math.floor(seconds / 3600);
    const remainingSecondsAfterHours = seconds % 3600;
    const minutes = Math.floor(remainingSecondsAfterHours / 60);
    const remainingSecondsAfterMinutes = remainingSecondsAfterHours % 60;
    const wholeSeconds = Math.floor(remainingSecondsAfterMinutes);

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(wholeSeconds).padStart(2, '0');
    const sss = String(millis).padStart(3, '0');

    return `${hh}:${mm}:${ss},${sss}`;
}