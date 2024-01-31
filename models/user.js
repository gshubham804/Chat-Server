const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First Name is required"],
  },
  lastName: {
    type: String,
    required: [true, "Last Name is required"],
  },
  avatar: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    validate: {
      validator: function (email) {
        return String(email)
          .toLowerCase()
          .match(
            /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
          );
      },
      message: (props) => `Email ${props.value} is invalid!`,
    },
  },
  password: {
    type: String,
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: Number,
  },
  otp_expiry_time: {
    type: Date,
  },
});

// Hooks >> PreHooks >> PostHooks

userSchema.pre("save",async function (next){
  // only run this function if otp is updated or modified
  if(!this.isModified("otp")) return next();

  // encrypt otp >> hash the otp with the cost of 12 [8,16]
this.otp = await bcrypt.hash(this.otp,12)
next();
})

userSchema.methods.correctPassword = async function (
  candidatePassword, // 1234
  userPassword // first decrypt the password then compare with entered password
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.correctOTP = async function (
  candidateOTP, // 1234
  userOTP // first decrypt the otp then compare with entered otp
) {
  return await bcrypt.compare(candidateOTP, userOTP);
};

const User = new mongoose.model("User", userSchema);
module.exports = User;
