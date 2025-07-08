const Message = require('../models/Message');
const { io } = require('../server');
const Follower = require('../models/Follower');

exports.sendMessage = async (req, res) => {
  const { sender, recipient, ciphertext } = req.body;
  if (!sender || !recipient || !ciphertext) return res.status(400).json({ error: 'Missing fields' });

  // Check mutual connection
  const followsA = await Follower.findOne({ follower: sender, following: recipient, status: 'accepted' });
  const followsB = await Follower.findOne({ follower: recipient, following: sender, status: 'accepted' });
  if (!followsA || !followsB) {
    return res.status(403).json({ error: 'Users must be mutually connected to chat.' });
  }

  const msg = await Message.create({ sender, recipient, ciphertext });
  // Emit real-time event
  io.to(recipient).emit('receive_message', { sender, recipient, ciphertext, _id: msg._id, timestamp: msg.timestamp });
  res.json(msg);
};

exports.getMessages = async (req, res) => {
  const { user1, user2 } = req.query;
  if (!user1 || !user2) return res.status(400).json({ error: 'Missing user ids' });
  const messages = await Message.find({
    $or: [
      { sender: user1, recipient: user2 },
      { sender: user2, recipient: user1 }
    ]
  }).sort({ timestamp: 1 });
  res.json(messages);
}; 