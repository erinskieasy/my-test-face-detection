import FaceDetection from './components/FaceDetection';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>ID Card Face Detection</h1>
      </header>
      <main className="app-main">
        <FaceDetection />
      </main>
    </div>
  );
}

export default App;
