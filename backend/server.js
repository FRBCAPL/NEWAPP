const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Mock data
let notes = [
  { _id: '1', text: 'Welcome to the Pool League! 🎱', createdAt: new Date() },
  { _id: '2', text: 'New tournament starting next week', createdAt: new Date() }
];

let users = [
  { 
    _id: '1', 
    email: 'admin@bcapl.com', 
    firstName: 'Admin', 
    lastName: 'User',
    divisions: ['FRBCAPL TEST', 'Singles Test']
  },
  { 
    _id: '2', 
    email: 'frbcapl@gmail.com', 
    firstName: 'Pool', 
    lastName: 'Player',
    divisions: ['FRBCAPL TEST']
  }
];

let proposals = [];
let matches = [];
let messages = [];

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pool League Backend API', 
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Notes endpoints
app.get('/api/notes', (req, res) => {
  res.json(notes);
});

app.post('/api/notes', (req, res) => {
  const newNote = {
    _id: Date.now().toString(),
    text: req.body.text,
    createdAt: new Date()
  };
  notes.push(newNote);
  res.json(newNote);
});

app.delete('/api/notes/:id', (req, res) => {
  notes = notes.filter(note => note._id !== req.params.id);
  res.json({ message: 'Note deleted' });
});

// Users endpoints
app.get('/api/users/:identifier', (req, res) => {
  const identifier = decodeURIComponent(req.params.identifier);
  const user = users.find(u => u.email === identifier || u._id === identifier);
  
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.get('/api/users', (req, res) => {
  res.json(users);
});

// Messages endpoints
app.get('/api/messages/unread', (req, res) => {
  const userEmail = req.query.user;
  const unreadMessages = messages.filter(msg => 
    msg.receiverEmail === userEmail && !msg.read
  );
  res.json(unreadMessages);
});

// Admin endpoints
app.get('/admin/divisions', (req, res) => {
  res.json([
    { name: 'FRBCAPL TEST', _id: '1' },
    { name: 'Singles Test', _id: '2' }
  ]);
});

app.post('/admin/sync-users', (req, res) => {
  res.json({ message: 'Users synced successfully' });
});

app.listen(PORT, () => {
  console.log(`🎱 Pool League Backend running on http://localhost:${PORT}`);
  console.log(`📝 API endpoints available at http://localhost:${PORT}/api/*`);
});
