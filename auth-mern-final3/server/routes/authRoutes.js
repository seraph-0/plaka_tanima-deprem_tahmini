const express = require('express');
const router = express.Router();
const cors = require('cors');
const { test, registerUser, loginUser, getProfile, logoutUser, handleFileUpload, runPythonScript } = require('../controllers/authController');

// Middleware
router.use(cors({
  credentials: true,
  origin: 'http://localhost:5173'
}));

// Routes
router.get('/', test);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', getProfile);
router.post('/logout', logoutUser);
router.post('/upload', handleFileUpload);
router.post('/run-python', runPythonScript);

module.exports = router;
