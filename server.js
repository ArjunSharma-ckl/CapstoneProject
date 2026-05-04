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
      questionStartedAt: null,
      revealAnswers: false,
      animation: { type: null, nonce: 0 },
      animationOverlay: true,
      pdf: null,
      students: [],
      responses: {},
      showResults: false,
      conceptStats: {},
      game: {
        active: false,
        scenarioId: 'localized-solid',
        maxHealth: 100,
        bossHealth: 100,
        round: 0,
        charges: 0,
        streak: 0,
        mutationId: null,
        log: [],
        usedCards: []
      }
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
  room.questionStartedAt = null;
  room.revealAnswers = false;
  room.showResults = false;
  room.animation = { type: null, nonce: 0 };
  room.animationOverlay = true;
  room.responses = {};
  room.conceptStats = {};
  room.game = {
    active: false,
    scenarioId: 'localized-solid',
    maxHealth: room.lessonData?.gameSettings?.bossHealth ?? 100,
    bossHealth: room.lessonData?.gameSettings?.bossHealth ?? 100,
    round: 0,
    charges: 0,
    streak: 0,
    mutationId: null,
    log: [],
    usedCards: []
  };
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

    if (action === 'lesson:start') room.lessonStarted = true;
    if (action === 'slide:set') room.slideIndex = Math.max(0, Math.min(payload.index ?? 0, (room.lessonData?.slides?.length ?? 1) - 1));
    if (action === 'slide:next') room.slideIndex = Math.min(room.slideIndex + 1, (room.lessonData?.slides?.length ?? 1) - 1);
    if (action === 'slide:previous') room.slideIndex = Math.max(room.slideIndex - 1, 0);
    if (action === 'animation:trigger') {
      room.animation = { type: payload.type, nonce: room.animation.nonce + 1 };
    }
    if (action === 'animation:toggle') room.animationOverlay = Boolean(payload.enabled);
    if (action === 'pdf:set') {
      room.pdf = payload.pdf || null;
      room.slideIndex = 0;
    }
    if (action === 'slide:send') room.lessonStarted = true;
    if (action === 'question:launch') {
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
    if (action === 'game:start') {
      room.game.active = true;
      room.game.scenarioId = payload.scenarioId || room.game.scenarioId;
      room.game.maxHealth = room.lessonData?.gameSettings?.bossHealth ?? 100;
      room.game.bossHealth = room.game.maxHealth;
      room.game.round = 1;
      room.game.charges = 0;
      room.game.streak = 0;
      room.game.mutationId = null;
      room.game.log = [];
      room.game.usedCards = [];
    }
    if (action === 'game:scenario') room.game.scenarioId = payload.scenarioId;
    if (action === 'game:mutation') room.game.mutationId = payload.mutationId || null;
    if (action === 'game:nextRound') {
      room.game.round += 1;
      const mutations = room.lessonData?.mutations ?? [];
      if (mutations.length && room.game.round % 3 === 0) {
        room.game.mutationId = mutations[(room.game.round / 3 - 1) % mutations.length].id;
      }
    }
    if (action === 'game:attack') {
      const result = calculateDamage(room, payload.treatmentId);
      if (result && room.game.charges > 0 && room.game.bossHealth > 0) {
        room.game.charges -= 1;
        room.game.bossHealth = Math.max(0, room.game.bossHealth - result.damage);
        const message = `${result.treatment.name} dealt ${result.damage} damage. ${result.scenario.feedback?.[result.treatment.id] || result.treatment.whyItWorked}`;
        room.game.log = [{ id: Date.now(), treatmentId: result.treatment.id, damage: result.damage, message }, ...room.game.log].slice(0, 8);
        room.game.usedCards = [{ treatmentId: result.treatment.id, damage: result.damage, at: Date.now() }, ...room.game.usedCards].slice(0, 10);
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
      room.game.charges += fastBonus ? 2 : 1;
      room.game.streak += 1;
      if (room.game.streak > 0 && room.game.streak % comboEvery === 0) room.game.charges += comboBonusCharges;
    } else {
      room.game.streak = 0;
    }

    emitRoom(room.roomCode);
  });

  socket.on('disconnect', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const student = room.students.find((item) => item.id === socket.data.studentId);
    if (student) student.connected = false;
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
