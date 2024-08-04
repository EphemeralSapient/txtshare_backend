const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

router.get('/google', authController.googleAuth); // Redirect to Google OAuth
router.get('/google/callback', authController.googleAuthCallback); // Google OAuth callback [required for OAuth 2.0 auth code]

module.exports = router;
