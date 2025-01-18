import {expect} from 'chai';
import {endsWithPunctuation, removePunctuation} from '../src/nlp';

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

it('removePunctuation', () => {
    // Given
    const tokens = [ 'Voici', 'erreurs', 'à', 'ne', 'pas', 'commettre', 'lorsque', 'vous', 'développez', 'un',
        'SaaS.', 'Gestion', 'de', 'l\'infrastructure', '.', 'Je', 'suis'];

    // When
    const cleaned = removePunctuation(tokens);

    // Then
    expect(cleaned).to.deep.equals([ 'Voici', 'erreurs', 'à', 'ne', 'pas', 'commettre', 'lorsque', 'vous', 'développez',
        'un', 'SaaS.', 'Gestion', 'de', 'l\'infrastructure', 'Je', 'suis']);
});