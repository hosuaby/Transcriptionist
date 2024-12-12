import {expect} from 'chai';
import {secondsToTimecodes} from '../src/captions';

it('secondsToTimecodes', () => {
    // Given
    const seconds = 6547.382;

    // When
    const timecode = secondsToTimecodes(seconds);

    // Then
    expect(timecode).to.equals('01:49:07,382');
});