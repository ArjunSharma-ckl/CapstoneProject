const blockedWords = [
  'asshole',
  'bastard',
  'bitch',
  'bullshit',
  'crap',
  'cunt',
  'damn',
  'dick',
  'douche',
  'fag',
  'faggot',
  'fuck',
  'motherfucker',
  'nigger',
  'nigga',
  'piss',
  'prick',
  'pussy',
  'shit',
  'slut',
  'whore'
];

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[@]/g, 'a')
    .replace(/[!1|]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[0]/g, 'o')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[^a-z]/g, '');
}

export function hasProfanity(value) {
  const normalized = normalize(value);
  return blockedWords.some((word) => normalized.includes(word));
}

export function cleanStudentName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 24);
}
