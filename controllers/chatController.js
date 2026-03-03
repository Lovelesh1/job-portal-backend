const Chat = require("../models/Chat");
const User = require("../models/User");

// Get all chats for admin
const getAllChats = async (req, res) => {
  try {
    const chats = await Chat.find({ isActive: true })
      .populate("participants", "name email role")
      .populate("lastMessage.sender", "name")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get specific chat messages
const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId)
      .populate("messages.sender", "name role")
      .populate("participants", "name email role");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send message
const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const newMessage = {
      sender: senderId,
      content,
      timestamp: new Date()
    };

    chat.messages.push(newMessage);
    chat.lastMessage = {
      content,
      timestamp: new Date(),
      sender: senderId
    };

    await chat.save();
    
    const populatedChat = await Chat.findById(chatId)
      .populate("messages.sender", "name role")
      .populate("lastMessage.sender", "name");

    res.json(populatedChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new chat
const createChat = async (req, res) => {
  try {
    const { participantId } = req.body;
    const adminId = req.user.id;

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      participants: { $all: [adminId, participantId] }
    });

    if (existingChat) {
      return res.json(existingChat);
    }

    const newChat = new Chat({
      participants: [adminId, participantId]
    });

    await newChat.save();
    
    const populatedChat = await Chat.findById(newChat._id)
      .populate("participants", "name email role");

    res.status(201).json(populatedChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    await Chat.updateOne(
      { _id: chatId },
      { $set: { "messages.$[elem].isRead": true } },
      { arrayFilters: [{ "elem.sender": { $ne: userId } }] }
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get chat statistics
const getChatStats = async (req, res) => {
  try {
    const totalChats = await Chat.countDocuments({ isActive: true });
    const activeChats = await Chat.countDocuments({ 
      isActive: true,
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    const unreadMessages = await Chat.aggregate([
      { $unwind: "$messages" },
      { $match: { "messages.isRead": false, "messages.sender": { $ne: req.user.id } } },
      { $count: "total" }
    ]);

    res.json({
      totalChats,
      activeChats,
      unreadMessages: unreadMessages[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllChats,
  getChatMessages,
  sendMessage,
  createChat,
  markAsRead,
  getChatStats
};