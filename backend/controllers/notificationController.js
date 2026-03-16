const Notification = require('../models/Notification');
const socket = require('../socket');

exports.sendNotification = async ({ user, actor, type, title, body, link}) => {
  try {
    const notification = new Notification({ user, actor, type, title, body, link });
    await notification.save();

    try {
      socket.getIO().to(`user_${user}`).emit('notification', notification);
    } catch (err) {
      console.warn('Socket i/o not ready for notification emit', err.message);
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification', error);
    throw error;
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notification', error: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark all notifications read', error: error.message });
  }
};
