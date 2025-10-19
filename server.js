// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('db.sqlite');

db.run(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    subject TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER,
    sender TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// create default admin (change password!)
const ADMIN_USERNAME = "Support";
const ADMIN_PASSWORD = bcrypt.hashSync("RedEnfer", 10);

// middleware auth
function verifyTokenFromHeader(req, res, next){
  const token = req.headers['authorization']?.split(' ')[1];
  if(!token) return res.status(401).json({error:'token missing'});
  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  }catch(e){
    res.status(401).json({error:'invalid token'});
  }
}

// routes
app.post('/api/login', (req,res)=>{
  const {username,password} = req.body;
  if(username!==ADMIN_USERNAME || !bcrypt.compareSync(password, ADMIN_PASSWORD))
    return res.status(401).json({error:'wrong credentials'});
  const token = jwt.sign({username}, process.env.JWT_SECRET, {expiresIn:'12h'});
  res.json({token});
});

app.post('/api/tickets', (req,res)=>{
  const {name,email,subject,message} = req.body;
  db.run("INSERT INTO tickets (name,email,subject,message) VALUES (?,?,?,?)",
    [name,email,subject,message],
    function(err){
      if(err) return res.status(500).json({error:'DB error'});
      const ticket = {id:this.lastID,name,email,subject,message};
      io.emit('new_ticket', ticket); // notify admins
      res.json({ok:true,ticket});
    }
  );
});

// messages
app.get('/api/tickets/:id/messages', (req,res)=>{
  const ticketId = req.params.id;
  db.all("SELECT * FROM messages WHERE ticket_id=? ORDER BY created_at ASC", [ticketId], (err,rows)=>{
    if(err) return res.status(500).json({error:'DB error'});
    res.json(rows||[]);
  });
});

app.post('/api/tickets/:id/message', verifyTokenFromHeader, (req,res)=>{
  const ticketId = req.params.id;
  const {content,sender} = req.body;
  if(!content) return res.status(400).json({error:'content required'});
  db.run("INSERT INTO messages (ticket_id,sender,content) VALUES (?,?,?)",
    [ticketId,sender,content], function(err){
      if(err) return res.status(500).json({error:'DB error'});
      db.get("SELECT * FROM messages WHERE id=?",[this.lastID],(err,msg)=>{
        io.to(`ticket_${ticketId}`).emit('new_message', msg);
        res.json({ok:true,msg});
      });
    }
  );
});

// serve admin page
app.get('/admin', (req,res)=>{
  res.sendFile(path.join(__dirname,'public/admin.html'));
});

// socket.io
io.on('connection', (socket)=>{
  socket.on('join_ticket', ticketId=>{
    socket.join(`ticket_${ticketId}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
