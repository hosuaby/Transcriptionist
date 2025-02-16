import { DeepgramWord } from '../transcriber';
import {WordsClusterer} from './words-clusterer';
import nlp from 'compromise';

export class SentencesWordsClusterer implements WordsClusterer {
    cluster(deepgramWords: DeepgramWord[]): DeepgramWord[][] {
        const recognizedText = deepgramWords
            .map(word => word.punctuated_word)
            .join(' ');
        const doc = nlp(recognizedText);
        const sentences = doc.sentences().out('array');

        const clusters: DeepgramWord[][] = [];

        for (const sentence of sentences) {
            const wordCount = sentence.split(' ').length
            clusters.push(deepgramWords.splice(0, wordCount));
        }

        return clusters;
    }
}