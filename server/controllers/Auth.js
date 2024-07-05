const OTP = require("../models/OTP");
const User = require("../models/User");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
//sendOTP

exports.sendOTP = async (req, res) => {
  try {
    //fetch email from request body
    const { email } = req.body;

    //check if user already exist
    const checkUserPresent = await User.findOne({ email });

    //if user already exsit then return a response
    if (checkUserPresent) {
      return res.status(401).json({
        sucess: false,
        message: "User already registered",
      });
    }

    //generate otp

    let otp = otpGenerator.generate(6, {
      upperCaseAlphatbets: false,
      lowerCaseAplhabets: false,
      specialChars: false,
    });
    console.log("otp generated: ", otp);

    //check if otp is unique or not

    const result = await OTP.findOne({ otp: otp });
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphatbets: false,
        lowerCaseAplhabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp: otp });
    }

    const otpPayload = { email, otp };

    //create an entry for OTP
    const otpBody = await OTP.create(otpPayload);
    console.log(otpBody);

    //return response sucessful

    res.status(200).json({
      sucess: true,
      message: "OTP sent sucessfully",
      otp,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//signup

exports.signUp = async (req, res) => {
  try {
    //data fetch from request body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;

    //validate
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        sucess: false,
        message: "All fields are required",
      });
    }

    //match password

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Password and confirm password value doesnot match, please try again",
      });
    }
    //check user already exist

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        sucess: false,
        message: "User is already registered",
      });
    }

    //find most recent OTP stored for the user

    const recentOtp = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);
    console.log(recentOtp);

    //validate OTP

    if (recentOtp.length == 0) {
      //OTP not found
      return res.status(400).json({
        sucess: false,
        message: "OTP not found",
      });
    } else if (otp !== recentOtp.otp) {
      //Invalid OTP
      return res.status(400).json({
        sucess: false,
        message: "Invalid OTP",
      });
    }

    //Hash the password

    const hashedPassword = await bcrypt.hash(password, 10);
    //Create entry in DB
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });
    //Used dicebear 3rd party service for profile image
    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType,
      additionalDetails: profileDetails._id,
      image:
        "https://api.dicebear.com/9.x/initials/svg?seed=${firstName} ${lastName}",
    });

    return res.status(200).json({
      success: true,
      message: "User is registered successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Please try again",
    });
  }
};

//login

exports.login = async (req, res) => {
  try {
    //get data from req body
    const { email, oassword } = req.body;

    //validation data
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "All fields are required,please try again",
      });
    }
    //user check exsit or not
    const user = await User.findOne({ email }).populate("additionDetails");

    if (!user) {
      return res.status(401).json({
        sucess: false,
        message: "User is not registered, please try again",
      });
    }

    //generate jwt, after match password matching

    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
        role: user.accountType,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });
      user.token = token;
      user.password = undefined;
      //create cookie and send response
      const option = {
        expires: new Date(date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };

      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: "Logged in successfully",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Login failed, please try again",
    });
  }
};

//changePassword

exports.changePassword = async (req, res) => {
  //get data from req body
  //get oldPassword,newPassword,confirmNewPassword
  //validation
  //update password in DB
  //send mail- Password updated
  //return response
};
