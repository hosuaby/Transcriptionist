'use strict';

var path = require('path');
var require$$0 = require('commander');
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var sdk = require('@deepgram/sdk');
var luxon = require('luxon');
var natural = require('natural');
var diff = require('fast-array-diff');
var chalk = require('chalk');

function _interopNamespaceDefault(e) {
	var n = Object.create(null);
	if (e) {
		Object.keys(e).forEach(function (k) {
			if (k !== 'default') {
				var d = Object.getOwnPropertyDescriptor(e, k);
				Object.defineProperty(n, k, d.get ? d : {
					enumerable: true,
					get: function () { return e[k]; }
				});
			}
		});
	}
	n.default = e;
	return Object.freeze(n);
}

var path__namespace = /*#__PURE__*/_interopNamespaceDefault(path);
var natural__namespace = /*#__PURE__*/_interopNamespaceDefault(natural);
var diff__namespace = /*#__PURE__*/_interopNamespaceDefault(diff);

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var extraTypings = {exports: {}};

var hasRequiredExtraTypings;

function requireExtraTypings () {
	if (hasRequiredExtraTypings) return extraTypings.exports;
	hasRequiredExtraTypings = 1;
	(function (module, exports) {
		const commander = require$$0;

		exports = module.exports = {};

		// Return a different global program than commander,
		// and don't also return it as default export.
		exports.program = new commander.Command();

		/**
		 * Expose classes. The FooT versions are just types, so return Commander original implementations!
		 */

		exports.Argument = commander.Argument;
		exports.Command = commander.Command;
		exports.CommanderError = commander.CommanderError;
		exports.Help = commander.Help;
		exports.InvalidArgumentError = commander.InvalidArgumentError;
		exports.InvalidOptionArgumentError = commander.InvalidArgumentError; // Deprecated
		exports.Option = commander.Option;

		// In Commander, the create routines end up being aliases for the matching
		// methods on the global program due to the (deprecated) legacy default export.
		// Here we roll our own, the way Commander might in future.
		exports.createCommand = (name) => new commander.Command(name);
		exports.createOption = (flags, description) =>
		  new commander.Option(flags, description);
		exports.createArgument = (name, description) =>
		  new commander.Argument(name, description); 
	} (extraTypings, extraTypings.exports));
	return extraTypings.exports;
}

var extraTypingsExports = requireExtraTypings();
var extraTypingsCommander = /*@__PURE__*/getDefaultExportFromCjs(extraTypingsExports);

// wrapper to provide named exports for ESM.
const {
  program: program$1,
  createCommand,
  createArgument,
  createOption,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError, // deprecated old name
  Command,
  Argument,
  Option,
  Help,
} = extraTypingsCommander;

var name = "transcriptionist";
var version = "1.0.0-alpha";
var description = "Tool to transcribe videos using AI.";
var author = "Alexei KLENIN <alexei.klenin@gmail.com> (https://github.com/hosuaby)";
var license = "Apache-2.0";
var main = "dist/index.js";
var bin = {
	transcribe: "./transcribe"
};
var repository = {
	type: "git",
	url: "git+https://github.com/hosuaby/Transcriptionist.git"
};
var bugs = {
	url: "https://github.com/hosuaby/Transcriptionist/issues"
};
var homepage = "https://github.com/hosuaby/Transcriptionist#readme";
var keywords = [
	"video",
	"transcribe",
	"ai",
	"deepgram"
];
var dependencies = {
	"@deepgram/sdk": "^3.9.0",
	chalk: "^4.1.2",
	commander: "^12.1.0",
	"fast-array-diff": "^1.1.0",
	"fluent-ffmpeg": "^2.1.3",
	luxon: "^3.5.0",
	natural: "^8.0.1"
};
var devDependencies = {
	"@commander-js/extra-typings": "^12.1.0",
	"@rollup/plugin-commonjs": "^28.0.1",
	"@rollup/plugin-json": "^6.1.0",
	"@rollup/plugin-node-resolve": "^15.3.0",
	"@types/chalk": "^2.2.4",
	"@types/fluent-ffmpeg": "^2.1.27",
	"@types/luxon": "^3.4.2",
	"@types/natural": "^5.1.5",
	"@types/node": "^22.9.3",
	rollup: "^4.27.4",
	"rollup-plugin-typescript2": "^0.36.0",
	typescript: "^5.7.2"
};
var scripts = {
	build: "rollup -c"
};
var packageJson = {
	name: name,
	version: version,
	description: description,
	author: author,
	license: license,
	main: main,
	bin: bin,
	repository: repository,
	bugs: bugs,
	homepage: homepage,
	keywords: keywords,
	dependencies: dependencies,
	devDependencies: devDependencies,
	scripts: scripts
};

function assertFileExtension(ext) {
    return (value) => {
        if (!value.endsWith(ext)) {
            throw new Error(`File should have extension ${ext}!`);
        }
        return value;
    };
}
const program = new Command();
program
    .name('transcribe')
    .description('Tool to transcribe videos using AI.')
    .version(packageJson.version)
    .argument('<file>', 'Path to the original video file.')
    .option('-o, --output <file>', `Full or relative path where the created SubRip Subtitle (.srt) file should be written.
        By default, it will be saved in the same directory as the input video file.`, assertFileExtension('.srt'))
    .option('-t, --teleprompt <file>', `Full or relative path to teleprompter text (.txt) file.
        If not provided, transcription will not be corrected.`, assertFileExtension('.txt'))
    .option('-l, --locale <string>', 'Locale that will be used to transcribe the video (default: en-US).', 'en-US')
    .action((inputFile, options) => {
    const absoluteInputFile = path__namespace.resolve(inputFile);
    program.args[0] = absoluteInputFile;
    if (!options.output) {
        const outputDir = path__namespace.dirname(absoluteInputFile);
        const fileBasename = path__namespace.basename(absoluteInputFile, path__namespace.extname(inputFile));
        options.output = path__namespace.join(outputDir, `${fileBasename}.srt`);
    }
    else {
        options.output = path__namespace.resolve(options.output);
    }
    if (options.teleprompt) {
        options.teleprompt = path__namespace.resolve(options.teleprompt);
    }
});
function parseArgs() {
    program.parse();
    const opts = program.opts();
    return {
        videoInputFile: program.args[0],
        srtOutputFile: opts.output,
        teleprompterFile: opts.teleprompt,
        locale: opts.locale,
    };
}

async function extractAudio(videoInputFile, audioOutputFile) {
    console.log(`Extracting audio into ${audioOutputFile}...`);
    await new Promise((resolve, reject) => {
        ffmpeg()
            .input(videoInputFile)
            .output(audioOutputFile)
            .on('end', () => {
            console.log(`${audioOutputFile} extracted`);
            resolve(audioOutputFile);
        })
            .on('error', (err) => {
            reject(err);
        })
            .run();
    });
}

const outDir = path__namespace.join(__dirname, '..', 'out');
class WorkDir {
    videoInputFile;
    workDir;
    constructor(videoInputFile) {
        this.videoInputFile = videoInputFile;
        const fileBasename = path__namespace.basename(videoInputFile);
        this.workDir = path__namespace.join(outDir, fileBasename);
        if (!fs.existsSync(this.workDir)) {
            fs.mkdirSync(this.workDir);
        }
        if (!fs.existsSync(this.transcriptionsDir)) {
            fs.mkdirSync(this.transcriptionsDir);
        }
    }
    get copiedVideoFile() {
        const ext = path__namespace.extname(this.videoInputFile);
        return path__namespace.join(this.workDir, `original.${ext}`);
    }
    get audioFile() {
        return path__namespace.join(this.workDir, 'audio.wav');
    }
    get teleprompterFile() {
        return path__namespace.join(this.workDir, 'teleprompter.txt');
    }
    get transcriptionsDir() {
        return path__namespace.join(this.workDir, 'transcriptions');
    }
    isTranscriptionExist(locale) {
        const transcriptionFile = this.transcriptionFile(locale);
        return fs.existsSync(transcriptionFile);
    }
    saveTranscription(locale, transcription) {
        const transcriptionFile = this.transcriptionFile(locale);
        fs.writeFileSync(transcriptionFile, JSON.stringify(transcription, null, 2));
    }
    loadExistingTranscription(locale) {
        const transcriptionFile = this.transcriptionFile(locale);
        return JSON.parse(fs.readFileSync(transcriptionFile, 'utf-8'));
    }
    transcriptionFile(locale) {
        return path__namespace.join(this.transcriptionsDir, `transcription.${locale}.json`);
    }
}

async function transcribeFile(audioFile, locale) {
    const deepgramApiKey = process.env['DEEPGRAM_API_KEY'];
    if (!deepgramApiKey) {
        throw new Error('Environment variable DEEPGRAM_API_KEY is missing.');
    }
    const deepgram = sdk.createClient(deepgramApiKey);
    console.log('Start transcription...');
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(fs.readFileSync(audioFile), {
        model: 'nova-2',
        language: locale,
        smart_format: true,
        punctuate: true,
        diarize: true,
    });
    if (error) {
        throw error;
    }
    console.log('Transcription finished!');
    return result;
}

const wordsPerCluster = 5;
function generateCaptions(deepgramWords) {
    let clusters = [];
    let lastCaption = null;
    let lastCluster = null;
    for (let word of deepgramWords) {
        const newCaption = deepgramWordToCaption(word);
        const wordCount = lastCluster?.length || 0;
        if (newCaption.start === lastCaption?.end && wordCount < wordsPerCluster) {
            lastCluster.push(newCaption);
        }
        else {
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
function deepgramWordToCaption(deepgramWord) {
    const startStr = secondsToTimecodes(deepgramWord.start);
    const endStr = secondsToTimecodes(deepgramWord.end);
    return {
        start: startStr,
        end: endStr,
        word: deepgramWord.punctuated_word,
    };
}
function secondsToTimecodes(seconds) {
    return luxon.DateTime
        .fromSeconds(seconds, { zone: 'utc' }).
        toFormat('HH:mm:ss.SSS');
}

function normalizeWord(word) {
    return word
        .normalize('NFD') // decomposes the letters and diacritics.
        .replace(/\p{Diacritic}/gu, '') // removes all the diacritics.
        .replaceAll(/[^\w']/g, '') // remove all punctuation
        .toLowerCase();
}
function compare(transcriptionWord, teleprompterToken) {
    const normalizedTranscriptionWord = normalizeWord(transcriptionWord.punctuated_word);
    const normalizedTeleprompterToken = normalizeWord(teleprompterToken);
    return normalizedTranscriptionWord === normalizedTeleprompterToken;
}
function avgWordDurationSec(transcribedWords) {
    return transcribedWords
        .map(word => word.end - word.start)
        .reduce((total, curr) => total + curr) / transcribedWords.length;
}
/**
 * Attaches punctuation signs to the previous word.
 * @param tokens  word tokens
 */
function collapsePunctuation(tokens) {
    const res = [];
    for (const token of tokens) {
        if (token.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/)) {
            res.push(token);
        }
        else {
            res[res.length - 1] += ` ${token}`;
        }
    }
    return res;
}
class Corrector {
    tokenizer = new natural__namespace.RegexpTokenizer({ pattern: /\s+/ });
    teleprompterTokens;
    constructor(teleprompterText) {
        this.teleprompterTokens = collapsePunctuation(this.tokenizer.tokenize(teleprompterText));
    }
    correct(transcribedWords) {
        const same = diff__namespace.same(transcribedWords, this.teleprompterTokens, compare);
        const similarity = same.length / this.teleprompterTokens.length * 100;
        console.log(`Similarity: ${similarity}%`);
        const patch = diff__namespace.getPatch(transcribedWords, this.teleprompterTokens, compare);
        const patched = diff__namespace.applyPatch(transcribedWords, patch);
        const avgWordDuration = avgWordDurationSec(transcribedWords);
        return Corrector.ajustDurationOfInsertedWords(patched, avgWordDuration);
    }
    static ajustDurationOfInsertedWords(patchedTokens, avgWordDuration) {
        const result = [];
        let segmentStart = null;
        let segmentEnd = null;
        for (let i = 0; i < patchedTokens.length; i++) {
            if (typeof patchedTokens[i] === 'string' && segmentStart === null) {
                // Beginning of adjusted segment
                segmentStart = i;
            }
            else if (typeof patchedTokens[i] != 'string' && segmentStart != null) {
                // Adjusted segment finished
                segmentEnd = i - 1;
                const wordsToAdjust = patchedTokens.slice(segmentStart, i);
                const currentToken = patchedTokens[i];
                if (segmentStart === 0) {
                    // Inserted at the beginning of transcription
                    const nbInserted = segmentEnd - segmentStart + 1;
                    const segmentDuration = nbInserted * avgWordDuration;
                    const segmentStartTime = Math.max(currentToken.start - segmentDuration, 0);
                    const segmentEndTime = currentToken.start;
                    const adjustedWords = Corrector.adjustWords(wordsToAdjust, segmentStartTime, segmentEndTime);
                    result.push(...adjustedWords);
                }
                else {
                    // Insert in the middle of transcription
                    const lastAsjustedWord = result.pop();
                    const wordsToReadjust = [
                        lastAsjustedWord.punctuated_word || lastAsjustedWord.word,
                        ...wordsToAdjust,
                        currentToken.punctuated_word || currentToken.word
                    ];
                    const segmentStartTime = lastAsjustedWord.start;
                    const segmentEndTime = currentToken.end;
                    const adjustedWords = Corrector.adjustWords(wordsToReadjust, segmentStartTime, segmentEndTime);
                    result.push(...adjustedWords);
                }
                // Reset adjusted segment
                segmentStart = null;
                segmentEnd = null;
                // Add current element to the result
                result.push(patchedTokens[i]);
            }
            else if (typeof patchedTokens[i] != 'string') {
                // Add current element to the result
                result.push(patchedTokens[i]);
            }
        }
        if (segmentStart != null && result.length) {
            // Insert in the end
            const wordsToAdjust = patchedTokens.slice(segmentStart);
            const lastAsjustedWord = result[result.length - 1];
            const segmentStartTime = lastAsjustedWord.start;
            const segmentEndTime = segmentStartTime + wordsToAdjust.length * avgWordDuration;
            const adjustedWords = Corrector.adjustWords(wordsToAdjust, segmentStartTime, segmentEndTime);
            result.push(...adjustedWords);
        }
        return result;
    }
    static adjustWords(words, startTime, endTime) {
        const segmentDuration = endTime - startTime;
        const durationPerInsertedWord = segmentDuration / words.length;
        let time = startTime;
        const adjustedWords = [];
        for (const word of words) {
            const deepgramWord = {
                word: word,
                punctuated_word: word,
                start: time,
                end: (time += durationPerInsertedWord),
                confidence: 1,
            };
            adjustedWords.push(deepgramWord);
        }
        return adjustedWords;
    }
}

const cliArgs = parseArgs();
const workDir = new WorkDir(cliArgs.videoInputFile);
(async () => {
    try {
        console.log(chalk.magenta('Transcriptionist starting transcription'));
        // Copy original video file
        console.log(chalk.yellow('Step 1:') + ' ' + chalk.blue('Copy original video file'));
        fs.cpSync(cliArgs.videoInputFile, workDir.copiedVideoFile);
        // Copy teleprompter text file
        if (cliArgs.teleprompterFile) {
            console.log(chalk.yellow('Step 2:') + ' ' + chalk.blue('Copy teleprompter text file'));
            fs.cpSync(cliArgs.teleprompterFile, workDir.teleprompterFile);
        }
        else {
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
        }
        else {
            console.log(chalk.yellow('Step 4:') + ' ' + chalk.blue(`Transcription for locale '${cliArgs.locale}' already exists. (do nothing)`));
            transcription = workDir.loadExistingTranscription(cliArgs.locale);
        }
        // Get transcription words
        let transcribedWords = transcription.results.channels[0].alternatives[0].words;
        // Correct words
        if (cliArgs.teleprompterFile) {
            console.log(chalk.yellow('Step 5:') + ' ' + chalk.blue('Correcting transcription with the help of teleprompter text file'));
            const teleprompterText = fs.readFileSync(workDir.teleprompterFile, 'utf-8');
            const corrector = new Corrector(teleprompterText);
            transcribedWords = corrector.correct(transcribedWords);
        }
        else {
            console.log(chalk.yellow('Step 5:') + ' ' + chalk.blue('Teleprompter text file not provided (do nothing)'));
        }
        // Generate captions
        console.log(chalk.yellow('Step 6:') + ' ' + chalk.blue('Generating captions'));
        const captionsText = generateCaptions(transcribedWords);
        fs.writeFileSync(cliArgs.srtOutputFile, captionsText);
        console.log(chalk.green('Success:') + ' ' + `Captions written into ${cliArgs.srtOutputFile}`);
    }
    catch (err) {
        console.error(chalk.red('Error occurred:'), err);
    }
})();
//# sourceMappingURL=index.js.map
