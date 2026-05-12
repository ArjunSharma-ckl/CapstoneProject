export const questions = [
  {
    id: 'q1',
    type: 'multiple',
    concept: 'CAR T-cell Therapy',
    group: 'CAR T-cell Therapy Questions',
    prompt: 'What can enhanced T cells do?',
    choices: [
      { id: 'a', text: 'Produce antibodies' },
      { id: 'b', text: 'Kill only cancer cells instead of indiscriminately' },
      { id: 'c', text: 'Kill coronavirus cells faster' },
      { id: 'd', text: "Recognize cancerous cell's antigens" }
    ],
    correctAnswerId: 'd',
    explanation: "Enhanced T cells can recognize cancerous cell's antigens."
  },
  {
    id: 'q2',
    type: 'multiple',
    concept: 'CAR T-cell Therapy',
    group: 'CAR T-cell Therapy Questions',
    prompt: 'What types of cancer does CAR T-cell therapy treat?',
    choices: [
      { id: 'a', text: 'Muscle' },
      { id: 'b', text: 'Blood' },
      { id: 'c', text: 'Respiratory' },
      { id: 'd', text: 'Bone' }
    ],
    correctAnswerId: 'b',
    explanation: 'CAR T-cell therapy is used for blood cancers.'
  },
  {
    id: 'q3',
    type: 'multiple',
    concept: 'Immunotherapy',
    group: 'Immunotherapy Questions',
    prompt: 'Which of the following is NOT a type of immunotherapy?',
    choices: [
      { id: 'a', text: 'T-Cell Transfer Therapy' },
      { id: 'b', text: 'Monoclonal Antibodies' },
      { id: 'c', text: 'Chemotherapy' },
      { id: 'd', text: 'Immune System Modulators' }
    ],
    correctAnswerId: 'c',
    explanation: 'Chemotherapy is not a type of immunotherapy.'
  },
  {
    id: 'q4',
    type: 'multiple',
    concept: 'Immunotherapy',
    group: 'Immunotherapy Questions',
    prompt: 'True or False: Immunotherapy has been in use in some form since 1891.',
    choices: [
      { id: 'a', text: 'True' },
      { id: 'b', text: 'False' }
    ],
    correctAnswerId: 'a',
    explanation: 'True. Immunotherapy has been in use in some form since 1891.'
  },
  {
    id: 'q5',
    type: 'multiple',
    concept: 'Photodynamic Therapy',
    group: 'Photodynamic Therapy Questions',
    prompt: 'What three things are needed for Photodynamic Therapy (PDT)?',
    choices: [
      { id: 'a', text: 'Heat, oxygen, surgery' },
      { id: 'b', text: 'Light, drug, oxygen' },
      { id: 'c', text: 'Blood, radiation, oxygen' },
      { id: 'd', text: 'Vaccines, light, blood' }
    ],
    correctAnswerId: 'b',
    explanation: 'Photodynamic Therapy needs light, a drug, and oxygen.'
  },
  {
    id: 'q6',
    type: 'multiple',
    concept: 'Photodynamic Therapy',
    group: 'Photodynamic Therapy Questions',
    prompt: 'Why is PDT considered targeted?',
    choices: [
      { id: 'a', text: 'It treats the entire body' },
      { id: 'b', text: 'It mainly treats one area' },
      { id: 'c', text: 'It removes organs' },
      { id: 'd', text: 'It only works on healthy cells' }
    ],
    correctAnswerId: 'b',
    explanation: 'PDT is considered targeted because it mainly treats one area.'
  },
  {
    id: 'q7',
    type: 'multiple',
    concept: 'Radiation Therapy',
    group: 'Radiation Therapy Questions',
    prompt: 'What does radiation therapy mainly damage in cancer cells?',
    choices: [
      { id: 'a', text: 'DNA' },
      { id: 'b', text: 'Skin' },
      { id: 'c', text: 'Blood' },
      { id: 'd', text: 'Oxygen' }
    ],
    correctAnswerId: 'a',
    explanation: 'Radiation therapy mainly damages DNA in cancer cells.'
  },
  {
    id: 'q8',
    type: 'multiple',
    concept: 'Radiation Therapy',
    group: 'Radiation Therapy Questions',
    prompt: 'What is one disadvantage of radiation therapy?',
    choices: [
      { id: 'a', text: 'It cannot kill cancer cells' },
      { id: 'b', text: 'It only works with surgery' },
      { id: 'c', text: 'It can damage healthy cells' },
      { id: 'd', text: 'It uses no energy waves' }
    ],
    correctAnswerId: 'c',
    explanation: 'One disadvantage of radiation therapy is that it can damage healthy cells.'
  }
];
