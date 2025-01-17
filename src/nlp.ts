export function asciiFolding(word: string): string {
    return word
        .normalize('NFD')                   // decomposes the letters and diacritics.
        .replace(/\p{Diacritic}/gu, '');    // removes all the diacritics.
}

export function normalizeWord(word: string): string {
    return asciiFolding(word)
        .replace(/’/g, "'")                 // normalize apostrophes
        .replaceAll(/[^\w']/g, '')          // remove all punctuation
        .toLowerCase();
}

export function endsWithPunctuation(word: string): boolean {
    return !!asciiFolding(word).match(/[^\w']$/);
}

export function removePunctuation(tokens: string[]) {
    return tokens.filter(token => !token.match(/[,;.:!?]/));
}