# Cancer Treatments Interactive Lesson

A React + Express + Socket.IO classroom lesson platform for an Advanced Biology capstone presentation about cancer treatments. The presenter controls one live room, students join from their own devices, and the class finishes with a cooperative treatment-matching game.

Educational project only — not medical advice.

## Features

- Presenter dashboard with room code, synced slides, question launch/reveal, animations, analytics, game controls, and reset.
- Student join and mobile-friendly student answer view.
- Live Socket.IO sync for slides, animations, questions, reveals, game status, treatment attacks, and results.
- Cooperative game: **Treatment Team: Defeat the Cancer**.
- In-memory server state only. No database required.
- Hidden dev/admin editor with localStorage persistence, JSON export/import, and reset.
- Editable lesson slides, questions, treatment cards, game scenarios, mutation events, boss tuning, review text, and disclaimer.

## Local Setup

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

`npm run dev` starts the Node/Express server, Socket.IO, and Vite middleware together.

For a production-style build:

```bash
npm run build
npm start
```

After `dist/` exists, `npm start` serves the built React app from Express.

## Replit Deployment

1. Import this GitHub repo into Replit.
2. Run `npm install`.
3. Use `npm run dev` for development.
4. For deployment, run `npm run build`, then `npm start`.
5. Replit should expose the app on its assigned public URL. The server uses `process.env.PORT` when available.

## Presenter Use

1. Open the site and choose **Open Presenter Dashboard**.
2. Use the default room code `BIO123` or type a custom code.
3. Tell students the room code.
4. Use the dashboard to start the lesson, move slides, trigger slide animations, launch questions, reveal answers, and monitor class accuracy.
5. Start the final game when ready. Students earn treatment charges by answering questions.
6. Use treatment cards during attack phases. Treatment damage changes by scenario and mutation status.
7. Reset the session when you want to restart the room.

## Student Use

1. Open the same site URL on a phone, tablet, or laptop.
2. Choose **Join as Student**.
3. Enter a nickname and the room code.
4. Answer questions when they appear.
5. Correct answers earn treatment charges for the whole class. Fast correct answers can earn bonuses.

## Hidden Dev/Admin Mode

The small **Dev** button is in the landing page footer and presenter header.

Password:

```text
CapstonProjectA4
```

Dev mode stores edits in browser `localStorage`, so changes persist in that browser without a database. It is not real production authentication; it is only a classroom editing gate.

Dev mode can edit:

- Slide titles, descriptions, order, focus labels, and animation types.
- Questions, answer choices, correct answers, concepts, and explanations.
- Treatment card names, damage values, best-use notes, drawbacks, and explanations.
- Game scenario effectiveness multipliers.
- Mutation events and mutation damage modifiers.
- Boss health, round limit, fast-answer timing, review text, and footer disclaimer.
- Full JSON via export/import.

## PDF Slide Note

The current app uses editable React slide data instead of PDF rendering. `src/components/LessonViewer.jsx` is the connection point for future PDF.js or static PDF embed support. A PDF should be treated as a static slide background, with the existing HTML/CSS/SVG overlay animations staying separate and presenter-triggered.

## Project Structure

```text
server.js
src/App.jsx
src/components/PresenterDashboard.jsx
src/components/StudentJoin.jsx
src/components/StudentView.jsx
src/components/LessonViewer.jsx
src/components/QuestionCard.jsx
src/components/GameArena.jsx
src/components/TreatmentCard.jsx
src/components/ResultsScreen.jsx
src/components/DevMode.jsx
src/data/defaultLessonData.js
src/data/questions.js
src/data/treatments.js
src/data/slides.js
src/styles/global.css
```

## Scientific Scope

The built-in lesson covers cancer as uncontrolled cell growth caused by mutations, surgery, chemotherapy, radiation therapy, immunotherapy, CAR T-cell therapy, photodynamic therapy, combination treatment, treatment matching by cancer type/stage/spread, resistance, promising treatments, and why there is no universal cure for all cancers.
