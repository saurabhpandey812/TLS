const User = require('../models/User');
const {generateToken} = require('../services/authService')
const bcrypt = require('bcrypt');


const signup = async (req, res) => {
  console.log('-------', req.body);

  try {
    const { email, name, password, mobile } = req.body;

    // Check if mobile already exists
    if (mobile) {
      const mobileExists = await User.findOne({ mobile });
      if (mobileExists) {
        return res.status(400).json({
          code: 400,
          success: false,
          message: "Mobile already exists",
        });
      }
    }

    // Check if email already exists
    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          code: 400,
          success: false,
          message: "Email already exists",
        });
      }
    }

    // If neither exists, create the user
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
    console.log("req.body",req.body)

let user
    if(mobile){

       user=await User.findOne({mobile})
    }

    if(email){
      user=await User.findOne({email})
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or password incorrect",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
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