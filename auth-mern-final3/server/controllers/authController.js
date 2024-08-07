const User = require('../models/user');
const { hashPassword, comparePassword } = require('../helpers/auth');
const { verifyRecaptcha } = require('../helpers/recaptcha');
const jwt = require('jsonwebtoken');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const test = (req, res) => {
  res.json('test is working');
};

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

// Handle file upload
const handleFileUpload = upload.single('image');

const uploadImage = (req, res) => {
  handleFileUpload(req, res, (err) => {
    if (err) {
      return res.status(400).send('Error uploading file.');
    }
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    res.status(200).send('File uploaded successfully');
  });
};

// Run Python script
const runPythonScript = (req, res) => {
  const pythonScriptPath = path.join(__dirname, 'plaka_v1.py');
  const childPython = spawn('python', [pythonScriptPath]);

  childPython.on('close', (code) => {
    if (code === 0) {
      fs.readFile('output.txt', 'utf8', (err, data) => {
        if (err) {
          return res.status(500).send('Error reading output.txt');
        }
        res.status(200).json({ output: data });
      });
    } else {
      res.status(500).send('Error running Python script.');
    }
  });
};

const sendResponse = (res, statusCode, contentType, data) => {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(data);
};

const handlePostRequest = (req, res) => {
  let body = '';

  req.on('data', chunk => {
      body += chunk.toString();
  });

  req.on('end', () => {
      const inputData = JSON.parse(body);
      const childPython = spawn('python', ['Random_büyüklük.py', JSON.stringify(inputData)]);

      childPython.on('close', async (code) => {
          console.log(`Python script exited with code ${code}`);
          try {
              const data = await fs.readFile('tahmin_sonucu.txt', 'utf8');
              sendResponse(res, 200, 'application/json', JSON.stringify({ prediction: data.trim() }));
          } catch (err) {
              sendResponse(res, 500, 'text/plain', '500 Internal Server Error');
          }
      });

      childPython.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
      });
  });
};


// Register Endpoint
const registerUser = async (req, res) => {
  try {
    const { name, email, password, captchaValue } = req.body;
    
    // Verify reCAPTCHA
    const isCaptchaValid = await verifyRecaptcha(captchaValue);
    if (!isCaptchaValid) {
      return res.status(400).json({ error: 'Invalid reCAPTCHA. Please try again.' });
    }

    // Check if name was entered
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Validate password strength
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+=-])(?=.{8,}$)/;
    if (!password || !strongPasswordRegex.test(password)) {
      return res.status(400).json({
        error: 'Password is required and should be at least 8 characters long, containing at least one lowercase letter, one uppercase letter, one number, and one special character',
      });
    }

    // Check email
    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(400).json({ error: 'Email is already taken' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name, 
      email, 
      password: hashedPassword,
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while registering the user.' });
  }
};

// Login Endpoint
const loginUser = async (req, res) => {
  try {
    const { email, password, captchaValue } = req.body;

    // Verify reCAPTCHA
    const isCaptchaValid = await verifyRecaptcha(captchaValue);
    if (!isCaptchaValid) {
      return res.status(400).json({ error: 'Invalid reCAPTCHA. Please try again.' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No user found' });
    }

    // Check if user is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 1000);
      return res.status(403).json({ error: `Too many failed attempts. Please try again in ${lockTimeRemaining} seconds.` });
    }

    // Check if passwords match
    const match = await comparePassword(password, user.password);
    if (match) {
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();

      const token = jwt.sign({ email: user.email, id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '5m' });
      const expiry = Date.now() + 60 * 5000; // 1 minute from now
      res.cookie('token', token).json({ user, expiry });
    } else {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 1 * 60 * 5000; // 5 minutes lock
      }
      await user.save();

      res.status(401).json({ error: 'Passwords do not match' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while logging in.' });
  }
};

const getProfile = (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.json(user);
    });
  } else {
    res.status(401).json(null);
  }
};

const logoutUser = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};


module.exports = {
  test,
  registerUser,
  loginUser,
  getProfile,
  logoutUser,
  handleFileUpload,  // Ensure this is exported
  runPythonScript,
  sendResponse,
  handlePostRequest
};
