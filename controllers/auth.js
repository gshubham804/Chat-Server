const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const crypto = require("crypto");
const User = require("../models/user");
const filterObj = require("../utils/filterObj");
const { promisify } = require("util");
const sendTransactionalEmail = require("../services/mailer");
const AppError = require("../utils/appError");
const otpTemplate = require("../Templates/Mail/otp");
const resetPasswordTemplate = require("../Templates/Mail/resetPassword");
const catchAsync = require("../utils/catchAsync");
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });

const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);
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
    return res.status(400).json({
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

// Send OTP

exports.sendOTP = async (req, res, next) => {
  const { userId } = req;
  const new_otp = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });

  console.log(new_otp, "otp");
  // OTP expiry time calculation

  const otp_expiry_time = Date.now() + 10 * 60 * 1000; //10 min after otp is sent

  const user = await User.findByIdAndUpdate(userId, {
    otp_expiry_time: otp_expiry_time,
  });

  user.otp = new_otp.toString();

  await user.save({ new: true, validateModifiedOnly: true });

  // TODO >> Send mail

  await sendTransactionalEmail(user.firstName, new_otp, user.email, otpTemplate)
    .then((status) => {
      console.log(`Email sent successfully! Status: ${status}`);
      res.status(200).json({
        status: "success",
        message: "OTP sent successfully!",
      });
    })
    .catch((status) => {
      console.error(`Failed to send email. Status: ${status}`);
      res.status(500).json({
        status: "failed",
        message: "Failed to send OTP email.",
      });
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
    return res.status(400).json({
      status: "error",
      message: "Email is invalid or OTP expired",
    });
  }

  if (user.verified) {
    return res.status(400).json({
      status: "error",
      message: "Email is already verified",
    });
  }

  if (!(await user.correctOTP(otp, user.otp))) {
    res.status(400).json({
      status: "error",
      message: "OTP is incorrect",
    });
    return;
  }

  // OTP is correct

  user.verified = true;
  user.otp = undefined;

  await user.save({ new: true, validateModifiedOnly: true });
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    message: "OTP verified successfully!",
    token: token,
    user_id: user._id,
  });
};

// User Login

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      status: "error",
      message: "Both email and password are required",
    });
    return;
  }

  const userDoc = await User.findOne({ email: email }).select("+password");

  if (!userDoc || !userDoc.password) {
    res.status(400).json({
      status: "error",
      message: "Incorrect password",
    });
    return;
  }

  if (
    !userDoc ||
    !(await userDoc.correctPassword(password, userDoc.password))
  ) {
    res.status(400).json({
      status: "error",
      message: "Email or password is incorrect",
    });
    return;
  }

  const token = signToken(userDoc._id);
  res.status(200).json({
    status: "success",
    message: "Logged in successfully",
    token,
    user_id: userDoc._id,
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
  }

  if (!token) {
    return res.status(401).json({
      message: "You are not logged in! Please log in to get access.",
    });
  }

  // verification of token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // Check  if user still exist

  const this_user = await User.findById(decoded.userId);
  if (!this_user) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exists.",
        401
      )
    );
  }

  // check if user changed their password after token was issued

  if (this_user.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  req.user = this_user;
  next();
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user's email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with the email address.", 404));
  }

  // Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  console.log(resetToken, "resetToken");
  await user.save({ validateBeforeSave: false });

  try {
    // send email with reset URL
    const resetURL = `${process.env.BASE_URL}/auth/new-password?token=${resetToken}`;

    await sendTransactionalEmail(
      user.firstName,
      resetURL,
      user.email,
      resetPasswordTemplate
    );

    console.log("Email sent successfully!");
    res.status(200).json({
      status: "success",
      message: "Reset Password link sent to Email",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    console.error("Failed to send email. Error:", error);
    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

exports.resetPassword = async (req, res, next) => {
  // Get user based on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.body.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // If token has expired or submission is out of time window

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  // Update user password password and set expiryToken  and reset to undefined

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // Login the user and send new JWT

  res.status(200).json({
    status: "success",
  });
};
