const express = require('express');
const router = express.Router();
const { generateToken } = require('../controllers/agoraController');

router.get('/token', generateToken);

module.exports = router;
