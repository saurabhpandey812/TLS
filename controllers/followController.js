const Follower = require('../models/Follower');
const Profile = require('../models/Profile');

// Follow a user (handles private accounts)
const followUser = async (req, res) => {
  try {
    const followerId = req.user._id;
    const { userId } = req.params;
    if (followerId.toString() === userId) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself.' });
    }
    const exists = await Follower.findOne({ user: userId, follower: followerId });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Already requested or following.' });
    }
    const targetUser = await Profile.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    let status = 'accepted';
    if (targetUser.isPrivate) {
      status = 'pending';
    }
    await Follower.create({ user: userId, follower: followerId, status });
    if (status === 'accepted') {
      await Profile.findByIdAndUpdate(userId, { $inc: { followersCount: 1 } });
      await Profile.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
    }
    res.status(200).json({ success: true, message: status === 'pending' ? 'Follow request sent.' : 'Followed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to follow user', error: error.message });
  }
};

// Accept a follow request (private user only)
const acceptRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { followerId } = req.params;
    const request = await Follower.findOneAndUpdate(
      { user: userId, follower: followerId, status: 'pending' },
      { status: 'accepted' },
      { new: true }
    );
    if (!request) {
      return res.status(404).json({ success: false, message: 'No pending request found.' });
    }
    await Profile.findByIdAndUpdate(userId, { $inc: { followersCount: 1 } });
    await Profile.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
    res.status(200).json({ success: true, message: 'Follow request accepted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to accept request', error: error.message });
  }
};

// Reject a follow request (private user only)
const rejectRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { followerId } = req.params;
    const deleted = await Follower.findOneAndDelete({ user: userId, follower: followerId, status: 'pending' });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'No pending request found.' });
    }
    res.status(200).json({ success: true, message: 'Follow request rejected.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject request', error: error.message });
  }
};

// Get pending follow requests (for private user)
const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const requests = await Follower.find({ user: userId, status: 'pending' })
      .populate('follower', 'name username avatar')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, requests: requests.map(r => r.follower) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch pending requests', error: error.message });
  }
};

// Unfollow a user
const unfollowUser = async (req, res) => {
  try {
    const followerId = req.user._id;
    const { userId } = req.params;
    const deleted = await Follower.findOneAndDelete({ user: userId, follower: followerId });
    if (!deleted) {
      return res.status(400).json({ success: false, message: 'Not following.' });
    }
    await Profile.findByIdAndUpdate(userId, { $inc: { followersCount: -1 } });
    await Profile.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
    res.status(200).json({ success: true, message: 'Unfollowed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to unfollow user', error: error.message });
  }
};

// Get followers of a user
const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const followers = await Follower.find({ user: userId })
      .populate('follower', 'name username avatar')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, followers: followers.map(f => f.follower) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch followers', error: error.message });
  }
};

// Get following of a user
const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const following = await Follower.find({ follower: userId })
      .populate('user', 'name username avatar')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, following: following.map(f => f.user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch following', error: error.message });
  }
};

module.exports = { followUser, unfollowUser, getFollowers, getFollowing, acceptRequest, rejectRequest, getPendingRequests }; 