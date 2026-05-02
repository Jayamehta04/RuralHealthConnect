const Message = require('../models/Message');
const User = require('../models/User');
const { sendNotification } = require('./notificationController');

exports.getConversation = async (req, res) => {
  try {
    const { withUserId } = req.query;
    const userId = req.user.id;

    if (!withUserId) {
      return res.status(400).json({ message: 'withUserId query is required' });
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: withUserId },
        { sender: withUserId, receiver: userId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const sender = req.user.id;
    const { receiverId, text, senderImage, text_en, text_hi } = req.body;

    if (!receiverId || !text) {
      return res.status(400).json({ message: 'receiverId and text are required' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const message = await Message.create({ sender, receiver: receiverId, text, senderImage, text_en, text_hi });

    await sendNotification({
      user: receiverId,
      actor: sender,
      type: 'new_message',
      title: 'New chat message',
      body: `You have a new message from user ${sender}`,
      link: '/chat?withUserId=' + sender
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};