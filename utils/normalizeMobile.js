function normalizeMobile(mobile) {
  mobile = mobile.replace(/[^\d+]/g, '');
  if (!mobile.startsWith('+')) {
    mobile = `+91${mobile}`;
  }
  return mobile;
}

module.exports = normalizeMobile; 