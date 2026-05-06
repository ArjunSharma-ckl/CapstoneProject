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

function defaultCancerCells() {
  return [
    { id: 'cell-a', label: 'Cancer Cell A', x: 45, y: 43, health: 350, maxHealth: 350, type: 'localized' },
    { id: 'cell-b', label: 'Cancer Cell B', x: 56, y: 50, health: 325, maxHealth: 325, type: 'blood-marker' },
    { id: 'cell-c', label: 'Cancer Cell C', x: 47, y: 61, health: 325, maxHealth: 325, type: 'surface' }
  ];
}

function createDefaultGame(scenarioId = 'localized-solid') {
  return {
    active: false,
    status: 'lobby',
    scenarioId,
    maxHealth: 1000,
    bossHealth: 1000,
    totalHealth: 1000,
    round: 0,
    charges: 0,
    streak: 0,
    mutationId: null,
    currentMutation: null,
    players: {},
    cells: defaultCancerCells(),
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
      contribution: 0,
      color: playerColors[index % playerColors.length],
      connected: student.connected
    };
  } else {
    room.game.players[student.id].name = student.name;
    room.game.players[student.id].connected = student.connected;
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

function cleanCode(code = 'BIO123') {
  return String(code).trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'BIO123';
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
  return room.lessonData?.questions?.find((question) => question.id === questionId);
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

    const displayName = String(name || 'Student').trim().slice(0, 24) || 'Student';
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
    }
    if (action === 'question:reveal') room.revealAnswers = true;
    if (action === 'question:results') room.showResults = true;
    if (action === 'question:clear') {
      room.activeQuestionId = null;
      room.questionStartedAt = null;
      room.revealAnswers = false;
      room.showResults = false;
    }
    if (action === 'question:returnToSlide') {
      room.slideIndex = room.questionReturnSlideIndex || 0;
      room.activeQuestionId = null;
      room.questionStartedAt = null;
      room.revealAnswers = false;
      room.showResults = false;
    }
    if (action === 'game:start') {
      const scenarioId = payload.scenarioId || room.game.scenarioId || 'localized-solid';
      room.game = createDefaultGame(scenarioId);
      room.game.active = true;
      room.game.status = 'running';
      room.game.round = 1;
      ensureAllGamePlayers(room);
    }
    if (action === 'game:pause') {
      if (room.game.status === 'running') room.game.status = 'paused';
      else if (room.game.status === 'paused') room.game.status = 'running';
    }
    if (action === 'game:reset') {
      room.game = createDefaultGame(room.game?.scenarioId || 'localized-solid');
      ensureAllGamePlayers(room);
    }
    if (action === 'game:scenario') room.game.scenarioId = payload.scenarioId;
    if (action === 'game:spawnCell') {
      const id = `cell-${Date.now()}`;
      room.game.cells.push({
        id,
        label: `Cancer Cell ${room.game.cells.length + 1}`,
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
      const mutations = room.lessonData?.mutations ?? [];
      const nextMutation = payload.mutationId
        ? mutations.find((mutation) => mutation.id === payload.mutationId)
        : mutations[(room.game.round || 0) % Math.max(1, mutations.length)];
      room.game.mutationId = nextMutation?.id || null;
      room.game.currentMutation = nextMutation || null;
      if (nextMutation) {
        room.game.log = [{ id: Date.now(), type: 'mutation', message: nextMutation.text }, ...room.game.log].slice(0, 8);
      }
    }
    if (action === 'game:energyQuestion') {
      const question = room.lessonData?.questions?.[0];
      if (question) {
        room.activeQuestionId = question.id;
        room.questionStartedAt = Date.now();
        room.revealAnswers = false;
        room.showResults = false;
        room.responses[question.id] = [];
      }
    }
    if (action === 'game:nextRound') {
      room.game.round += 1;
      const mutations = room.lessonData?.mutations ?? [];
      if (mutations.length && room.game.round % 3 === 0) {
        room.game.mutationId = mutations[(room.game.round / 3 - 1) % mutations.length].id;
        room.game.currentMutation = mutations.find((mutation) => mutation.id === room.game.mutationId) || null;
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
      if (player) player.energy += fastBonus ? 35 : 25;
      room.game.charges += fastBonus ? 2 : 1;
      room.game.streak += 1;
      if (room.game.streak > 0 && room.game.streak % comboEvery === 0) room.game.charges += comboBonusCharges;
    } else {
      room.game.streak = 0;
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

  socket.on('game:attack', ({ roomCode, attackId, cellId }) => {
    const room = rooms.get(cleanCode(roomCode));
    if (!room || room.game.status !== 'running') return;
    const student = room.students.find((item) => item.id === socket.id);
    const player = ensureGamePlayer(room, student);
    const attack = gameAttacks[attackId];
    if (!player || !attack || player.energy < attack.cost) return;

    const liveCells = room.game.cells.filter((cell) => cell.health > 0);
    const target = liveCells.find((cell) => cell.id === cellId) || liveCells.sort((a, b) => distance(player, a) - distance(player, b))[0];
    if (!target) return;

    let multiplier = 1;
    const notes = [];
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

    const feedback = notes[0] || `${attack.name} dealt normal damage.`;
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
