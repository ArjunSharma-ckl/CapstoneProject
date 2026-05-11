import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { defaultLessonData } from './data/defaultLessonData.js';
import LandingPage from './components/LandingPage.jsx';
import StudentJoin from './components/StudentJoin.jsx';
import PresenterDashboard from './components/PresenterDashboard.jsx';
import StudentView from './components/StudentView.jsx';
import DevMode from './components/DevMode.jsx';
import PasswordGate from './components/PasswordGate.jsx';
import PresentationView from './components/PresentationView.jsx';

const STORAGE_KEY = 'capstoneCancerLessonData';

function readLessonData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultLessonData;
  } catch {
    return defaultLessonData;
  }
}

export default function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const presentationRoom = searchParams.get('room');
  const socketRef = useRef(null);
  const [view, setView] = useState(searchParams.get('presentation') === '1' ? 'presentation' : 'landing');
  const [lessonData, setLessonData] = useState(readLessonData);
  const [roomCode, setRoomCode] = useState(presentationRoom || '');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [roomState, setRoomState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;
    socket.on('connect', () => {
      setConnected(true);
      setStudentId(socket.id);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('room:state', (state) => {
      setRoomState(state);
      if (state?.roomCode) setRoomCode(state.roomCode);
    });
    socket.on('join:error', (payload) => {
      setJoinError(payload?.message || 'Could not join room.');
      setView('join');
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (view === 'presentation' && connected) {
      socketRef.current?.emit('room:watch', { roomCode });
    }
  }, [connected, roomCode, view]);

  const activeLessonData = useMemo(
    () => roomState?.lessonData || lessonData,
    [roomState?.lessonData, lessonData]
  );

  function saveLessonData(nextData) {
    setLessonData(nextData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
    if (roomState?.roomCode) {
      socketRef.current?.emit('content:update', { roomCode: roomState.roomCode, lessonData: nextData });
    }
  }

  function resetLessonData() {
    saveLessonData(defaultLessonData);
  }

  function createPresenterRoom(code = roomCode) {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;
    setRoomCode(cleanCode);
    setView('presenter');
    socketRef.current?.emit('room:create', { roomCode: cleanCode, lessonData });
  }

  function joinRoom({ code, name }) {
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();
    if (!cleanCode || !cleanName) return;
    setRoomCode(cleanCode);
    setStudentName(cleanName);
    setJoinError('');
    setView('student');
    socketRef.current?.emit('room:join', { roomCode: cleanCode, name: cleanName });
  }

  function emitControl(action, payload = {}) {
    socketRef.current?.emit('presenter:control', {
      roomCode,
      action,
      payload
    });
  }

  function returnHome() {
    setRoomCode('');
    setView('landing');
  }

  return (
    <div className="app-shell">
      {view === 'landing' && (
        <LandingPage
          roomCode={roomCode}
          setRoomCode={setRoomCode}
          onPresenter={() => setView('presenterLogin')}
          onStudent={() => setView('join')}
        />
      )}

      {view === 'presenterLogin' && (
        <PasswordGate
          onSuccess={() => createPresenterRoom(roomCode)}
          onCancel={returnHome}
        />
      )}

      {view === 'join' && (
        <StudentJoin
          defaultRoomCode={roomCode}
          connected={connected}
          joinError={joinError}
          onClearError={() => setJoinError('')}
          onJoin={joinRoom}
          onBack={returnHome}
        />
      )}

      {view === 'presenter' && (
        <PresenterDashboard
          connected={connected}
          roomCode={roomCode}
          setRoomCode={setRoomCode}
          roomState={roomState}
          lessonData={activeLessonData}
          onCreateRoom={createPresenterRoom}
          onControl={emitControl}
          onBack={returnHome}
          onSaveLessonData={saveLessonData}
          onResetLessonData={resetLessonData}
        />
      )}

      {view === 'student' && (
        <StudentView
          connected={connected}
          roomCode={roomCode}
          studentName={studentName}
          studentId={studentId}
          roomState={roomState}
          lessonData={activeLessonData}
          socket={socketRef.current}
          onBack={returnHome}
        />
      )}

      {view === 'presentation' && (
        <PresentationView
          roomCode={roomCode}
          roomState={roomState}
          lessonData={activeLessonData}
          socket={socketRef.current}
        />
      )}

      {devOpen && (
        <DevMode
          lessonData={lessonData}
          onSave={saveLessonData}
          onReset={resetLessonData}
          onClose={() => setDevOpen(false)}
        />
      )}
    </div>
  );
}
