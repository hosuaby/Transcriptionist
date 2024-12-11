import {expect} from 'chai';
import {endsWithPunctuation} from '../src/nlp';

it('endsWithPunctuation', () => {
    // Given
    const withExclamation = 'Basalt !';
    const withComma = 'Alexei,';
    const withDot = 'déjà.';
    const withoutPunctuation = 'lancé';

    // When
    const exclamation = endsWithPunctuation(withExclamation);
    const comma = endsWithPunctuation(withComma);
    const dot = endsWithPunctuation(withDot);
    const without = endsWithPunctuation(withoutPunctuation);

    // Then
    expect(exclamation).to.be.true;
    expect(comma).to.be.true;
    expect(dot).to.be.true;
    expect(without).to.be.false;
});