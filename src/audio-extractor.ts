import ffmpeg from 'fluent-ffmpeg';

export async function extractAudio(videoInputFile: string, audioOutputFile: string) {
    console.log(`Extracting audio into ${audioOutputFile}...`);

    await new Promise((resolve, reject) => {
        ffmpeg()
            .input(videoInputFile)
            .output(audioOutputFile)
            .on('end', () => {
                console.log(`${audioOutputFile} extracted`);
                resolve(audioOutputFile);
            })
            .on('error', (err: any) => {
                reject(err);
            })
            .run();
    });
}