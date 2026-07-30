const express = require('express');
const { authenticateToken } = require('../../middleware/auth');
const { login, profile } = require('../../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.get('/profile', authenticateToken, profile);

module.exports = router;
