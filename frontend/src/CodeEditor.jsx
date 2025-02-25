import { useEffect, useState, useRef } from 'react';

import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from './constants';

const CodeEditor = () => {
  const navigate = useNavigate();
  const [userId, setUserID ]  = useState();
  const [userInfo, setUserInfo] = useState("");
  const [code, setCode] = useState('');
  const [theme, setTheme] = useState("vs-dark");
  const [language, setLanguage] = useState("javascript");
  const [publicName,setPublicName] = useState(false);
  const [publishedName, setPublishedName] = useState("");
  const editorRef = useRef(null);
  const publicNameRef = useRef(null);
  const socketRef = useRef(null);
  //const socket = io(`${API_BASE_URL}`);
  let { userId:uID } = useParams();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      navigate(`/login`);
      return;
    }
    setUserInfo(JSON.parse(localStorage.getItem("user_info")) ?? "");

    if (!uID) return;

    if (!socketRef.current) {
      socketRef.current = io(`${API_BASE_URL}`);
    }
    const socket = socketRef.current;

    socket.emit('joinRoom', uID);

    fetch(`${API_BASE_URL}/api/code/${uID}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.code) {
          setCode(data.code);
          setPublishedName(data.published);
        }
      })
      .catch((error) => console.error('Error fetching code:', error));


    const handleCodeUpdate = (newCode) => {
      setCode(newCode);
    };
    socket.on('codeUpdate', handleCodeUpdate);

    return () => {
      socket.off('codeUpdate', handleCodeUpdate);
    };
  }, [uID, theme, language]);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };

  const savePublicName = async() => {
    const value = publicNameRef.current.value;
    setPublicName(false);

    const response = await fetch(`${API_BASE_URL}/api/code/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid:uID, publicName: value }), 
    });

    const data = await response.json();

    alert(data.message);
    window.location.reload();

/*     if (data.token) {
      localStorage.setItem('token', data.token);
      const userDetailsResponse = await fetch(`${API_BASE_URL}/api/protected`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + data.token,
        },
      });
      const userData = await userDetailsResponse.json();
      localStorage.setItem('user', JSON.stringify(userData.user));
      localStorage.setItem('user_info',  JSON.stringify(userData.user_info));
      navigate(`/${userData.user.userId}`);
    } else {
      setMessage(data.message);
    } */


  }


  const handleEditorChange = (value) => {
    if (userInfo?.id > 0) {
      setCode(value);
      if (socketRef.current) {
        socketRef.current.emit('updateCode', { userId: uID, code: value });
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
  {userInfo?.id > 0 ? (
  <div className="nav-links" >
    {userInfo.username && <a className="nav-pointer" title="User" style={{verticalAlign:"top"}}><span style={{color:"#f6ff00"}}>Hi, {userInfo.username}</span></a>}

  
  {publishedName !== null && (<a href={`/shared/${publishedName}`} target="_blank">
    <svg width="20px" height="20px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M14 1V2.5L2 6V5H0V11H2V10L4.11255 10.6162C4.0391 10.8985 4 11.1947 4 11.5C4 13.433 5.567 15 7.5 15C9.05764 15 10.3776 13.9825 10.8315 12.5759L14 13.5V15H16V1H14ZM6.0349 11.1768L8.90919 12.0152C8.69905 12.5898 8.14742 13 7.5 13C6.67157 13 6 12.3284 6 11.5C6 11.3891 6.01204 11.2809 6.0349 11.1768Z" fill="#13FC03"/></svg>
  </a>)}
  
  {publishedName === null && !publicName && (
    <a className="nav-pointer" title="Publish" onClick={(e) => {e.preventDefault(); setPublicName(true);}}>
    <svg style={{color:"#13FC03"}} xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-cloud-check-fill" viewBox="0 0 16 16">
      <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2m2.354 4.854-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708"/>
    </svg>
    </a>
  )}
  {publishedName === null && publicName && (
    <a>
      <input type="text" maxLength={10} style={{ height: '0px', width: '100px', padding: '10px 0px 10px 0px', border: 'unset', borderRadius: 'unset', fontSize: '13px'}} ref={publicNameRef}></input>&nbsp;
<svg width="15px" height="15px" viewBox="0 0 16 16" fill="none" style={{cursor:"pointer"}} xmlns="http://www.w3.org/2000/svg">
<path d="M0.0393066 10.1607L3.98955 14.1109C5.19911 15.3205 6.83963 16 8.55021 16C12.1123 16 15 13.1124 15 9.55026L15 7L7.99995 5V0L4.99995 3.57746e-08L4.99995 10.8787L2.16063 8.03934L0.0393066 10.1607Z" fill="#00fcf4" onClick={savePublicName}/>
  </svg>
    </a>
    )}

    <a className="nav-pointer" title="Theme" onClick={(e) => { e.preventDefault(); theme === "light" ? setTheme("vs-dark") : setTheme("light"); }}>
    {
    theme === "light" ? <svg  xmlns="http://www.w3.org/2000/svg"  width="20"  height="20"  viewBox="0 0 24 24"  fill="currentColor"  className="icon icon-tabler icons-tabler-filled icon-tabler-moon"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 1.992a10 10 0 1 0 9.236 13.838c.341 -.82 -.476 -1.644 -1.298 -1.31a6.5 6.5 0 0 1 -6.864 -10.787l.077 -.08c.551 -.63 .113 -1.653 -.758 -1.653h-.266l-.068 -.006l-.06 -.002z" /></svg>
    : <svg  xmlns="http://www.w3.org/2000/svg"  width="20"  height="20"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  strokeWidth="2"  strokeLinecap="round"  strokeLinejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-sun"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" /></svg>
    }
      </a>

      <a className="nav-pointer" title="Language" onClick={(e) => {e.preventDefault();}}>
      <select onChange={(e)=> setLanguage(e.target.value)}>
<option value="apex">apex</option>
<option value="azcli">azcli</option>
<option value="bat">bat</option>
<option value="c">c</option>
<option value="clojure">clojure</option>
<option value="coffeescript">coffeescript</option>
<option value="cpp">cpp</option>
<option value="csharp">csharp</option>
<option value="csp">csp</option>
<option value="css">css</option>
<option value="dockerfile">dockerfile</option>
<option value="fsharp">fsharp</option>
<option value="go">go</option>
<option value="graphql">graphql</option>
<option value="handlebars">handlebars</option>
<option value="html">html</option>
<option value="ini">ini</option>
<option value="java">java</option>
<option value="javascript">javascript</option>
<option value="json">json</option>
<option value="kotlin">kotlin</option>
<option value="less">less</option>
<option value="lua">lua</option>
<option value="markdown">markdown</option>
<option value="msdax">msdax</option>
<option value="mysql">mysql</option>
<option value="objective-c">objective-c</option>
<option value="pascal">pascal</option>
<option value="perl">perl</option>
<option value="pgsql">pgsql</option>
<option value="php">php</option>
<option value="plaintext">plaintext</option>
<option value="postiats">postiats</option>
<option value="powerquery">powerquery</option>
<option value="powershell">powershell</option>
<option value="pug">pug</option>
<option value="python">python</option>
<option value="r">r</option>
<option value="razor">razor</option>
<option value="redis">redis</option>
<option value="redshift">redshift</option>
<option value="ruby">ruby</option>
<option value="rust">rust</option>
<option value="sb">sb</option>
<option value="scheme">scheme</option>
<option value="scss">scss</option>
<option value="shell">shell</option>
<option value="sol">sol</option>
<option value="sql">sql</option>
<option value="st">st</option>
<option value="swift">swift</option>
<option value="tcl">tcl</option>
<option value="typescript">typescript</option>
<option value="vb">vb</option>
<option value="xml">xml</option>
<option value="yaml">yaml</option>
</select>
      </a>

    <a className="nav-pointer" title="Format" onClick={(e) => {e.preventDefault(); formatCode()}}>

    <svg  xmlns="http://www.w3.org/2000/svg"  width="20"  height="20"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  strokeWidth="2"  strokeLinecap="round"  strokeLinejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-forms"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a3 3 0 0 0 -3 3v12a3 3 0 0 0 3 3" /><path d="M6 3a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3" /><path d="M13 7h7a1 1 0 0 1 1 1v8a1 1 0 0 1 -1 1h-7" /><path d="M5 7h-1a1 1 0 0 0 -1 1v8a1 1 0 0 0 1 1h1" /><path d="M17 12h.01" /><path d="M13 12h.01" /></svg>

    </a>
    <a className="nav-pointer" title="Download" onClick={(e) => {e.preventDefault(); downloadCodeAsTxt()}}>

    <svg  xmlns="http://www.w3.org/2000/svg"  width="20"  height="20"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  strokeWidth="2"  strokeLinecap="round"  strokeLinejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>

    </a>
    <a className="nav-pointer" title="Settings">
    <svg  xmlns="http://www.w3.org/2000/svg"  width="20"  height="20"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  strokeWidth="2"  strokeLinecap="round"  strokeLinejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>

    </a>
    <a className="nav-pointer" title="Logout" onClick={(e) => {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("user_info");
        navigate(`/login`);
      }
      }>
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-logout"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" /><path d="M9 12h12l-3 -3" /><path d="M18 15l3 -3" /></svg>
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

export default CodeEditor;
