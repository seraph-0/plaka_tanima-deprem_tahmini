const express = require('express');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const port = 8000;

// Database connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('Database Connected'))
  .catch(err => console.log('Database not connected', err));

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  credentials: true,
  origin: 'http://localhost:5173'
}));

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, 'input.jpg'); // Fixed filename
  }
});
const upload = multer({ storage: storage });

// File upload endpoint
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.status(200).send('File uploaded successfully');
});

// Run Python script endpoint
app.post('/run-python', (req, res) => {
  const pythonScriptPath = path.join(__dirname, 'plaka_v1.py');
  const childPython = spawn('python', [pythonScriptPath]);

  let scriptOutput = '';

  childPython.stdout.on('data', (data) => {
    scriptOutput += data.toString();
  });

  childPython.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  childPython.on('close', (code) => {
    if (code === 0) {
      // If the Python script runs successfully
      fs.readFile('output.txt', 'utf8', (err, data) => {
        if (err) {
          return res.status(500).send('Error reading output.txt');
        }
        res.status(200).json({ output: data });
        fs.unlink('output.txt', (err) => {
          if (err) {
            console.error('Error deleting output.txt:', err);
          } else {
          }
        });
        fs.unlink('./uploads/input.jpg', (err) => {
          if (err) {
            console.error('Error deleting input.jpg:', err);
          } else {
          }
        });
      });
    } else {
      res.status(500).send('Error running Python script.');
    }
  });
});

app.post('/run-script', (req, res) => {
  const pythonScriptPath = path.join(__dirname, 'Random_büyüklük.py');
  const inputData = JSON.stringify(req.body);

  const childPython = spawn('python', [pythonScriptPath, inputData]);

  let scriptOutput = '';

  childPython.stdout.on('data', (data) => {
    scriptOutput += data.toString();
  });

  childPython.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  childPython.on('close', (code) => {
    if (code === 0) {
      fs.readFile('tahmin_sonucu.txt', 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading tahmin_sonucu.txt:', err);
          return res.status(500).json({ error: 'Error reading tahmin_sonucu.txt' });
        }
        res.status(200).json({ prediction: data.trim() });
      });
      fs.unlink('tahmin_sonucu.txt', (err) => {
        if (err) {
          console.error('Error deleting tahmin_sonucu.txt:', err);
        } else {
        }
      });
    } else {
      res.status(500).json({ error: 'Error running Python script.' });
    }
  });
});

// Import routes
const authRoutes = require('./routes/authRoutes');

// Use routes
app.use(authRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
