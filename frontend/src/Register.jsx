import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');



  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5010/api/register', {
        mobile,
        password,
      });
      setMessage(response.data.message);
    } catch (err) {
      setMessage('Error registering user');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleRegister}>
        <h2>Code Mirror Regiser User</h2>
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
        <button type="submit" className="register-btn">Register</button>
        <br/><br/>
        <Link to="/login">Existing User Login</Link>
        {message && <p>{message}</p>}
      </form>
    </div>
  );

/*   return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        
        <input
          type="text"
          placeholder="Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Register</button>
        <br/>
        <Link to="/login">Existing User Login</Link>
        {message && <p>{message}</p>}
      </form>
    </div>
  ); */
};

export default Register;
