// create a class for sending again and again res.status(400).json({
// status:"",message:"",
// })

const jwt = require("jwtwebtoken");
const otpGenerator = require("otp-generator");
const crypto = require("crypto");
const User = require("../models/user");
const filterObj = require("../utils/filterObj");
const { promisify } = require("util");
const mailService = require("../services/mailer");

const signToken = (userId) => {
  jwt.sign({ userId }, process.env.JWT_SECRET);
};

// Register a new user
exports.register = async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;
  const filterBody = filterObj(
    req.body,
    "firstName",
    "lastName",
    "password",
    "email"
  );

  // check if a verified user with  given email exists or not
  const existing_user = await User.findOne({ email: email });

  if (existing_user && existing_user.verified) {
    res.status(400).json({
      status: "error",
      message: "Email is already in use, Please Login  ",
    });
  } else if (existing_user) {
    await User.findOneAndUpdate({ email: email }, filterBody, {
      new: true,
      validateModifiedOnly: true,
    });

    // generate OTP and send email to user
    req.userId = existing_user._id;
    next();
  } else {
    // If user record is not available in database
    const new_user = await User.create(filterBody);

    // generate OTP and send email to user
    req.userId = new_user._id;
    next();
  }
};

exports.sendOTP = async (req, res, next) => {
  const { userId } = req.body;
  const new_otp = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });

  // OTP expiry time calculation

  const otp_expiry_time = Date.now() + 10 * 60 * 1000; //10 min after otp is sent

  await User.findByIdAndUpdate(userId, {
    otp: new_otp,
    otp_expiry_time,
  });

  // TODO >> Send mail

  mailService.sendEmail({
    from: "techbtechblog@gmail.com",
    to: "gshubham@gmail.com",
    subject: "OTP for login",
    text: `Your OTP is ${new_otp}. This is valid for 10 mins.`,
  });

  res.status(200).json({
    status: "success",
    message: "OTP sent successfully!",
  });
};

exports.verifyOTP = async (req, res, next) => {
  // verify OTP and then update user record

  const { email, otp } = req.body;

  const user = await User.findOne({
    email,
    otp_expiry_time: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400).json({
      status: "error",
      message: "Email is invalid or OTP expired",
    });
  }

  if (!(await user.correctOTP(otp, user.otp))) {
    res.status(400).json({
      status: "error",
      message: "OTP is incorrect",
    });
  }

  // OTP is correct

  user.verified = true;
  user.otp = undefined;

  await user.save({ new: true, validateModifiedOnly: true });
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    message: "OTP verified successfully!",
    token,
  });
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      status: "error",
      message: "Both email and password are required",
    });
  }

  const userDoc = await User.findOne({ email: email }).select("+password");
  if (
    !userDoc ||
    !(await userDoc.correctPassword(password, userDoc.password))
  ) {
    res.status(400).json({
      status: "error",
      message: "Email or password is incorrect",
    });
  }

  const token = signToken(userDoc._id);
  res.status(200).json({
    status: "success",
    message: "Logged in successfully",
    token,
  });
};

exports.protect = async (req, res, next) => {
  // Getting token JWT  and check if it's there

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else {
    req.status(400).json({
      status: "error",
      message: "You are not logged In! Please log in to get access",
    });
    return;
  }

  // verification of token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check  if user still exist

  const this_user = await User.findById(decoded.userId);
  if (!this_user) {
    res.status(400).json({
      status: "error",
      message: "The user doesn't exist",
    });
  }

  // check if user changed their password after token was issued

  if (this_user.changedPasswordAfter(decoded.iat)) {
    res.status(400).json({
      status: "error",
      message: "User recently updated their password! Please login again",
    });
  }

  req.user = this_user;
  next();
};

exports.forgotPassword = async (req, res, next) => {
  // Get user's email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    res.status(400).json({
      status: "error",
      message: "There is no user with given email address",
    });
    return;
  }

  // Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  const resetURL = `https://tawk.com/auth/reset-password/?code=${resetToken}`;

  try {
    // send email with reset URL

    res.status(200).json({
      status: "success",
      message: "Reset Password link sent to Email",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(500).json({
      status: "error",
      message:
        "There was an error in sending the email, Please try again later.",
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  // Get user based on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // If token has expired or submission is out of time window

  if (!user) {
    res.status(400).json({
      status: "error",
      message: "Token is invalid or expired",
    });
    return;
  }

  // Update user password password and set expiryToken  and reset to undefined

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // Login the user and send new JWT

  // Send the email to user informing about password change

  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    message: "Password reseted successfully",
    token,
  });
};
