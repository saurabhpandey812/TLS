const Notification = require('../models/Notification');

async function createNotification({ recipient, sender, type, title, message, data = {}, isRead = false }) {
  const notification = new Notification({
    recipient,
    sender,
    type,
    title,
    message,
    data,
    isRead,
  });
  await notification.save();
  return notification;
}

module.exports = { createNotification }; 