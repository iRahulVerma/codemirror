const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const jwtSecret = 'd3d8f7a6d9a813a804854d3ed642f9f1';
app.use(express.json());

app.use(cors({
  origin: 'http://10.202.77.164:5173',
  methods: ['GET', 'POST'],
  credentials: true,
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://10.202.77.164:5173",
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'codemirror',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


function authenticateToken(req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access Denied. No token provided.' });
  try {
    const verified = jwt.verify(token, jwtSecret);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(400).json({ message: 'Invalid token' });
  }
}

app.post('/api/register', async (req, res) => {
  const { mobile, password } = req.body;
  const conn = await pool.getConnection();
  try {
    const [user] = await conn.query('SELECT * FROM users WHERE mobile_number = ?', [mobile]);
    if (user.length > 0) return res.status(400).json({ message: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    await conn.query('INSERT INTO users (username, mobile_number, password) VALUES (?, ?, ?)', [mobile, mobile, hashedPassword]);
    res.status(201).json({ message: 'User registered successfully' });
  } finally {
    conn.release();
  }
});

app.post('/api/login', async (req, res) => {
  const { mobile, password } = req.body;
  const conn = await pool.getConnection();
  try {
    const [userResult] = await conn.query('SELECT * FROM users WHERE mobile_number = ?', [mobile]);
    if (userResult.length === 0) return res.status(200).json({ message: 'User Not Exist' });
    const user = userResult[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(200).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id, mobile: user.mobile_number }, jwtSecret, { expiresIn: '1h' });
    res.json({ token });
  } finally {
    conn.release();
  }
});

app.get('/api/user-details', authenticateToken, (req, res) => {
  const { userId, mobile } = req.user;
  res.json({ userId, mobile });
});

app.get('/api/protected', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const conn = await pool.getConnection();
  try {
    const [userResult] = await conn.query('SELECT id, username, mobile_number FROM users WHERE id = ?', [userId]);
    res.json({ message: 'Protected data', user: req.user, user_info: userResult[0] });
  } finally {
    conn.release();
  }
});

app.post('/api/code/publish', async (req, res) => {
  const { uid, publicName } = req.body;
  const conn = await pool.getConnection();
  try {
    const [publishedResult] = await conn.query('INSERT INTO published_code (uid, published_name) VALUES(?,? )', [uid,publicName]);
    if (publishedResult.length === 0) return res.status(200).json({ message: 'Code Not Published' });
    res.json({ message: `Code Published at ${publicName}`});
  } finally {
    conn.release();
  }
});

app.get('/api/code/published/:publishedId', async (req, res) => {
  const publishedId = req.params.publishedId;
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query('SELECT code, published_code.uid, published_name FROM code_data INNER JOIN published_code on published_code.uid = code_data.user_id WHERE published_code.published_name = ?', [publishedId]);
    res.json({ code: result.length > 0 ? result[0].code : '', uid:result.length > 0 ? result[0].uid : ''});
  } finally {
    conn.release();
  }
});

app.get('/api/code/:userId', async (req, res) => {
  const userId = req.params.userId;
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query('SELECT code, published_name FROM code_data LEFT JOIN published_code on published_code.uid = code_data.user_id WHERE user_id = ?', [userId]);
    res.json({ code: result.length > 0 ? result[0].code : '', published:result.length > 0 ? result[0].published_name : ''});
  } finally {
    conn.release();
  }
});

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('joinRoom', (userId) => {
    socket.join(userId);
  });

  socket.on('updateCode', async ({ userId, code }) => {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'INSERT INTO code_data (user_id, code) VALUES (?, ?) ON DUPLICATE KEY UPDATE code = VALUES(code)',
        [userId, code]
      );
      socket.to(userId).emit('codeUpdate', code);
    } finally {
      conn.release();
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(5010, '0.0.0.0', () => {
  console.log('Server is running on http://10.202.77.164:5010');
});



/*
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const jwtSecret = 'd3d8f7a6d9a813a804854d3ed642f9f1';
app.use(express.json());

app.use(cors({
  //origin: 'http://codemirror.stackdart.com',
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true,
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    //origin: 'http://codemirror.stackdart.com',
    origin:"http://localhost:5173",
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const pool = new Pool({
  user: 'postgres',
  password: 'postgres',
  database: 'codemirror',
  host: 'localhost',
  port: 5432,
});

function authenticateToken(req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Access Denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, jwtSecret);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(400).json({ message: 'Invalid token' });
  }
}

app.post('/api/register', async (req, res) => {
  const { mobile, password } = req.body;

  const user = await pool.query('SELECT * FROM users WHERE mobile_number = $1', [mobile]);
  if (user.rows.length > 0) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await pool.query('INSERT INTO users (username, mobile_number, password) VALUES ($1, $2, $3)', [mobile, mobile, hashedPassword]);
  
  return res.status(201).json({ message: 'User registered successfully' });
});

// Login Route
app.post('/api/login', async (req, res) => {
    const { mobile, password } = req.body;

  const userResult = await pool.query('SELECT * FROM users WHERE mobile_number = $1', [mobile]);

console.log("userResult>>>",userResult);

  if(userResult.rows.length > 0) {
    const user = userResult.rows[0];
    if (!user) {
      return res.status(200).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(200).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, mobile: user.mobile }, jwtSecret, { expiresIn: '1h' });

    return res.json({ token });

  }else{
    return res.status(200).json({ message: 'User Not Exist' });
  }
});

app.get('/api/user-details', authenticateToken, (req, res) => {
  const { userId, mobile } = req.user;
  res.json({ userId, mobile });
});

app.get('/api/protected', authenticateToken, async (req, res) => {
  const user_id = req?.user?.userId ?? 0;
  const userResult = await pool.query('SELECT id,username,mobile_number FROM users WHERE id = $1', [user_id]);
  const userData = userResult.rows[0];
  res.json({ message: 'Protected data', user: req.user, user_info: userData });
});

app.get('/api/code/:userId', async (req, res) => {
  const userId = req.params.userId;
  const result = await pool.query('SELECT code FROM code_data WHERE user_id = $1', [userId]);
  if (result.rows.length > 0) {
    res.json({ code: result.rows[0].code });
  } else {
    res.json({ code: '' });
  }
});

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('joinRoom', (userId) => {
    socket.join(userId);
  });

  socket.on('updateCode', async ({ userId, code }) => {
    await pool.query(
      'INSERT INTO code_data (user_id, code) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET code = $2',
      [userId, code]
    );
    
    socket.to(userId).emit('codeUpdate', code);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(5010, () => {
  console.log('Server is running on http://localhost:5010');
});
*/