const express = require('express');

const { signup, loginCamera, loginQr } = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login-camera', loginCamera);
router.post('/login-qr', loginQr);

module.exports = router;
