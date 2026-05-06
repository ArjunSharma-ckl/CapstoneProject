export const questions = [
  {
    id: 'q1',
    type: 'multiple',
    concept: 'Surgery',
    prompt: 'Which treatment physically removes a tumor?',
    choices: [
      { id: 'a', text: 'Surgery' },
      { id: 'b', text: 'Chemotherapy' },
      { id: 'c', text: 'Radiation therapy' },
      { id: 'd', text: 'Immunotherapy' }
    ],
    correctAnswerId: 'a',
    explanation: 'Surgery physically removes a localized solid tumor when it can be safely accessed and excised.'
  },
  {
    id: 'q2',
    type: 'multiple',
    concept: 'Chemotherapy side effects',
    prompt: 'Why can chemotherapy cause hair loss or nausea?',
    choices: [
      { id: 'a', text: 'It activates T cells to attack the scalp.' },
      { id: 'b', text: 'It damages DNA only in one targeted area.' },
      { id: 'c', text: 'It affects healthy rapidly dividing cells too.' },
      { id: 'd', text: 'It needs light to become active.' }
    ],
    correctAnswerId: 'c',
    explanation: 'Chemotherapy targets rapidly dividing cells. Hair follicles, the gut lining, and bone marrow also divide rapidly, so they are damaged too, causing side effects.'
  },
  {
    id: 'q3',
    type: 'multiple',
    concept: 'Radiation therapy',
    prompt: 'Radiation therapy mainly damages what part of cancer cells?',
    choices: [
      { id: 'a', text: 'Cell membrane' },
      { id: 'b', text: 'Ribosomes' },
      { id: 'c', text: 'DNA' },
      { id: 'd', text: 'Mitochondria' }
    ],
    correctAnswerId: 'c',
    explanation: 'Radiation uses high-energy beams to damage DNA in a targeted area, preventing cancer cells from dividing properly.'
  },
  {
    id: 'q4',
    type: 'multiple',
    concept: 'Immunotherapy',
    prompt: 'What does immunotherapy help the body do?',
    choices: [
      { id: 'a', text: 'Physically cut out a tumor.' },
      { id: 'b', text: 'Recognize and attack cancer cells using the immune system.' },
      { id: 'c', text: 'Use light to kill surface tumors.' },
      { id: 'd', text: 'Stop all cell division in the body.' }
    ],
    correctAnswerId: 'b',
    explanation: 'Immunotherapy helps the immune system recognize or attack cancer cells that would otherwise escape immune detection by blocking checkpoint signals.'
  },
  {
    id: 'q5',
    type: 'multiple',
    concept: 'CAR T-cell therapy',
    prompt: 'What makes CAR T-cell therapy different from other treatments?',
    choices: [
      { id: 'a', text: "A patient's own T cells are modified to recognize cancer antigens." },
      { id: 'b', text: 'It uses light to activate a drug near the tumor.' },
      { id: 'c', text: 'It physically removes cancer with a scalpel.' },
      { id: 'd', text: 'It works equally on all cancer types.' }
    ],
    correctAnswerId: 'a',
    explanation: "CAR T-cell therapy takes a patient's own T cells, engineers them in a lab to recognize specific cancer antigens, then infuses them back to attack the cancer."
  },
  {
    id: 'q6',
    type: 'multiple',
    concept: 'Photodynamic therapy',
    prompt: 'Why is photodynamic therapy (PDT) limited for deep tumors?',
    choices: [
      { id: 'a', text: 'Light does not penetrate deeply into tissue.' },
      { id: 'b', text: 'It only works on blood cancers.' },
      { id: 'c', text: 'It modifies T cells the wrong way.' },
      { id: 'd', text: 'It requires surgery before it can be used.' }
    ],
    correctAnswerId: 'a',
    explanation: 'PDT uses light to activate a photosensitizer drug. Because light cannot travel far through tissue, it works best on surface or near-surface tumors.'
  },
  {
    id: 'q7',
    type: 'multiple',
    concept: 'Treatment selection',
    prompt: 'Which treatment is least likely to be the main option for leukemia?',
    choices: [
      { id: 'a', text: 'Chemotherapy' },
      { id: 'b', text: 'CAR T-cell therapy' },
      { id: 'c', text: 'Surgery' },
      { id: 'd', text: 'Immunotherapy' }
    ],
    correctAnswerId: 'c',
    explanation: 'Leukemia is a blood cancer without a single solid tumor to remove. Surgery cannot cut out cancer that is spread through the blood or bone marrow.'
  },
  {
    id: 'q8',
    type: 'multiple',
    concept: 'Combination therapy',
    prompt: 'Why might doctors combine multiple cancer treatments?',
    choices: [
      { id: 'a', text: 'To increase paperwork.' },
      { id: 'b', text: 'Because different treatments work in different ways and target different vulnerabilities.' },
      { id: 'c', text: 'All treatments are equally effective on their own.' },
      { id: 'd', text: 'Insurance always requires it.' }
    ],
    correctAnswerId: 'b',
    explanation: 'Different treatments attack cancer in different ways. Combining them can cover more vulnerabilities and reduce the chance that resistant cells survive.'
  },
  {
    id: 'q9',
    type: 'multiple',
    concept: 'Treatment resistance',
    prompt: 'Why can cancer become resistant to treatment over time?',
    choices: [
      { id: 'a', text: 'Cancer cells are immortal and cannot die.' },
      { id: 'b', text: 'Treatments automatically stop working after one use.' },
      { id: 'c', text: 'Mutations allow some cancer cells to survive and pass resistance to offspring cells.' },
      { id: 'd', text: 'Resistance only happens with radiation therapy.' }
    ],
    correctAnswerId: 'c',
    explanation: 'Cancer cells can develop mutations that help them survive a treatment. Those resistant cells multiply, making the treatment less effective over time — natural selection in action.'
  },
  {
    id: 'q10',
    type: 'multiple',
    concept: 'Cancer diversity',
    prompt: 'Why is there no single cure for all cancers?',
    choices: [
      { id: 'a', text: 'Cancer research has not started yet.' },
      { id: 'b', text: 'All cancers have the exact same mutations.' },
      { id: 'c', text: 'Cancer is many diseases with different mutations, tissues, stages, and resistance patterns.' },
      { id: 'd', text: 'Only surgery can treat cancer, and it fails on every type.' }
    ],
    correctAnswerId: 'c',
    explanation: 'Cancer is not one disease. Over 100 types exist, each with different tissue, mutations, stage, immune interactions, and resistance patterns. Treatment must match the specific biology.'
  },
  {
    id: 'q11',
    type: 'multiple',
    concept: 'Cancer staging',
    prompt: 'What does cancer staging help doctors decide?',
    choices: [
      { id: 'a', text: 'Which hospital room color scheme to use.' },
      { id: 'b', text: 'How far cancer has spread and what treatment is appropriate.' },
      { id: 'c', text: 'Which drug to purchase first.' },
      { id: 'd', text: 'Whether to always use surgery.' }
    ],
    correctAnswerId: 'b',
    explanation: 'Staging describes how far cancer has spread. Early-stage cancers may be treated locally; later stages may need systemic treatments. Stage guides the treatment plan.'
  },
  {
    id: 'q12',
    type: 'multiple',
    concept: 'Local vs systemic treatment',
    prompt: 'Which treatment targets the most specific local area rather than the whole body?',
    choices: [
      { id: 'a', text: 'Chemotherapy' },
      { id: 'b', text: 'Immunotherapy' },
      { id: 'c', text: 'Radiation therapy' },
      { id: 'd', text: 'CAR T-cell therapy' }
    ],
    correctAnswerId: 'c',
    explanation: 'Radiation is aimed precisely at a specific tumor area, making it the most locally targeted of these options. Chemotherapy and immunotherapy act throughout the body.'
  },
  {
    id: 'q13',
    type: 'short',
    concept: 'Chemotherapy side effects',
    prompt: 'Explain why chemotherapy can affect healthy cells.',
    correctAnswerId: null,
    explanation: 'Chemotherapy targets rapidly dividing cells. Healthy cells in hair follicles, the gut lining, and bone marrow also divide rapidly, so they are damaged too, causing side effects like hair loss, nausea, and low blood cell counts.'
  },
  {
    id: 'q14',
    type: 'short',
    concept: 'Treatment selection',
    prompt: 'Explain why cancer treatment depends on cancer type and stage.',
    correctAnswerId: null,
    explanation: 'Cancer is many different diseases with different mutations, tissues of origin, stages, immune interactions, and resistance patterns. A treatment effective for one cancer type may be useless or harmful for another.'
  }
];
