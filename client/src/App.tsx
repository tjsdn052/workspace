import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Lobby } from "./components/Lobby";
import { CodeEditor } from "./components/Editor";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/room/:roomId" element={<CodeEditor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
