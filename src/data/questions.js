export const questions = [
  {
    id: 'q-surgery-removes',
    type: 'multiple',
    concept: 'Surgery',
    prompt: 'Which treatment physically removes a tumor?',
    choices: [
      { id: 'a', text: 'Surgery' },
      { id: 'b', text: 'Chemotherapy' },
      { id: 'c', text: 'Immunotherapy' },
      { id: 'd', text: 'Photodynamic therapy' }
    ],
    correctAnswerId: 'a',
    explanation: 'Surgery removes a localized tumor from the body.'
  },
  {
    id: 'q-chemo-side-effects',
    type: 'multiple',
    concept: 'Chemotherapy',
    prompt: 'Why can chemotherapy cause hair loss or nausea?',
    choices: [
      { id: 'a', text: 'It only affects cancer cells in the lungs.' },
      { id: 'b', text: 'It can affect healthy rapidly dividing cells too.' },
      { id: 'c', text: 'It removes immune cells from the body permanently.' },
      { id: 'd', text: 'It turns all cells into stem cells.' }
    ],
    correctAnswerId: 'b',
    explanation: 'Chemotherapy targets rapid cell division, so healthy fast-dividing cells can be harmed.'
  },
  {
    id: 'q-radiation-dna',
    type: 'multiple',
    concept: 'Radiation',
    prompt: 'Radiation therapy mainly damages what part of cancer cells?',
    choices: [
      { id: 'a', text: 'Cell walls' },
      { id: 'b', text: 'DNA' },
      { id: 'c', text: 'Ribosomes only' },
      { id: 'd', text: 'The stomach lining only' }
    ],
    correctAnswerId: 'b',
    explanation: 'Radiation damages DNA, making it harder for cancer cells to divide.'
  },
  {
    id: 'q-immunotherapy',
    type: 'multiple',
    concept: 'Immunotherapy',
    prompt: 'What does immunotherapy help the body do?',
    choices: [
      { id: 'a', text: 'Recognize or attack cancer cells' },
      { id: 'b', text: 'Replace all blood with medicine' },
      { id: 'c', text: 'Make cancer cells invisible' },
      { id: 'd', text: 'Stop every mutation from ever happening' }
    ],
    correctAnswerId: 'a',
    explanation: 'Immunotherapy helps immune defenses identify or attack cancer cells.'
  },
  {
    id: 'q-cart-different',
    type: 'multiple',
    concept: 'CAR T-cell therapy',
    prompt: 'What makes CAR T-cell therapy different from many traditional medicines?',
    choices: [
      { id: 'a', text: 'It modifies a patient’s T cells to recognize cancer antigens.' },
      { id: 'b', text: 'It is always a surgery on a solid tumor.' },
      { id: 'c', text: 'It uses sunlight to activate a drug.' },
      { id: 'd', text: 'It only treats broken bones.' }
    ],
    correctAnswerId: 'a',
    explanation: 'CAR T therapy engineers immune cells rather than simply giving a standard chemical drug.'
  },
  {
    id: 'q-pdt-depth',
    type: 'multiple',
    concept: 'Photodynamic therapy',
    prompt: 'Why is PDT limited for deep tumors?',
    choices: [
      { id: 'a', text: 'Light does not penetrate deeply enough into tissue.' },
      { id: 'b', text: 'Cancer cells do not use oxygen.' },
      { id: 'c', text: 'Photosensitizers are the same as vaccines.' },
      { id: 'd', text: 'PDT is a blood transfusion.' }
    ],
    correctAnswerId: 'a',
    explanation: 'PDT needs light to activate the drug, so deep tumors are harder to reach.'
  },
  {
    id: 'q-leukemia-surgery',
    type: 'multiple',
    concept: 'Treatment matching',
    prompt: 'Which treatment is least likely to be the main option for leukemia?',
    choices: [
      { id: 'a', text: 'Surgery' },
      { id: 'b', text: 'Chemotherapy' },
      { id: 'c', text: 'CAR T-cell therapy' },
      { id: 'd', text: 'Immunotherapy' }
    ],
    correctAnswerId: 'a',
    explanation: 'Leukemia is a blood cancer, so removing one solid tumor is usually not the main strategy.'
  },
  {
    id: 'q-combine',
    type: 'multiple',
    concept: 'Combination therapy',
    prompt: 'Why might doctors combine treatments?',
    choices: [
      { id: 'a', text: 'Different treatments attack cancer in different ways.' },
      { id: 'b', text: 'Combining treatments always removes every side effect.' },
      { id: 'c', text: 'All cancers have the same mutation.' },
      { id: 'd', text: 'Radiation turns into surgery when combined.' }
    ],
    correctAnswerId: 'a',
    explanation: 'A combination can target local tumor cells, spreading cells, and immune escape differently.'
  },
  {
    id: 'q-resistance',
    type: 'multiple',
    concept: 'Resistance',
    prompt: 'Why can cancer become resistant to treatment?',
    choices: [
      { id: 'a', text: 'Cancer cells can gain mutations or selected traits that let some survive.' },
      { id: 'b', text: 'Treatments make every cancer cell identical.' },
      { id: 'c', text: 'Cancer cells stop having DNA.' },
      { id: 'd', text: 'Resistance only happens in bacteria, never cancer.' }
    ],
    correctAnswerId: 'a',
    explanation: 'Cancer cell populations can evolve when surviving cells have traits that resist treatment.'
  },
  {
    id: 'q-no-cure',
    type: 'multiple',
    concept: 'Cancer diversity',
    prompt: 'Why is there no one cure for all cancers?',
    choices: [
      { id: 'a', text: 'Cancer is many diseases with different mutations, tissues, stages, and resistance patterns.' },
      { id: 'b', text: 'Scientists do not know that cells divide.' },
      { id: 'c', text: 'All tumors are in the same body location.' },
      { id: 'd', text: 'No treatment can ever help cancer.' }
    ],
    correctAnswerId: 'a',
    explanation: 'Different cancers behave differently, so one universal treatment cannot fit every case.'
  },
  {
    id: 'q-staging',
    type: 'multiple',
    concept: 'Treatment matching',
    prompt: 'What does cancer staging help doctors decide?',
    choices: [
      { id: 'a', text: 'How far cancer has spread and what treatment plan may fit.' },
      { id: 'b', text: 'The patient’s favorite color.' },
      { id: 'c', text: 'Whether cells contain water.' },
      { id: 'd', text: 'The exact date the first mutation happened.' }
    ],
    correctAnswerId: 'a',
    explanation: 'Stage helps describe spread and severity, which guides treatment choices.'
  },
  {
    id: 'q-local-treatment',
    type: 'multiple',
    concept: 'Local vs systemic',
    prompt: 'Which treatment is most local rather than whole-body?',
    choices: [
      { id: 'a', text: 'Radiation therapy to one tumor area' },
      { id: 'b', text: 'Chemotherapy through the bloodstream' },
      { id: 'c', text: 'A systemic immune checkpoint drug' },
      { id: 'd', text: 'A whole-body blood treatment' }
    ],
    correctAnswerId: 'a',
    explanation: 'Radiation is often aimed at a specific area, while chemotherapy is usually systemic.'
  },
  {
    id: 'q-short-chemo',
    type: 'short',
    concept: 'Chemotherapy',
    prompt: 'Explain why chemotherapy can affect healthy cells.',
    choices: [],
    correctAnswerId: null,
    explanation: 'A strong answer says chemotherapy targets rapidly dividing cells, and some healthy cells also divide rapidly.'
  },
  {
    id: 'q-short-stage',
    type: 'short',
    concept: 'Treatment matching',
    prompt: 'Explain why cancer treatment depends on cancer type and stage.',
    choices: [],
    correctAnswerId: null,
    explanation: 'A strong answer connects treatment choice to tumor location, spread, mutations, severity, and how each treatment works.'
  }
];
