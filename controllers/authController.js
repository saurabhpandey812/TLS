const User = require('../models/User');
const {generateToken} = require('../services/authService')

const signup = async (req, res) => {
    console.log('-------', req.body);
    
  try {
    const { email, name, password, mobile } = req.body;

    const user = await User.create({
      name,
      email,
      password,
      mobile,
    });

    res.status(200).json({
      code: 200,
      success: true,
      message: "Registration successful",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong during signup",
    });
  }
};




const login = async (req, res) => {
  try {
    const { email, mobile, password } = req.body;
    // Find user by email or mobile
    const user = await User.findOne({
      $or: [
        email ? { email } : {},
        mobile ? { mobile } : {}
      ],
      password
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or password incorrect",
      });
    }
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
      },
      accessToken: token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong during login",
    });
  }
};

module.exports = { signup, login };
