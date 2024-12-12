# Transcriptionist

[![npm](https://img.shields.io/npm/v/transcriptionist.svg)](http://npm.im/transcriptionist) 
[![CI](https://github.com/hosuaby/Transcriptionist/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/hosuaby/Transcriptionist/actions/workflows/ci.yml)

<p align="center">
    <img src="./docs/transcriptionist.webp"/>
</p>

**Transcriptionist** is an open-source tool for video transcription and captions generation. 
It seamlessly integrates with [PupCaps!](https://github.com/hosuaby/PupCaps), enabling you to create beautifully styled 
captions for your videos using CSS.

This tool leverages the power of `Deepgram` for speech-to-text transcription and utilizes the `natural` JavaScript library 
for natural language processing (NLP).

#### Features

- **Video Transcription**: Automatically transcribes the speech from video files into text.
- **Teleprompter-Based Correction**: Improves transcription accuracy by comparing it to the original text of the speech, known as the "teleprompter."
- **Caption Generation**: Produces caption files that can be styled and added to videos using PupCaps for a fully customizable captioning experience.

## Requirements

You need `node` to be installed on your computer.

If `ffmpeg` binary is missing on your system, it will be installed automatically.

### Deepgram

Transcriptionist relies on the `Deepgram` service for speech-to-text transcription. 
To use this tool, you need to set up a Deepgram API Key. Follow these steps:

1. Create account at https://deepgram.com/.
2. Navigate to the *"API Keys"* section in your Deepgram dashboard. Click the *"Create a New API Key"* button.
3. Save the generated API key securely for future use.
4. Define this key as environment variable:

```shell
export DEEPGRAM_API_KEY=<your_deepgram_api_key>
```

#### Caching

Transcriptionist includes built-in caching for transcriptions. This allows you to run the tool multiple times on the same 
video without worrying about exhausting your Deepgram credits unnecessarily.

## Install

From npm:

```shell
npm i -g transcriptionist@latest
```

or from sources:

```shell
git clone git@github.com:hosuaby/Transcriptionist.git
cd Transcriptionist
npm install
npm i -g .
```

If you also want to add the generated captions to your video, install PupCaps:

```shell
npm i -g pupcaps@latest
```

## Usage

To generate captions in the **SubRip Subtitle (.srt)** format, run the following command:

```shell
transcribe path/to/video.mp4
```

The video does not have to be in MPEG format. The script uses **FFmpeg** under the hood and supports all video formats 
that FFmpeg can process.

By default, the resulting `.srt` file will be saved in the same folder as the input video, unless you specify 
a different location using the `--output` option.

Another important option is `--locale` that specifies the language of the transcription. It is highly recommended to set 
this option, as failing to do so might result in unsuccessful transcription.

###### Example: Transcription for French

```shell
transcribe path/to/video.mp4 --output path/to/captions.srt --locale fr
```

### Options

**Usage:** `transcribe [options] <file>`

###### Arguments

| Argument | Description                      |
|----------|----------------------------------|
| file     | Path to the original video file. |

###### Options

| Option           | Default | Description                                                                                                                                                        |
|------------------|---------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| -o, --output     |         | Full or relative path where the created SubRip Subtitle (.srt) file should be written. By default, it will be saved in the same directory as the input video file. |
| -t, --teleprompt |         | Full or relative path to teleprompter text (.txt) file. If not provided, transcription will not be corrected.                                                      |
| -l, --locale     | en-US   | Locale that will be used to transcribe the video.                                                                                                                  |
| -n, --length     | 5       | Maximum number of words per caption.                                                                                                                               |
| -k, --karaoke    |         | Enables Karaoke-style captioning supported by PupCaps.                                                                                                             |

## Caption Video

Use [PupCaps!](https://github.com/hosuaby/PupCaps) to caption your videos.
