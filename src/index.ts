import {parseArgs} from './cli';
import {extractAudio} from './audio-extractor';
import {WorkDir} from './work-dir';
import {cpSync, writeFileSync, readFileSync} from 'fs';
import {transcribeFile} from './transcriber';
import {generateCaptions} from './captions';
import {Corrector} from './corrector';
import chalk from 'chalk';

const cliArgs = parseArgs();

const workDir = new WorkDir(cliArgs.videoInputFile);

(async () => {
    try {
        console.log(chalk.magenta('Transcriptionist starting transcription'));

        // Copy original video file
        console.log(chalk.yellow('Step 1:') + ' ' + chalk.blue('Copy original video file'));
        cpSync(cliArgs.videoInputFile, workDir.copiedVideoFile);

        // Copy teleprompter text file
        if (cliArgs.teleprompterFile) {
            console.log(chalk.yellow('Step 2:') + ' ' + chalk.blue('Copy teleprompter text file'));
            cpSync(cliArgs.teleprompterFile, workDir.teleprompterFile);
        } else {
            console.log(chalk.yellow('Step 2:') + ' ' + chalk.blue('Teleprompter text file not provided (do nothing)'));
        }

        // Extract audio
        console.log(chalk.yellow('Step 3:') + ' ' + chalk.blue('Extract audio'));
        await extractAudio(workDir.copiedVideoFile, workDir.audioFile);

        // Transcribe audio
        let transcription;
        if (!workDir.isTranscriptionExist(cliArgs.locale)) {
            console.log(chalk.yellow('Step 4:') + ' ' + chalk.blue('Transcribing audio'));
            transcription = await transcribeFile(workDir.audioFile, cliArgs.locale);
            workDir.saveTranscription(cliArgs.locale, transcription);
        } else {
            console.log(chalk.yellow('Step 4:') + ' ' + chalk.blue(`Transcription for locale '${cliArgs.locale}' already exists. (do nothing)`));
            transcription = workDir.loadExistingTranscription(cliArgs.locale);
        }

        // Get transcription words
        let transcribedWords = transcription.results.channels[0].alternatives[0].words;

        // Correct words
        if (cliArgs.teleprompterFile) {
            console.log(chalk.yellow('Step 5:') + ' ' + chalk.blue('Correcting transcription with the help of teleprompter text file'));
            const teleprompterText = readFileSync(workDir.teleprompterFile, 'utf-8');
            const corrector = new Corrector(teleprompterText);
            transcribedWords = corrector.correct(transcribedWords);
        } else {
            console.log(chalk.yellow('Step 5:') + ' ' + chalk.blue('Teleprompter text file not provided (do nothing)'));
        }

        // Generate captions
        console.log(chalk.yellow('Step 6:') + ' ' + chalk.blue('Generating captions'));
        const captionsText = generateCaptions(transcribedWords, cliArgs.maxWordsPerCaption, cliArgs.karaokeEnabled);
        writeFileSync(cliArgs.srtOutputFile, captionsText);

        console.log(chalk.green('Success:') + ' ' + `Captions written into ${cliArgs.srtOutputFile}`);
    } catch (err) {
        console.error(chalk.red('Error occurred:'), err);
    }
})();