const { createJWT, isTokenValid, attachCookiesToResponse } = require('./jwt');

const createTokenUser = require('./createTokenUser');
const checkPermissions = require('./checkPermissions');
const sendEmail = require('./sendEmail');
const sendVerificationEmail = require('./sendVerificationEmail');
const sendPasswordResetEmail = require('./sendPasswordResetEmail');
const createHash = require('./createHash');
module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
  createTokenUser,
  checkPermissions,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  createHash,
};
