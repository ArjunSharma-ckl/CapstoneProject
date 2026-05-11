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
const uploadDir = path.join(__dirname, '.uploads');

const rooms = new Map();
const FAST_ANSWER_MS = 8000;

function cleanCode(code = '') {
  return String(code).trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
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
      conceptStats: {}
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
  if (room?.pdf?.type === 'pdf') return room.pdf.pageCount || 99;
  return room?.lessonData?.slides?.length || 0;
}

function getQuestion(room, questionId) {
  return room.lessonData?.questions?.find((question) => question.id === questionId) || null;
}

function expectedResponseCount(room) {
  return room.students.filter((item) => item.connected).length || room.students.length;
}

function updateActiveQuestionResults(room) {
  if (!room.activeQuestionId) return;
  const responseList = room.responses?.[room.activeQuestionId] || [];
  const expectedResponses = expectedResponseCount(room);
  if (expectedResponses > 0 && responseList.length >= expectedResponses) {
    room.showResults = true;
  }
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
  if (keepStudents) {
    room.students.forEach((student) => {
      student.score = 0;
    });
  } else {
    room.students = [];
  }
}

function countPdfPagesFromBuffer(buffer) {
  try {
    const text = buffer.toString('latin1');
    const matches = text.match(/\/Type\s*\/Page\b/g);
    return Math.max(1, matches?.length || 1);
  } catch {
    return 1;
  }
}

function setRoomPdf(room, pdf) {
  room.pdf = pdf || null;
  room.slideIndex = 0;
  room.activeQuestionId = null;
  room.questionStartedAt = null;
  room.revealAnswers = false;
  room.showResults = false;
}

function removeStudent(room, studentId) {
  const id = String(studentId || '');
  const student = room.students.find((item) => item.id === id);
  if (!student) return false;

  room.students = room.students.filter((item) => item.id !== id);
  Object.keys(room.responses || {}).forEach((questionId) => {
    room.responses[questionId] = room.responses[questionId].filter((response) => response.studentId !== id);
  });
  updateActiveQuestionResults(room);

  const studentSocket = io.sockets.sockets.get(id);
  if (studentSocket) {
    studentSocket.leave(room.roomCode);
    if (studentSocket.data.roomCode === room.roomCode) {
      studentSocket.data.roomCode = null;
      studentSocket.data.studentId = null;
      studentSocket.data.role = null;
    }
    studentSocket.emit('join:error', { message: 'The presenter removed you from the room.' });
  }

  return true;
}

app.put('/api/rooms/:roomCode/pdf', express.raw({ type: ['application/pdf', 'application/octet-stream'], limit: '75mb' }), (req, res) => {
  const room = createRoom(req.params.roomCode);
  const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || []);

  if (!buffer.length) {
    res.status(400).json({ error: 'No PDF uploaded.' });
    return;
  }

  fs.mkdirSync(uploadDir, { recursive: true });
  const pdfPath = path.join(uploadDir, `${room.roomCode}.pdf`);
  fs.writeFileSync(pdfPath, buffer);

  const rawName = decodeURIComponent(String(req.get('x-file-name') || 'Uploaded PDF.pdf')).replace(/[\r\n"]/g, '');
  const pdf = {
    type: 'pdf',
    name: rawName,
    url: `/api/rooms/${room.roomCode}/pdf?version=${Date.now()}`,
    pageCount: countPdfPagesFromBuffer(buffer)
  };

  setRoomPdf(room, pdf);
  emitRoom(room.roomCode);
  res.json({ pdf });
});

app.get('/api/rooms/:roomCode/pdf', (req, res) => {
  const roomCode = cleanCode(req.params.roomCode);
  const pdfPath = path.join(uploadDir, `${roomCode}.pdf`);

  if (!fs.existsSync(pdfPath)) {
    res.status(404).send('PDF not found.');
    return;
  }

  const room = rooms.get(roomCode);
  const name = (room?.pdf?.name || 'Uploaded PDF.pdf').replace(/[\r\n"]/g, '');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${name}"`);
  res.sendFile(pdfPath);
});

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
    } else {
      existing.name = displayName;
      existing.connected = true;
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
      setRoomPdf(room, payload.pdf || null);
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
    if (action === 'student:remove') {
      removeStudent(room, payload.studentId);
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
    const fastBonus = correct && Number(elapsedMs) > 0 && Number(elapsedMs) <= FAST_ANSWER_MS;

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

    if (correct) student.score += fastBonus ? 2 : 1;
    updateActiveQuestionResults(room);

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
