import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import CodeEditor from './CodeEditor';
import SharedPad from './SharedPad';
import "./App.css";

function App() {
  const user = JSON.parse(localStorage.getItem("user"));
  if(!user){
    window.Location = `/login`;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" exact element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/:userId" element={<CodeEditor />} />
        <Route path="/shared/:sharedId" element={<SharedPad />} />
      </Routes>
    </Router>
  );
}

export default App
