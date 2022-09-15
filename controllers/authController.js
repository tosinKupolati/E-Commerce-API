const crypto = require('crypto');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const {
  attachCookiesToResponse,
  createTokenUser,
  sendVerificationEmail,
  sendPasswordResetEmail,
  createHash,
} = require('../utils');
const Token = require('../models/Token');

const register = async (req, res) => {
  const { email, name, password } = req.body;
  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError('Email already exists');
  }
  //first registered user is an admin
  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? 'admin' : 'user';

  //creating verificationToken
  const verificationToken = crypto.randomBytes(40).toString('hex');

  const user = await User.create({
    email,
    name,
    password,
    role,
    verificationToken,
  });
  sendVerificationEmail({
    email: user.email,
    token: user.verificationToken,
    name: user.name,
    origin: `http://localhost:5000`,
  });
  res.status(StatusCodes.CREATED).json({
    msg: 'Success! Please check your email to verify your account',
  });
};

const verifyEmail = async (req, res) => {
  const { email, verificationToken } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError.UnauthenticatedError('Verification failed');
  }
  if (user.isVerified) {
    throw new CustomError.BadRequestError('User is already verified');
  }
  if (user.verificationToken !== verificationToken) {
    throw new CustomError.UnauthenticatedError('Verification failed');
  }
  (user.isVerified = true), (user.verified = Date.now());
  (user.verificationToken = ''), await user.save();
  res.status(StatusCodes.OK).json({ msg: 'email successfully verified' });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new CustomError.BadRequestError('Please provide email and password');
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError.UnauthenticatedError('Invalid Credentials');
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError('Invalid Credentials');
  }
  if (!user.isVerified) {
    throw new CustomError.UnauthenticatedError('Please verify your email');
  }
  const tokenUser = createTokenUser(user);

  //create refresh token
  let refreshToken = '';

  //check if the user has a token document already
  const existingToken = await Token.findOne({ user: user._id });

  if (existingToken) {
    if (!existingToken.isValid) {
      throw new CustomError.UnauthenticatedError('Invalid Credentials');
    }
    refreshToken = existingToken.refreshToken;
    attachCookiesToResponse({ res, user: tokenUser, refreshToken });
    res.status(StatusCodes.OK).json({ user: tokenUser });
    return;
  }

  refreshToken = crypto.randomBytes(40).toString('hex');
  const ip = req.ip;
  const userAgent = req.headers['user-agent'];
  await Token.create({
    refreshToken,
    ip,
    userAgent,
    user: user._id,
  });
  attachCookiesToResponse({ res, user: tokenUser, refreshToken });
  res.status(StatusCodes.OK).json({ user: tokenUser });
};

const logout = async (req, res) => {
  await Token.findOneAndDelete({ user: req.user.userId });
  res.cookie('accessToken', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie('refreshToken', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({ msg: 'user logged out!' });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new CustomError.BadRequestError('Please provide valid email');
  }
  const user = await User.findOne({ email });
  if (user) {
    const passwordToken = crypto.randomBytes(70).toString('hex');
    //sendEmailContainingPasswordToken
    sendPasswordResetEmail({
      email: user.email,
      token: passwordToken,
      origin: 'http://localhost:5000',
      name: user.name,
    });
    const tenMinutes = 10 * 60 * 1000;
    const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);
    user.passwordToken = createHash(passwordToken);
    user.passwordTokenExpirationDate = passwordTokenExpirationDate;
    await user.save();
  }
  res
    .status(StatusCodes.OK)
    .json({ msg: 'Please check your email for link to reset password' });
};

const resetPassword = async (req, res) => {
  const { email, passwordToken, password } = req.body;
  if (!email || !passwordToken || !password) {
    throw new CustomError.BadRequestError('Please provide all values');
  }
  const user = await User.findOne({ email });
  if (user) {
    const currentDate = new Date();
    if (
      user.passwordTokenExpirationDate > currentDate &&
      user.passwordToken === createHash(passwordToken)
    ) {
      user.passwordToken = '';
      user.passwordTokenExpirationDate = new Date(0);
      user.password = password;
      await user.save();
    } else {
      throw new CustomError.UnauthenticatedError('Invalid Credentials');
    }
  }
  res.status(StatusCodes.OK).json({ msg: 'Password reset successful!' });
};

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
};
