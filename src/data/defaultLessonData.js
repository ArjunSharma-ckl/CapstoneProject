import { slides } from './slides.js';
import { questions } from './questions.js';

export const defaultLessonData = {
  version: 1,
  title: 'CapstonProjectA4',
  roomCode: '',
  slides,
  questions,
  review: {
    whyThisMatters: 'Cancer treatment is about matching biology to a patient’s cancer. Location, spread, mutations, immune response, and resistance all affect what treatment can work.',
    missedConceptIntro: 'Review the most-missed concepts before the next unit quiz.',
    handoutPlaceholder: 'QR / review handout placeholder'
  }
};
