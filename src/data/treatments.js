export const treatments = [
  {
    id: 'surgery',
    name: 'Surgery',
    icon: 'scalpel',
    damage: 24,
    bestUse: 'Localized solid tumors that can be safely removed.',
    drawback: 'Limited when cancer has spread or is in the blood.',
    whyItWorked: 'Surgery works best when cancer is still a removable local mass.'
  },
  {
    id: 'chemotherapy',
    name: 'Chemotherapy',
    icon: 'chemo',
    damage: 18,
    bestUse: 'Systemic treatment for rapidly dividing cancer cells.',
    drawback: 'Can affect healthy fast-dividing cells, causing side effects.',
    whyItWorked: 'Chemotherapy can reach cancer cells throughout the body through the bloodstream.'
  },
  {
    id: 'radiation',
    name: 'Radiation Therapy',
    icon: 'beam',
    damage: 20,
    bestUse: 'Targeted DNA damage in a specific tumor area.',
    drawback: 'Less useful as a whole-body treatment.',
    whyItWorked: 'Radiation damages DNA in a targeted region, making cancer cells unable to divide.'
  },
  {
    id: 'immunotherapy',
    name: 'Immunotherapy',
    icon: 'immune',
    damage: 17,
    bestUse: 'Cancers with immune-recognizable markers or checkpoint escape.',
    drawback: 'Response varies; cancer can hide from immune attack.',
    whyItWorked: 'Immunotherapy helps immune cells recognize and attack cancer cells.'
  },
  {
    id: 'cart',
    name: 'CAR T-cell Therapy',
    icon: 'cart',
    damage: 22,
    bestUse: 'Some blood cancers with targetable antigens.',
    drawback: 'Limited to cancers with the right markers and specialized care.',
    whyItWorked: 'CAR T cells are modified to recognize specific cancer antigens.'
  },
  {
    id: 'pdt',
    name: 'Photodynamic Therapy',
    icon: 'light',
    damage: 16,
    bestUse: 'Surface or near-surface tumors reached by light.',
    drawback: 'Light does not penetrate deeply into tissue.',
    whyItWorked: 'PDT activates a photosensitizer with light, creating toxic oxygen radicals nearby.'
  }
];

export const scenarios = [
  {
    id: 'localized-solid',
    name: 'Localized Solid Tumor',
    badge: 'Localized',
    description: 'A solid tumor is still mostly in one place.',
    effectiveness: {
      surgery: 1.45,
      chemotherapy: 0.9,
      radiation: 1.2,
      immunotherapy: 0.9,
      cart: 0.45,
      pdt: 1.0
    },
    feedback: {
      surgery: 'Surgery dealt high damage because the tumor was localized and removable.',
      radiation: 'Radiation was effective because a local tumor area could be targeted.',
      pdt: 'PDT helped because this tumor could be treated as a surface or near-surface target.',
      cart: 'CAR T had limited effect because this solid tumor was not the best match for this card.'
    }
  },
  {
    id: 'leukemia',
    name: 'Leukemia / Blood Cancer',
    badge: 'Blood cancer',
    description: 'Cancer cells are spread through blood or bone marrow instead of one removable lump.',
    effectiveness: {
      surgery: 0.2,
      chemotherapy: 1.35,
      radiation: 0.45,
      immunotherapy: 1.1,
      cart: 1.45,
      pdt: 0.2
    },
    feedback: {
      surgery: 'Surgery was weak because leukemia is not one solid tumor to remove.',
      chemotherapy: 'Chemotherapy was strong because systemic treatment can reach cancer cells in the blood.',
      cart: 'CAR T was strong because some blood cancers have antigens engineered T cells can target.'
    }
  },
  {
    id: 'metastatic',
    name: 'Metastatic Cancer',
    badge: 'Metastatic',
    description: 'Cancer has spread beyond the original site.',
    effectiveness: {
      surgery: 0.45,
      chemotherapy: 1.15,
      radiation: 0.75,
      immunotherapy: 1.15,
      cart: 0.85,
      pdt: 0.25
    },
    feedback: {
      surgery: 'Surgery was limited because cancer has spread beyond one removable area.',
      chemotherapy: 'Chemotherapy helped because it can act throughout the body.',
      immunotherapy: 'Immunotherapy helped because immune-based treatments can sometimes attack scattered cancer cells.',
      radiation: 'Radiation helped with local control, but it does not treat every metastatic site at once.'
    }
  }
];
