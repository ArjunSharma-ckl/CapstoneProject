import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { defaultLessonData } from './data/defaultLessonData.js';
import LandingPage from './components/LandingPage.jsx';
import StudentJoin from './components/StudentJoin.jsx';
import PresenterDashboard from './components/PresenterDashboard.jsx';
import StudentView from './components/StudentView.jsx';
import DevMode from './components/DevMode.jsx';

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
  const socketRef = useRef(null);
  const [view, setView] = useState('landing');
  const [lessonData, setLessonData] = useState(readLessonData);
  const [roomCode, setRoomCode] = useState(lessonData.roomCode || 'BIO123');
  const [studentName, setStudentName] = useState('');
  const [roomState, setRoomState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [devOpen, setDevOpen] = useState(false);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('room:state', (state) => {
      setRoomState(state);
      if (state?.roomCode) setRoomCode(state.roomCode);
    });
    return () => socket.disconnect();
  }, []);

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
    const cleanCode = code.trim().toUpperCase() || 'BIO123';
    setRoomCode(cleanCode);
    setView('presenter');
    socketRef.current?.emit('room:create', { roomCode: cleanCode, lessonData });
  }

  function joinRoom({ code, name }) {
    const cleanCode = code.trim().toUpperCase() || 'BIO123';
    setRoomCode(cleanCode);
    setStudentName(name.trim() || 'Student');
    setView('student');
    socketRef.current?.emit('room:join', { roomCode: cleanCode, name: name.trim() || 'Student' });
  }

  function emitControl(action, payload = {}) {
    socketRef.current?.emit('presenter:control', {
      roomCode,
      action,
      payload
    });
  }

  return (
    <div className="app-shell">
      {view === 'landing' && (
        <LandingPage
          lessonData={lessonData}
          connected={connected}
          roomCode={roomCode}
          setRoomCode={setRoomCode}
          onPresenter={createPresenterRoom}
          onStudent={() => setView('join')}
          onDev={() => setDevOpen(true)}
        />
      )}

      {view === 'join' && (
        <StudentJoin
          defaultRoomCode={roomCode}
          connected={connected}
          onJoin={joinRoom}
          onBack={() => setView('landing')}
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
          onBack={() => setView('landing')}
          onDev={() => setDevOpen(true)}
        />
      )}

      {view === 'student' && (
        <StudentView
          connected={connected}
          roomCode={roomCode}
          studentName={studentName}
          roomState={roomState}
          lessonData={activeLessonData}
          socket={socketRef.current}
          onBack={() => setView('join')}
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
