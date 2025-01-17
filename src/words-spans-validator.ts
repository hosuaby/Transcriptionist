import chalk from 'chalk';
import {DeepgramWord} from './transcriber';

export function validateWordsSpans(words: DeepgramWord[]) {
    const startBeforePrecedentIndices: number[] = [];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const precedentWord = words[i - 1];

        if (word.start < precedentWord.end) {
            startBeforePrecedentIndices.push(i);
        }
    }

    if (!startBeforePrecedentIndices.length) {
        console.log(chalk.green('All words are spanned correctly.'));
    } else {
        console.log(chalk.yellow('Followed words are spanned incorrectly:'));
        for (const i of startBeforePrecedentIndices) {
            const word = words[i];
            const precedentWord = words[i - 1];

            console.log(chalk.grey('...'));
            console.log(`${ chalk.blue(precedentWord.start) } -> ${ chalk.blue(precedentWord.end) }: ${ chalk.green(precedentWord.punctuated_word) }`);
            console.log(`${ chalk.blue(word.start) } -> ${ chalk.blue(word.end) }: ${ chalk.yellow(word.punctuated_word) }`);
        }
    }
}