const Profile = require('../models/Profile');

async function generateUsername(name) {
  let base = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!base) base = 'user';
  let username = base;
  let exists = await Profile.findOne({ username });
  let suffix = 1;
  while (exists) {
    username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    exists = await Profile.findOne({ username });
    suffix++;
    if (suffix > 10) break; // avoid infinite loop
  }
  return username;
}

module.exports = generateUsername; 