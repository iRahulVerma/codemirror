import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';

const CodeEditor = () => {
  const navigate = useNavigate();
  const [userId, setUserID ]  = useState();
  const [code, setCode] = useState('');
  const [theme, setTheme] = useState("light");
  const editorRef = useRef(null);
  const socket = io('http://localhost:5010');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if(!user){
      navigate(`/login`);
    }else{
      setUserID(user.userId);
      if (user.userId) {
        socket.emit('joinRoom', user.userId);
  
        fetch(`http://localhost:5010/api/code/${user.userId}`)
          .then((res) => {
            if (!res.ok) {
              throw new Error('Network response was not ok');
            }
            return res.json();
          })
          .then((data) => {
            if (data.code) {
              setCode(data.code);
            }
          })
          .catch((error) => console.error('Error fetching code:', error));
  
        socket.on('codeUpdate', (newCode) => {
          setCode(newCode);
        });
      }
    }
    return () => {
      socket.disconnect();
    };

  }, [userId, theme]);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };


  const handleEditorChange = (value) => {
    setCode(value);
    socket.emit('updateCode', { userId, code: value });
  };

  const downloadCodeAsTxt = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'code.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="nav">
  <input type="checkbox" id="nav-check"/>
  <div className="nav-header">
  </div>
  <div className="nav-btn">
    <label htmlFor="nav-check">
      <span></span>
      <span></span>
      <span></span>
    </label>
  </div>
  <div className="nav-links">
    <a onClick={(e) => {
        e.preventDefault();
        theme === "light" ? setTheme("vs-dark") : setTheme("light");
      }
      }>Theme</a>
    <a onClick={(e) => {e.preventDefault(); formatCode()}}>Format</a>
    <a onClick={(e) => {e.preventDefault(); downloadCodeAsTxt()}}>Download</a>
    <a >Settings</a>
    <a onClick={(e) => {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("user_info");
        navigate(`/login`);
      }
      }>Logout</a>
  </div>
</div>
    <div className="editor-container">
        <Editor
          height="100vh"
          theme={theme}
          defaultLanguage="javascript"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
        />
    </div>
    </div>
  )
};

export default CodeEditor;
