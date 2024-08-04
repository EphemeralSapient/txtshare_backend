const express = require("express");
const txtController = require("../controllers/txt");
const router = express.Router();

// Routes, accounts require OAuth verification while guest requires nothing.
router.post("/", txtController.uploadTxt); // Upload [accounts/guest]
router.delete("/:urlCode", txtController.deleteTxt); // Delete [accounts]
router.get("/:urlCode", txtController.getTxt); // View [accounts/guest]
router.put("/:urlCode", txtController.updateTxt); // Edit/history [accounts]

module.exports = router;
