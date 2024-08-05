const express = require('express');
const router = express.Router();
const accController = require('../controllers/account');

router.get("/:id", accController.getAccount); // Get account details [anyone]
router.put("/:id", accController.updateAccount); // Update account details [User auth required]

module.exports = router;
