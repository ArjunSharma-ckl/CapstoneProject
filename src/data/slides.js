export const slides = [
  {
    id: 'slide-1',
    order: 1,
    title: 'What Is Cancer?',
    description: 'Cancer is uncontrolled cell growth caused by mutations that disrupt the normal cell cycle. Normal cells grow, divide, and die in an orderly way. Cancer cells ignore these signals and keep dividing, forming tumors or flooding the blood.',
    animationType: 'cell-division',
    focus: 'Uncontrolled cell division'
  },
  {
    id: 'slide-2',
    order: 2,
    title: 'Surgery',
    description: 'Surgery physically removes a localized solid tumor. It works best when the tumor is contained in one place and can be safely accessed by a surgeon. Surgery is not useful as the main treatment for blood cancers like leukemia, which have no single tumor to remove.',
    animationType: 'surgery',
    focus: 'Physical removal — best for localized solid tumors'
  },
  {
    id: 'slide-3',
    order: 3,
    title: 'Chemotherapy',
    description: 'Chemotherapy uses drugs that target rapidly dividing cells. Cancer cells tend to divide faster than most normal cells, so they are more affected. However, healthy fast-dividing cells — in hair follicles, the gut lining, and bone marrow — are also hit. This causes side effects like hair loss, nausea, and low blood cell counts.',
    animationType: 'chemotherapy',
    focus: 'Targets rapidly dividing cells — but affects healthy ones too'
  },
  {
    id: 'slide-4',
    order: 4,
    title: 'Radiation Therapy',
    description: 'Radiation therapy uses high-energy beams to damage DNA in a targeted area. Cancer cells with broken DNA cannot divide properly and die off. Radiation works best as a local treatment aimed at a specific tumor. It is less useful as a whole-body treatment because healthy tissue in the beam path is also affected.',
    animationType: 'radiation',
    focus: 'DNA damage in a targeted area'
  },
  {
    id: 'slide-5',
    order: 5,
    title: 'Immunotherapy',
    description: 'Immunotherapy helps the immune system recognize and attack cancer cells. Cancer can evade immune detection by turning off checkpoint signals on immune cells. Immunotherapy can block these off-switches and restore the immune attack. Responses vary — some patients see dramatic results, others do not respond.',
    animationType: 'immunotherapy',
    focus: 'Restoring immune recognition of cancer'
  },
  {
    id: 'slide-6',
    order: 6,
    title: 'CAR T-Cell Therapy',
    description: "CAR T-cell therapy takes a patient's own T cells, sends them to a lab to be engineered to recognize specific cancer antigens, and infuses them back into the patient. The modified cells seek and destroy cancer cells. It has been especially effective against some blood cancers with targetable markers, but requires specialized facilities and only works for cancers with the right antigens.",
    animationType: 'immunotherapy',
    focus: 'Modified T cells targeting specific cancer antigens'
  },
  {
    id: 'slide-7',
    order: 7,
    title: 'Photodynamic Therapy (PDT)',
    description: 'PDT uses a drug called a photosensitizer that is absorbed by cells near a tumor. When activated by light, the drug creates toxic oxygen radicals that kill nearby cancer cells. Because light cannot penetrate deeply into tissue, PDT works best on surface or near-surface tumors — such as skin cancers or tumors accessible by endoscope.',
    animationType: 'pdt',
    focus: 'Light-activated drug — limited to accessible tumors'
  },
  {
    id: 'slide-8',
    order: 8,
    title: 'Why Combine Treatments?',
    description: 'Doctors often combine treatments because each one works differently. Surgery removes the bulk of a tumor. Chemotherapy or radiation targets remaining cells. Immunotherapy trains the immune system to watch for recurrence. Combining treatments attacks cancer from multiple angles and reduces the chance that resistant cells escape all of them.',
    animationType: 'cell-division',
    focus: 'Multiple attack angles reduce resistance risk'
  },
  {
    id: 'slide-9',
    order: 9,
    title: 'Treatment Resistance',
    description: 'Cancer cells can develop resistance through random mutations. If a mutation happens to help a cell survive a specific treatment, that cell multiplies and passes the resistance to its offspring. Over time, the surviving population of cancer cells becomes harder to treat — this is natural selection in action inside the body. It is why some cancers that initially respond to treatment later stop responding.',
    animationType: 'cell-division',
    focus: 'Mutations cause acquired resistance through selection'
  },
  {
    id: 'slide-10',
    order: 10,
    title: 'Why No Universal Cure?',
    description: 'Cancer is not one disease. Over 100 different types of cancer exist, each with different tissue of origin, mutations, stage of spread, immune interactions, and resistance patterns. A treatment that works for one patient may be useless or harmful for another. Understanding cancer at the molecular level — and matching treatment to the specific biology — is why research continues.',
    animationType: 'cell-division',
    focus: 'Cancer diversity requires individualized treatment'
  }
];
