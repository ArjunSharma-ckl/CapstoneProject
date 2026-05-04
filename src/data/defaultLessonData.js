import { slides } from './slides.js';
import { questions } from './questions.js';
import { treatments, scenarios } from './treatments.js';

export const defaultLessonData = {
  version: 1,
  title: 'Cancer Treatments Interactive Lesson',
  roomCode: 'BIO123',
  footerDisclaimer: 'Educational project only — not medical advice.',
  slides,
  questions,
  treatments,
  scenarios,
  gameSettings: {
    title: 'Treatment Team: Defeat the Cancer',
    bossHealth: 100,
    roundsLimit: 8,
    fastAnswerMs: 8000,
    comboEvery: 5,
    comboBonusCharges: 2
  },
  mutations: [
    {
      id: 'chemo-resistance',
      title: 'Chemotherapy Resistance',
      text: 'Some cancer cells became resistant to chemotherapy. Chemo damage is reduced this round.',
      modifiers: { chemotherapy: 0.55 },
      concept: 'Resistance'
    },
    {
      id: 'spread',
      title: 'Cancer Spread',
      text: 'Cancer spread beyond the original tumor. Surgery alone is no longer enough.',
      modifiers: { surgery: 0.45 },
      concept: 'Metastasis'
    },
    {
      id: 'immune-evasion',
      title: 'Immune Evasion',
      text: 'Immune evasion increased. Immunotherapy requires a correct checkpoint question for full power.',
      modifiers: { immunotherapy: 0.6, cart: 0.75 },
      concept: 'Immune escape'
    },
    {
      id: 'low-oxygen',
      title: 'Low Tumor Oxygen',
      text: 'Tumor oxygen levels dropped. Radiation may be less effective this round.',
      modifiers: { radiation: 0.65 },
      concept: 'Tumor microenvironment'
    }
  ],
  review: {
    whyThisMatters: 'Cancer treatment is about matching biology to a patient’s cancer. Location, spread, mutations, immune response, and resistance all affect what treatment can work.',
    missedConceptIntro: 'Review the most-missed concepts before the next unit quiz.',
    handoutPlaceholder: 'QR / review handout placeholder'
  }
};
