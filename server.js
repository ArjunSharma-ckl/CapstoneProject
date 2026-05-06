import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const rooms = new Map();
const playerColors = ['#0d5f57', '#246f8f', '#b45f06', '#7b4f9d', '#28724f', '#9b3f3f', '#4a6f2c', '#8a6f1f'];
const gameZones = {
  surgery: { x: 22, y: 28, radius: 16, label: 'Surgery Zone' },
  chemotherapy: { x: 22, y: 72, radius: 16, label: 'Chemo Flow Zone' },
  radiation: { x: 78, y: 28, radius: 16, label: 'Radiation Zone' },
  immunotherapy: { x: 78, y: 72, radius: 16, label: 'Immune Zone' },
  cart: { x: 50, y: 16, radius: 14, label: 'CAR T Marker Zone' },
  pdt: { x: 50, y: 84, radius: 14, label: 'PDT Light Zone' }
};
const gameAttacks = {
  surgery: { name: 'Surgery Strike', cost: 100, baseDamage: 115, zone: 'surgery', explanation: 'Surgery works best when a tumor is localized and physically removable.' },
  chemotherapy: { name: 'Chemotherapy Burst', cost: 75, baseDamage: 72, zone: 'chemotherapy', explanation: 'Chemotherapy targets rapidly dividing cells but may affect healthy rapidly dividing cells too.' },
  radiation: { name: 'Radiation Beam', cost: 90, baseDamage: 95, zone: 'radiation', explanation: 'Radiation damages DNA in a targeted area.' },
  immunotherapy: { name: 'Immune Boost', cost: 80, baseDamage: 78, zone: 'immunotherapy', explanation: 'Immunotherapy helps immune cells recognize or attack cancer cells.' },
  cart: { name: 'CAR T Lock-On', cost: 120, baseDamage: 130, zone: 'cart', explanation: 'Engineered T cells recognize specific cancer antigens.' },
  pdt: { name: 'PDT Flash', cost: 70, baseDamage: 84, zone: 'pdt', explanation: 'PDT uses light to activate a drug that creates toxic oxygen radicals near the tumor.' }
};
const radiationRules = {
  damage: 10,
  tickMs: 1000,
  healCost: 25,
  healAmount: 40,
  healZoneBonus: 20,
  counterAttackEvery: 4,
  counterAttackDamage: 50
};
const fallbackGameQuestions = [
  {
    id: 'game-q-surgery',
    type: 'multiple',
    concept: 'Surgery',
    prompt: 'Which treatment physically removes a localized solid tumor?',
    choices: [
      { id: 'a', text: 'Surgery' },
      { id: 'b', text: 'Photodynamic therapy' },
      { id: 'c', text: 'Immunotherapy' },
      { id: 'd', text: 'CAR T-cell therapy' }
    ],
    correctAnswerId: 'a',
    explanation: 'Surgery physically removes a tumor when it is localized and safe to remove.'
  },
  {
    id: 'game-q-chemo',
    type: 'multiple',
    concept: 'Chemotherapy',
    prompt: 'Why can chemotherapy cause side effects like hair loss or nausea?',
    choices: [
      { id: 'a', text: 'It only affects cancer cells.' },
      { id: 'b', text: 'It can affect healthy rapidly dividing cells too.' },
      { id: 'c', text: 'It removes solid tumors by cutting them out.' },
      { id: 'd', text: 'It needs light to become active.' }
    ],
    correctAnswerId: 'b',
    explanation: 'Chemotherapy targets rapidly dividing cells, which can include healthy cells in hair follicles, the digestive tract, and bone marrow.'
  },
  {
    id: 'game-q-radiation',
    type: 'multiple',
    concept: 'Radiation',
    prompt: 'Radiation therapy mainly damages what part of cancer cells?',
    choices: [
      { id: 'a', text: 'Cell walls' },
      { id: 'b', text: 'DNA' },
      { id: 'c', text: 'Antibodies' },
      { id: 'd', text: 'Photosensitizers' }
    ],
    correctAnswerId: 'b',
    explanation: 'Radiation uses high-energy radiation to damage DNA in a targeted area.'
  },
  {
    id: 'game-q-pdt',
    type: 'multiple',
    concept: 'Photodynamic therapy',
    prompt: 'Why is PDT limited for deep tumors?',
    choices: [
      { id: 'a', text: 'Light does not penetrate deeply into tissue.' },
      { id: 'b', text: 'It only works on blood cancers.' },
      { id: 'c', text: 'It cannot use oxygen.' },
      { id: 'd', text: 'It removes tumors with surgery.' }
    ],
    correctAnswerId: 'a',
    explanation: 'PDT uses light to activate a drug, so it works best when light can reach the tumor.'
  },
  {
    id: 'game-q-cure',
    type: 'multiple',
    concept: 'Cancer diversity',
    prompt: 'Why is there no one cure for all cancers?',
    choices: [
      { id: 'a', text: 'All cancers have the same mutations.' },
      { id: 'b', text: 'Cancer is many diseases with different tissues, stages, mutations, and resistance patterns.' },
      { id: 'c', text: 'Only surgery can treat cancer.' },
      { id: 'd', text: 'Cancer cells never change.' }
    ],
    correctAnswerId: 'b',
    explanation: 'Cancer is not one disease; treatment depends on cancer type, location, stage, mutations, and resistance.'
  }
];

function defaultCancerCells() {
  return [
    { id: 'cell-a', label: 'Target 1', x: 45, y: 43, health: 500, maxHealth: 500, type: 'localized' },
    { id: 'cell-b', label: 'Target 2', x: 56, y: 50, health: 500, maxHealth: 500, type: 'blood-marker' },
    { id: 'cell-c', label: 'Target 3', x: 47, y: 61, health: 500, maxHealth: 500, type: 'surface' }
  ];
}

function createDefaultGame(scenarioId = 'localized-solid') {
  const cells = defaultCancerCells();
  const totalHealth = cells.reduce((sum, cell) => sum + cell.health, 0);
  return {
    active: false,
    status: 'lobby',
    scenarioId,
    maxHealth: totalHealth,
    bossHealth: totalHealth,
    totalHealth,
    round: 0,
    charges: 0,
    streak: 0,
    mutationId: null,
    currentMutation: null,
    currentQuestion: null,
    questionCounter: 0,
    attackCount: 0,
    players: {},
    cells,
    log: [],
    usedCards: [],
    lastAttack: null
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function distance(a, b) {
  return Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0));
}

function ensureGamePlayer(room, student) {
  if (!student) return null;
  if (!room.game.players) room.game.players = {};
  if (!room.game.players[student.id]) {
    const index = Object.keys(room.game.players).length;
    room.game.players[student.id] = {
      id: student.id,
      name: student.name,
      x: 12 + (index % 4) * 8,
      y: 18 + Math.floor(index / 4) * 10,
      energy: 0,
      health: 100,
      maxHealth: 100,
      contribution: 0,
      color: playerColors[index % playerColors.length],
      connected: student.connected
    };
  } else {
    room.game.players[student.id].name = student.name;
    room.game.players[student.id].connected = student.connected;
    room.game.players[student.id].maxHealth ??= 100;
    room.game.players[student.id].health ??= room.game.players[student.id].maxHealth;
  }
  return room.game.players[student.id];
}

function ensureAllGamePlayers(room) {
  room.students.forEach((student) => ensureGamePlayer(room, student));
}

function syncHealthFromCells(room) {
  const total = room.game.cells.reduce((sum, cell) => sum + Math.max(0, cell.health), 0);
  room.game.totalHealth = Math.max(0, Math.min(room.game.maxHealth, Math.round(total)));
  room.game.bossHealth = room.game.totalHealth;
  if (room.game.totalHealth <= 0) {
    room.game.status = 'ended';
    room.game.active = true;
  }
}

function appendGameLog(room, entry) {
  room.game.log = [{ id: Date.now() + Math.random(), ...entry }, ...room.game.log].slice(0, 8);
}

function applyRadiationDamage(room, player, amount = radiationRules.damage) {
  if (!room?.game || !player || room.game.status !== 'running') return false;

  const radiationActive = room.game.cells.some((cell) => cell.health > 0);
  if (!radiationActive) return false;
  if ((player.health ?? player.maxHealth ?? 100) <= 0) return false;

  player.health = Math.max(0, (player.health ?? player.maxHealth ?? 100) - amount);
  if (player.health <= 0) {
    appendGameLog(room, {
      type: 'radiation',
      message: `${player.name} needs healing after radiation exposure.`
    });
  }
  return true;
}

function applyCounterAttack(room, player) {
  if (!room?.game || !player || room.game.status !== 'running') return false;
  if ((player.health ?? player.maxHealth ?? 100) <= 0) return false;
  player.health = Math.max(0, (player.health ?? player.maxHealth ?? 100) - radiationRules.counterAttackDamage);
  appendGameLog(room, {
    type: 'counter',
    message: `${player.name} took ${radiationRules.counterAttackDamage} damage from a cancer cell counterattack.`
  });
  return true;
}

function healPlayer(room, player) {
  if (!room?.game || !player) return false;
  const maxHealth = player.maxHealth || 100;
  if ((player.health ?? maxHealth) >= maxHealth) return false;
  if ((player.energy || 0) < radiationRules.healCost) {
    launchEnergyQuestion(room);
    return false;
  }

  const immuneZone = gameZones.immunotherapy;
  const inHealZone = immuneZone && distance(player, immuneZone) <= immuneZone.radius;
  const healAmount = radiationRules.healAmount + (inHealZone ? radiationRules.healZoneBonus : 0);
  player.energy -= radiationRules.healCost;
  player.health = Math.min(maxHealth, (player.health || 0) + healAmount);
  appendGameLog(room, {
    type: 'heal',
    message: `${player.name} healed ${healAmount} HP${inHealZone ? ' from the Immune Zone.' : '.'}`
  });
  return true;
}

function cleanCode(code = 'BIO123') {
  return String(code).trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'BIO123';
}

const blockedNameWords = [
  'asshole', 'bastard', 'bitch', 'bullshit', 'crap', 'cunt', 'damn', 'dick',
  'douche', 'fag', 'faggot', 'fuck', 'motherfucker', 'nigger', 'nigga',
  'piss', 'prick', 'pussy', 'shit', 'slut', 'whore'
];

function normalizeName(value) {
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

function cleanStudentName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 24);
}

function isAllowedStudentName(value) {
  const name = cleanStudentName(value);
  if (!name) return false;
  const normalized = normalizeName(name);
  return !blockedNameWords.some((word) => normalized.includes(word));
}

function createRoom(roomCode, lessonData) {
  const code = cleanCode(roomCode);
  if (!rooms.has(code)) {
    rooms.set(code, {
      roomCode: code,
      lessonData,
      lessonStarted: false,
      slideIndex: 0,
      activeQuestionId: null,
      questionReturnSlideIndex: 0,
      questionStartedAt: null,
      revealAnswers: false,
      animation: { type: null, nonce: 0 },
      animationOverlay: true,
      pdf: null,
      students: [],
      responses: {},
      showResults: false,
      conceptStats: {},
      game: createDefaultGame()
    });
  } else if (lessonData) {
    rooms.get(code).lessonData = lessonData;
  }
  return rooms.get(code);
}

function publicRoomState(room) {
  return {
    ...room,
    students: room.students.map((student) => ({
      id: student.id,
      name: student.name,
      score: student.score,
      joinedAt: student.joinedAt,
      connected: student.connected
    }))
  };
}

function emitRoom(roomCode) {
  const room = rooms.get(roomCode);
  if (room) io.to(roomCode).emit('room:state', publicRoomState(room));
}

function getPresentationSlideCount(room) {
  if (!room?.pdf) return 0;
  if (room.pdf.type === 'pptx') return room.pdf.slides?.length || 0;
  return room.pdf.pageCount || 99;
}

function getQuestion(room, questionId) {
  return room.lessonData?.questions?.find((question) => question.id === questionId)
    || fallbackGameQuestions.find((question) => question.id === questionId)
    || (room.game?.currentQuestion?.id === questionId ? room.game.currentQuestion : null);
}

function expectedResponseCount(room) {
  return room.students.filter((item) => item.connected).length || room.students.length;
}

function hasUnfinishedActiveQuestion(room) {
  const activeQuestion = getQuestion(room, room.activeQuestionId);
  if (!activeQuestion) return false;
  const expected = expectedResponseCount(room);
  if (!expected) return false;
  return (room.responses?.[activeQuestion.id] || []).length < expected;
}

function launchEnergyQuestion(room) {
  if (hasUnfinishedActiveQuestion(room)) return getQuestion(room, room.activeQuestionId);
  const questions = room.lessonData?.questions?.length ? room.lessonData.questions : fallbackGameQuestions;
  const index = (room.game.questionCounter || 0) % questions.length;
  const question = questions[index];
  room.game.questionCounter = index + 1;
  room.activeQuestionId = question.id;
  room.questionStartedAt = Date.now();
  room.revealAnswers = false;
  room.showResults = false;
  room.responses[question.id] = [];
  room.game.currentQuestion = question;
  room.game.log = [{ id: Date.now(), type: 'question', message: 'Energy question sent.' }, ...room.game.log].slice(0, 8);
  return question;
}

function getTreatment(room, treatmentId) {
  return room.lessonData?.treatments?.find((treatment) => treatment.id === treatmentId);
}

function getScenario(room, scenarioId) {
  return room.lessonData?.scenarios?.find((scenario) => scenario.id === scenarioId);
}

function calculateDamage(room, treatmentId) {
  const treatment = getTreatment(room, treatmentId);
  const scenario = getScenario(room, room.game.scenarioId);
  if (!treatment || !scenario) return null;

  let multiplier = scenario.effectiveness?.[treatmentId] ?? 1;
  const mutation = room.lessonData?.mutations?.find((item) => item.id === room.game.mutationId);
  if (mutation?.modifiers?.[treatmentId]) multiplier *= mutation.modifiers[treatmentId];

  const damage = Math.max(1, Math.round(treatment.damage * multiplier));
  return { treatment, scenario, mutation, damage, multiplier };
}

function applyMutation(room, mutationId = null) {
  const mutations = room.lessonData?.mutations ?? [];
  if (!mutations.length) return null;
  const nextMutation = mutationId
    ? mutations.find((mutation) => mutation.id === mutationId)
    : mutations[(room.game.attackCount || room.game.round || 0) % mutations.length];
  room.game.mutationId = nextMutation?.id || null;
  room.game.currentMutation = nextMutation || null;
  if (nextMutation) {
    room.game.log = [{ id: Date.now(), type: 'mutation', message: nextMutation.text }, ...room.game.log].slice(0, 8);
  }
  return nextMutation;
}

function resetSession(room, keepStudents = true) {
  room.lessonStarted = false;
  room.slideIndex = 0;
  room.activeQuestionId = null;
  room.questionReturnSlideIndex = 0;
  room.questionStartedAt = null;
  room.revealAnswers = false;
  room.showResults = false;
  room.animation = { type: null, nonce: 0 };
  room.animationOverlay = true;
  room.responses = {};
  room.conceptStats = {};
  room.game = createDefaultGame(room.game?.scenarioId || 'localized-solid');
  if (keepStudents) {
    room.students.forEach((student) => {
      student.score = 0;
    });
  } else {
    room.students = [];
  }
}

io.on('connection', (socket) => {
  socket.on('room:create', ({ roomCode, lessonData }) => {
    const room = createRoom(roomCode, lessonData);
    socket.join(room.roomCode);
    socket.data.roomCode = room.roomCode;
    socket.data.role = 'presenter';
    emitRoom(room.roomCode);
  });

  socket.on('room:watch', ({ roomCode }) => {
    const room = createRoom(roomCode);
    socket.join(room.roomCode);
    socket.data.roomCode = room.roomCode;
    socket.data.role = 'watcher';
    emitRoom(room.roomCode);
  });

  socket.on('room:join', ({ roomCode, name }) => {
    const room = createRoom(roomCode);
    socket.join(room.roomCode);
    socket.data.roomCode = room.roomCode;
    socket.data.role = 'student';
    socket.data.studentId = socket.id;

    if (!isAllowedStudentName(name)) {
      socket.emit('join:error', { message: 'Choose a classroom-appropriate name.' });
      return;
    }
    const displayName = cleanStudentName(name);
    const existing = room.students.find((student) => student.id === socket.id);
    if (!existing) {
      room.students.push({
        id: socket.id,
        name: displayName,
        score: 0,
        joinedAt: Date.now(),
        connected: true
      });
    }
    ensureAllGamePlayers(room);
    emitRoom(room.roomCode);
  });

  socket.on('content:update', ({ roomCode, lessonData }) => {
    const room = createRoom(roomCode, lessonData);
    room.lessonData = lessonData;
    emitRoom(room.roomCode);
  });

  socket.on('presenter:control', ({ roomCode, action, payload = {} }) => {
    const room = rooms.get(cleanCode(roomCode));
    if (!room) return;

    const presentationSlideCount = getPresentationSlideCount(room);
    if (action === 'lesson:start') room.lessonStarted = true;
    if (action === 'slide:set') {
      const requestedIndex = Math.max(0, Number(payload.index) || 0);
      room.slideIndex = presentationSlideCount ? Math.min(requestedIndex, presentationSlideCount - 1) : 0;
    }
    if (action === 'slide:next') {
      if (presentationSlideCount) room.slideIndex = Math.min(room.slideIndex + 1, presentationSlideCount - 1);
    }
    if (action === 'slide:previous') room.slideIndex = Math.max(room.slideIndex - 1, 0);
    if (action === 'pdf:set') {
      room.pdf = payload.pdf || null;
      room.slideIndex = 0;
    }
    if (action === 'slide:send') room.lessonStarted = true;
    if (action === 'question:launch') {
      room.questionReturnSlideIndex = room.slideIndex || 0;
      room.activeQuestionId = payload.questionId;
      room.questionStartedAt = Date.now();
      room.revealAnswers = false;
      room.showResults = false;
      room.responses[payload.questionId] = [];
      if (room.game) room.game.currentQuestion = null;
    }
    if (action === 'question:reveal') room.revealAnswers = true;
    if (action === 'question:results') room.showResults = true;
    if (action === 'question:clear') {
      room.activeQuestionId = null;
      room.questionStartedAt = null;
      room.revealAnswers = false;
      room.showResults = false;
      if (room.game) room.game.currentQuestion = null;
    }
    if (action === 'question:returnToSlide') {
      room.slideIndex = room.questionReturnSlideIndex || 0;
      room.activeQuestionId = null;
      room.questionStartedAt = null;
      room.revealAnswers = false;
      room.showResults = false;
      if (room.game) room.game.currentQuestion = null;
    }
    if (action === 'game:start') {
      const scenarioId = payload.scenarioId || room.game.scenarioId || 'localized-solid';
      room.game = createDefaultGame(scenarioId);
      room.game.active = true;
      room.game.status = 'running';
      room.game.round = 1;
      room.activeQuestionId = null;
      room.questionStartedAt = null;
      room.revealAnswers = false;
      room.showResults = false;
      ensureAllGamePlayers(room);
    }
    if (action === 'game:pause') {
      if (room.game.status === 'running') room.game.status = 'paused';
      else if (room.game.status === 'paused') room.game.status = 'running';
    }
    if (action === 'game:reset') {
      room.game = createDefaultGame(room.game?.scenarioId || 'localized-solid');
      room.activeQuestionId = null;
      room.questionStartedAt = null;
      room.revealAnswers = false;
      room.showResults = false;
      ensureAllGamePlayers(room);
    }
    if (action === 'game:scenario') room.game.scenarioId = payload.scenarioId;
    if (action === 'game:spawnCell') {
      const id = `cell-${Date.now()}`;
      room.game.cells.push({
        id,
        label: `Target ${room.game.cells.length + 1}`,
        x: clamp(payload.x ?? (38 + Math.random() * 28), 10, 90),
        y: clamp(payload.y ?? (30 + Math.random() * 40), 10, 90),
        health: 150,
        maxHealth: 150,
        type: 'spread'
      });
      room.game.totalHealth = Math.min(room.game.maxHealth, room.game.totalHealth + 150);
      room.game.bossHealth = room.game.totalHealth;
    }
    if (action === 'game:mutation') {
      applyMutation(room, payload.mutationId);
    }
    if (action === 'game:energyQuestion') {
      launchEnergyQuestion(room);
    }
    if (action === 'game:nextRound') {
      room.game.round += 1;
      const mutations = room.lessonData?.mutations ?? [];
      if (mutations.length && room.game.round % 3 === 0) {
        applyMutation(room, mutations[(room.game.round / 3 - 1) % mutations.length].id);
      }
    }
    if (action === 'session:reset') resetSession(room, true);

    emitRoom(room.roomCode);
  });

  socket.on('student:answer', ({ roomCode, questionId, answerId, answerText, elapsedMs }) => {
    const room = rooms.get(cleanCode(roomCode));
    if (!room || !questionId) return;
    const student = room.students.find((item) => item.id === socket.id);
    const question = getQuestion(room, questionId);
    if (!student || !question) return;

    const responseList = room.responses[questionId] || [];
    if (responseList.some((response) => response.studentId === student.id)) return;

    const correct = question.type === 'short'
      ? Boolean(answerText && String(answerText).trim().length > 12)
      : answerId === question.correctAnswerId;
    const fastAnswerMs = room.lessonData?.gameSettings?.fastAnswerMs ?? 8000;
    const comboEvery = room.lessonData?.gameSettings?.comboEvery ?? 5;
    const comboBonusCharges = room.lessonData?.gameSettings?.comboBonusCharges ?? 2;
    const fastBonus = correct && Number(elapsedMs) > 0 && Number(elapsedMs) <= fastAnswerMs;

    const response = {
      studentId: student.id,
      studentName: student.name,
      answerId,
      answerText,
      correct,
      fastBonus,
      elapsedMs: Number(elapsedMs) || null,
      concept: question.concept
    };
    responseList.push(response);
    room.responses[questionId] = responseList;

    if (!room.conceptStats[question.concept]) room.conceptStats[question.concept] = { correct: 0, total: 0 };
    room.conceptStats[question.concept].total += 1;
    if (correct) room.conceptStats[question.concept].correct += 1;

    if (correct) {
      student.score += fastBonus ? 2 : 1;
      const player = ensureGamePlayer(room, student);
      if (player) {
        const earnedEnergy = fastBonus ? 35 : 25;
        player.energy += earnedEnergy;
        if (room.game?.status === 'running') {
          room.game.log = [{ id: Date.now(), type: 'energy', message: `${student.name} earned ${earnedEnergy} Energy.` }, ...room.game.log].slice(0, 8);
        }
      }
      room.game.charges += fastBonus ? 2 : 1;
      room.game.streak += 1;
      if (room.game.streak > 0 && room.game.streak % comboEvery === 0) room.game.charges += comboBonusCharges;
    } else {
      room.game.streak = 0;
    }
    const expectedResponses = expectedResponseCount(room);
    if (expectedResponses > 0 && responseList.length >= expectedResponses) {
      room.showResults = true;
    }

    emitRoom(room.roomCode);
  });

  socket.on('game:move', ({ roomCode, x, y }) => {
    const room = rooms.get(cleanCode(roomCode));
    if (!room || room.game.status !== 'running') return;
    const student = room.students.find((item) => item.id === socket.id);
    const player = ensureGamePlayer(room, student);
    if (!player) return;
    player.x = clamp(x, 3, 97);
    player.y = clamp(y, 5, 95);
    emitRoom(room.roomCode);
  });

  socket.on('game:heal', ({ roomCode }) => {
    const room = rooms.get(cleanCode(roomCode));
    if (!room || room.game.status !== 'running') return;
    const student = room.students.find((item) => item.id === socket.id);
    const player = ensureGamePlayer(room, student);
    healPlayer(room, player);
    emitRoom(room.roomCode);
  });

  socket.on('game:requestQuestion', ({ roomCode }) => {
    const room = rooms.get(cleanCode(roomCode));
    if (!room || room.game.status !== 'running') return;
    launchEnergyQuestion(room);
    emitRoom(room.roomCode);
  });

  socket.on('game:attack', ({ roomCode, attackId, cellId }) => {
    const room = rooms.get(cleanCode(roomCode));
    if (!room || room.game.status !== 'running') return;
    const student = room.students.find((item) => item.id === socket.id);
    const player = ensureGamePlayer(room, student);
    const attack = gameAttacks[attackId];
    if (!player || !attack) return;
    if ((player.health ?? player.maxHealth ?? 100) <= 0) {
      appendGameLog(room, { type: 'heal', message: `${player.name} needs healing before using a treatment attack.` });
      emitRoom(room.roomCode);
      return;
    }
    if (player.energy < attack.cost) {
      launchEnergyQuestion(room);
      emitRoom(room.roomCode);
      return;
    }

    const liveCells = room.game.cells.filter((cell) => cell.health > 0);
    const target = liveCells.find((cell) => cell.id === cellId) || liveCells.sort((a, b) => distance(player, a) - distance(player, b))[0];
    if (!target) return;

    let multiplier = 1;
    const notes = [];
    const scenario = getScenario(room, room.game.scenarioId);
    const scenarioMultiplier = scenario?.effectiveness?.[attackId];
    if (Number.isFinite(scenarioMultiplier)) {
      multiplier *= scenarioMultiplier;
      if (scenario?.feedback?.[attackId]) {
        notes.push(scenario.feedback[attackId]);
      } else if (scenarioMultiplier >= 1.15) {
        notes.push(`Scenario bonus: ${attack.name} fits ${scenario.name}.`);
      } else if (scenarioMultiplier <= 0.75) {
        notes.push(`Reduced damage: ${attack.name} is not the best match for ${scenario.name}.`);
      }
    }
    const playerDistance = distance(player, target);
    const zone = gameZones[attack.zone];
    const zoneDistance = zone ? distance(player, zone) : Infinity;

    if (playerDistance <= 14) {
      multiplier *= 1.25;
      notes.push(`Extra damage: close to ${target.label}.`);
    }
    if (zoneDistance <= (zone?.radius || 0)) {
      multiplier *= 1.5;
      notes.push(`Treatment Zone Bonus: you used ${attack.name} from ${zone.label}.`);
    }
    if (attackId === 'surgery' && playerDistance > 20) {
      multiplier *= 0.65;
      notes.push('Reduced damage: surgery works best on localized tumors nearby.');
    }
    if (attackId === 'cart' && target.type !== 'blood-marker') {
      multiplier *= 0.75;
      notes.push('Reduced damage: CAR T works best against marked blood-cancer cells.');
    }
    if (attackId === 'pdt' && target.type !== 'surface' && zoneDistance > (zone?.radius || 0)) {
      multiplier *= 0.7;
      notes.push('Reduced damage: PDT needs a light-accessible target.');
    }
    if (room.game.currentMutation?.modifiers?.[attackId]) {
      multiplier *= room.game.currentMutation.modifiers[attackId];
      notes.push(room.game.currentMutation.title);
    }

    const damage = Math.max(10, Math.round(attack.baseDamage * multiplier));
    player.energy -= attack.cost;
    player.contribution += damage;
    student.score += Math.round(damage / 25);
    target.health = Math.max(0, target.health - damage);
    syncHealthFromCells(room);
    room.game.attackCount += 1;

    if (attackId === 'immunotherapy') {
      Object.values(room.game.players || {}).forEach((teamPlayer) => {
        teamPlayer.energy += 10;
      });
      notes.push('Team combo bonus: Immune Boost gave everyone +10 Energy.');
    }
    if (room.game.attackCount > 0 && room.game.attackCount % 3 === 0 && room.game.status !== 'ended') {
      applyMutation(room);
    }
    if (room.game.attackCount > 0 && room.game.attackCount % radiationRules.counterAttackEvery === 0 && room.game.status !== 'ended') {
      applyCounterAttack(room, player);
      notes.push(`Cancer cell counterattack: ${player.name} took ${radiationRules.counterAttackDamage} damage for attacking too much.`);
    }

    const feedback = notes.length ? notes.join(' ') : `${attack.name} dealt normal damage.`;
    const message = `${student.name}: ${attack.name} dealt ${damage} damage. ${feedback} ${attack.explanation}`;
    room.game.lastAttack = { id: Date.now(), playerId: player.id, attackId, cellId: target.id, damage, message };
    room.game.log = [room.game.lastAttack, ...room.game.log].slice(0, 8);
    emitRoom(room.roomCode);
  });

  socket.on('disconnect', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const student = room.students.find((item) => item.id === socket.data.studentId);
    if (student) student.connected = false;
    if (student && room.game.players?.[student.id]) room.game.players[student.id].connected = false;
    emitRoom(room.roomCode);
  });
});

setInterval(() => {
  rooms.forEach((room) => {
    if (room.game?.status !== 'running') return;
    if (!room.game.cells.some((cell) => cell.health > 0)) return;
    let changed = false;
    Object.values(room.game.players || {}).forEach((player) => {
      if (player.connected && applyRadiationDamage(room, player)) changed = true;
    });
    if (changed) emitRoom(room.roomCode);
  });
}, radiationRules.tickMs);

const distPath = path.join(__dirname, 'dist');
const forceDev = process.argv.includes('--dev');

if (!forceDev && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
}

const port = Number(process.env.PORT) || 3000;
server.listen(port, '0.0.0.0', () => {
  console.log(`Cancer treatment lesson app running on http://localhost:${port}`);
});
