// Mock database for development when MongoDB is not available
class MockDatabase {
  constructor() {
    this.users = new Map();
    this.profiles = new Map();
    this.posts = new Map();
    this.comments = new Map();
    this.likes = new Map();
    this.followers = new Map();
    this.shares = new Map();
  }

  // User operations
  async createUser(userData) {
    const id = Date.now().toString();
    const user = { id, ...userData, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async findUserById(id) {
    return this.users.get(id) || null;
  }

  async findUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id, updateData) {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, ...updateData, updatedAt: new Date() };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return null;
  }

  // Profile operations
  async createProfile(profileData) {
    const id = Date.now().toString();
    const profile = { id, ...profileData, createdAt: new Date() };
    this.profiles.set(id, profile);
    return profile;
  }

  async findProfileById(id) {
    return this.profiles.get(id) || null;
  }

  async updateProfile(id, updateData) {
    const profile = this.profiles.get(id);
    if (profile) {
      const updatedProfile = { ...profile, ...updateData, updatedAt: new Date() };
      this.profiles.set(id, updatedProfile);
      return updatedProfile;
    }
    return null;
  }

  // Post operations
  async createPost(postData) {
    const id = Date.now().toString();
    const post = { id, ...postData, createdAt: new Date() };
    this.posts.set(id, post);
    return post;
  }

  async findPostById(id) {
    return this.posts.get(id) || null;
  }

  async findPostsByUserId(userId) {
    const userPosts = [];
    for (const post of this.posts.values()) {
      if (post.userId === userId) {
        userPosts.push(post);
      }
    }
    return userPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async getAllPosts() {
    return Array.from(this.posts.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Comment operations
  async createComment(commentData) {
    const id = Date.now().toString();
    const comment = { id, ...commentData, createdAt: new Date() };
    this.comments.set(id, comment);
    return comment;
  }

  async findCommentsByPostId(postId) {
    const postComments = [];
    for (const comment of this.comments.values()) {
      if (comment.postId === postId) {
        postComments.push(comment);
      }
    }
    return postComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  // Like operations
  async createLike(likeData) {
    const id = `${likeData.userId}-${likeData.postId}`;
    const like = { id, ...likeData, createdAt: new Date() };
    this.likes.set(id, like);
    return like;
  }

  async removeLike(userId, postId) {
    const id = `${userId}-${postId}`;
    return this.likes.delete(id);
  }

  async findLikeByUserAndPost(userId, postId) {
    const id = `${userId}-${postId}`;
    return this.likes.get(id) || null;
  }

  async getLikeCountForPost(postId) {
    let count = 0;
    for (const like of this.likes.values()) {
      if (like.postId === postId) {
        count++;
      }
    }
    return count;
  }

  // Follower operations
  async createFollower(followerData) {
    const id = `${followerData.followerId}-${followerData.followingId}`;
    const follower = { id, ...followerData, createdAt: new Date() };
    this.followers.set(id, follower);
    return follower;
  }

  async removeFollower(followerId, followingId) {
    const id = `${followerId}-${followingId}`;
    return this.followers.delete(id);
  }

  async getFollowers(userId) {
    const userFollowers = [];
    for (const follower of this.followers.values()) {
      if (follower.followingId === userId) {
        userFollowers.push(follower);
      }
    }
    return userFollowers;
  }

  async getFollowing(userId) {
    const userFollowing = [];
    for (const follower of this.followers.values()) {
      if (follower.followerId === userId) {
        userFollowing.push(follower);
      }
    }
    return userFollowing;
  }

  // Share operations
  async createShare(shareData) {
    const id = Date.now().toString();
    const share = { id, ...shareData, createdAt: new Date() };
    this.shares.set(id, share);
    return share;
  }

  async getShareCountForPost(postId) {
    let count = 0;
    for (const share of this.shares.values()) {
      if (share.postId === postId) {
        count++;
      }
    }
    return count;
  }
}

// Create a singleton instance
const mockDb = new MockDatabase();

// Initialize with some sample data
const initializeMockData = () => {
  // Add sample users
  mockDb.createUser({
    email: 'test@example.com',
    password: '$2b$10$hashedpassword', // This would be hashed in real app
    firstName: 'John',
    lastName: 'Doe',
    role: 'user'
  });

  mockDb.createUser({
    email: 'lawyer@example.com',
    password: '$2b$10$hashedpassword',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'lawyer'
  });

  console.log('Mock database initialized with sample data');
};

module.exports = { mockDb, initializeMockData }; 