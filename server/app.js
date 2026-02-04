require('dotenv').config();

const express = require('express');
const path = require('path');

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'html', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
