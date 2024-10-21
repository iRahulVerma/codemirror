import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const response = await fetch('http://localhost:5010/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mobile, password }),
    });

    const data = await response.json();

    if (data.token) {
      localStorage.setItem('token', data.token);
      const userDetailsResponse = await fetch('http://localhost:5010/api/protected', {
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
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Code Mirror Login</h2>
        <div className="input-container">
        <input
          type="text"
          placeholder="Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          required
        />
        </div>
        <div className="input-container">
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        </div>
        <button type="submit" className="login-btn">Login</button>
        <br/><br/>
        <Link to="/register">Register User</Link>
        {message && <p>{message}</p>}
      </form>
    </div>
  );
};

export default Login;