// create a class for sending again and again res.status(400).json({
// status:"",message:"",
// })

const jwt = require("jwtwebtoken");
const otpGenerator = require("otp-generator");
const User = require("../models/user");
const filterObj = require("../utils/filterObj");

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

  res.status(200).json({
    status: "success",
    message: "OTP sent successfully!",
  });
};

exports.verifyOTP = async(req,res,next) =>{
  // verify OTP and then update user record

  const {email,otp} = req.body;

  const user = await User.findOne({
    email,
    otp_expiry_time:{$gt:Date.now()},
  });

  if(!user){
    res.status(400).json({
      status:"error",
      message:"Email is invalid or OTP expired",
    })
  }

  if(! await user.correctOTP(otp,user.otp)){
    res.status(400).json({
      status:"error",
      message:"OTP is incorrect",
    })
  }

  // OTP is correct

  user.verified=true;
  user.otp = undefined;

  await user.save({new:true, validateModifiedOnly:true});
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    message: "OTP verified successfully!",
    token,
  });
}

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

exports.forgotPassword = async(req,res,next) =>{

}

exports.resetPassword = async(req,res,next)=>{
  
}
