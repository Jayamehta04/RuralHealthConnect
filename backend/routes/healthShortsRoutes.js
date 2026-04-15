const express = require('express');
const router = express.Router();
const { getHealthShorts } = require('../controllers/healthShortsController');

router.get('/', getHealthShorts);

module.exports = router;
