import {WordsClusterer} from './words-clusterer';
import {DeepgramWord} from '../transcriber';
import {endsWithPunctuation} from '../nlp';

export class MaxLengthWordsClusterer implements WordsClusterer {
    public constructor(private readonly maxWordsPerCaption: number) {
    }

    public cluster(deepgramWords: DeepgramWord[]): DeepgramWord[][] {
        let clusters: DeepgramWord[][] = [];
        let lastWord: DeepgramWord | null = null;
        let lastCluster: DeepgramWord[] | null = null;

        for (let word of deepgramWords) {
            const wordCount = lastCluster?.length || 0;

            if (word.start === lastWord?.end
                && wordCount < this.maxWordsPerCaption
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
}