import { useEffect, useState, useRef } from 'react';

import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from './constants';

const SharedPad = () => {
  const navigate = useNavigate();
  const [userId, setUserID ]  = useState();
  const [userInfo, setUserInfo] = useState("");
  const [code, setCode] = useState('');
  const [theme, setTheme] = useState("vs-dark");
  const [language, setLanguage] = useState("javascript");
  const editorRef = useRef(null);
  const socketRef = useRef(null);
  let { sharedId:sID } = useParams();

  useEffect(() => {
    if (!sID) return;
  
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/code/published/${sID}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
  
        if (data.code) {
          setCode(data.code);
          setUserID(data.uid);
  
          if (!socketRef.current) {
            socketRef.current = io(`${API_BASE_URL}`);
          }
          
          const socket = socketRef.current;
          socket.emit('joinRoom', +data.uid);
  
          const handleCodeUpdate = (newCode) => {
            setCode(newCode);
          };
  
          socket.on('codeUpdate', handleCodeUpdate);
  
          return () => {
            socket.off('codeUpdate', handleCodeUpdate);
            socket.disconnect();
            socketRef.current = null;
          };
        }
      } catch (error) {
        console.error('Error fetching code:', error);
      }
    };
  
    fetchData();
  }, [sID, theme, language]);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };


  const handleEditorChange = (value) => {
    if (userId) {
      setCode(value);
      
      if (socketRef.current) {
        socketRef.current.emit('updateCode', { userId: +userId, code: value });
      } else {
        console.error("Socket connection is not available.");
      }
    } else {
      console.log("Editing Not Allowed. Kindly Login First");
    }
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
  {sID !== '' ? (
  <div className="nav-links" >
    <a className="nav-pointer" title="Theme" onClick={(e) => { e.preventDefault(); theme === "light" ? setTheme("vs-dark") : setTheme("light"); }}>
    {
    theme === "light" ? <svg  xmlns="http://www.w3.org/2000/svg"  width="20"  height="20"  viewBox="0 0 24 24"  fill="currentColor"  className="icon icon-tabler icons-tabler-filled icon-tabler-moon"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 1.992a10 10 0 1 0 9.236 13.838c.341 -.82 -.476 -1.644 -1.298 -1.31a6.5 6.5 0 0 1 -6.864 -10.787l.077 -.08c.551 -.63 .113 -1.653 -.758 -1.653h-.266l-.068 -.006l-.06 -.002z" /></svg>
    : <svg  xmlns="http://www.w3.org/2000/svg"  width="20"  height="20"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  strokeWidth="2"  strokeLinecap="round"  strokeLinejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-sun"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" /></svg>
    }
      </a>

    <a className="nav-pointer" title="Format" onClick={(e) => {e.preventDefault(); formatCode()}}>

    <svg  xmlns="http://www.w3.org/2000/svg"  width="20"  height="20"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  strokeWidth="2"  strokeLinecap="round"  strokeLinejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-forms"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a3 3 0 0 0 -3 3v12a3 3 0 0 0 3 3" /><path d="M6 3a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3" /><path d="M13 7h7a1 1 0 0 1 1 1v8a1 1 0 0 1 -1 1h-7" /><path d="M5 7h-1a1 1 0 0 0 -1 1v8a1 1 0 0 0 1 1h1" /><path d="M17 12h.01" /><path d="M13 12h.01" /></svg>

    </a>
    <a className="nav-pointer" title="Download" onClick={(e) => {e.preventDefault(); downloadCodeAsTxt()}}>

    <svg  xmlns="http://www.w3.org/2000/svg"  width="20"  height="20"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  strokeWidth="2"  strokeLinecap="round"  strokeLinejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>

    </a>

    <a className="nav-pointer" title="Login" onClick={(e) => {e.preventDefault();navigate(`/login`);}}>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-box-arrow-in-right" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M6 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-8A1.5 1.5 0 0 0 5 3.5v2a.5.5 0 0 0 1 0z"/>
        <path fillRule="evenodd" d="M11.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H1.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
      </svg>
    </a>
  </div>
  ) : 
  <div className="nav-links" >
    <a className="nav-pointer" title="Login" onClick={(e) => {e.preventDefault();navigate(`/login`);}}>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-box-arrow-in-right" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M6 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-8A1.5 1.5 0 0 0 5 3.5v2a.5.5 0 0 0 1 0z"/>
        <path fillRule="evenodd" d="M11.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H1.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
      </svg>
    </a>
  </div>
  }
</div>
    <div className="editor-container">
        <Editor
          height="100vh"
          theme={theme}
          defaultLanguage={language}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
        />
    </div>
    </div>
  )
};

export default SharedPad;