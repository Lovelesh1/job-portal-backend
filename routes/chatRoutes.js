const express = require("express");
const router = express.Router();
const {
  getAllChats,
  getChatMessages,
  sendMessage,
  createChat,
  markAsRead,
  getChatStats
} = require("../controllers/chatController");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

// All routes require authentication and admin role
router.use(auth);
router.use(authorize("admin"));

// Get chat statistics
router.get("/stats", getChatStats);

// Get all chats
router.get("/", getAllChats);

// Create new chat
router.post("/", createChat);

// Get specific chat messages
router.get("/:chatId", getChatMessages);

// Send message to chat
router.post("/:chatId/message", sendMessage);

// Mark messages as read
router.put("/:chatId/read", markAsRead);

module.exports = router;