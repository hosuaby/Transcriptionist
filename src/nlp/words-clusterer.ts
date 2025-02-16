import {DeepgramWord} from '../transcriber';
import {Args} from '../cli';
import {ClausesWordsClusterer} from './clauses-words-clusterer';
import {SentencesWordsClusterer} from './sentences-words-clusterer';
import {MaxLengthWordsClusterer} from './max-length-words-clusterer';

export interface WordsClusterer {
    cluster(deepgramWords: DeepgramWord[]): DeepgramWord[][];
}

export function createWordsClusterer(cliArgs: Args): WordsClusterer {
    if (cliArgs.splitByClauses) {
        return new ClausesWordsClusterer();
    } else if (cliArgs.splitBySentences) {
        return new SentencesWordsClusterer();
    } else {
        return new MaxLengthWordsClusterer(cliArgs.maxWordsPerCaption);
    }
}