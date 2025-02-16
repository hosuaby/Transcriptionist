import {WordsClusterer} from './words-clusterer';
import {DeepgramWord} from '../transcriber';
import nlp from 'compromise';

export class ClausesWordsClusterer implements WordsClusterer {
    cluster(deepgramWords: DeepgramWord[]): DeepgramWord[][] {
        const recognizedText = deepgramWords
            .map(word => word.punctuated_word)
            .join(' ');
        const doc = nlp(recognizedText);
        const clauses = doc.clauses().out('array');

        const clusters: DeepgramWord[][] = [];

        for (const clause of clauses) {
            const wordCount = clause.split(' ').length
            clusters.push(deepgramWords.splice(0, wordCount));
        }

        return clusters;
    }
}