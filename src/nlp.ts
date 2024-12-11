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

/**
 * Attaches punctuation signs to the previous word.
 * @param tokens  word tokens
 */
export function collapsePunctuation(tokens: string[]) {
    const res = [];

    for (const token of tokens) {
        if (token.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/)) {
            res.push(token);
        } else {
            res[res.length - 1] += ` ${token}`;
        }
    }

    return res;
}