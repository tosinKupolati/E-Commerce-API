const CustomError = require('../errors');
const { isTokenValid, attachCookiesToResponse } = require('../utils');
const Token = require('../models/Token');

const authenticateUser = async (req, res, next) => {
  const { accessToken, refreshToken } = req.signedCookies;
  try {
    if (accessToken) {
      const { user } = isTokenValid(accessToken);
      req.user = user;
      return next();
    }

    const payload = isTokenValid(refreshToken);
    //check for the token document isValid property
    const existingToken = await Token.findOne({
      user: payload.userId,
      refreshToken: payload.refreshToken,
    });
    if (!existingToken?.isValid) {
      throw new CustomError.UnauthenticatedError('Authentication invalid');
    }
    attachCookiesToResponse({
      res,
      user,
      refreshToken: existingToken.refreshToken,
    });
    req.user = payload.user;
    next();
  } catch (error) {
    throw new CustomError.UnauthenticatedError('Authentication Invalid');
  }
};

const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new CustomError.UnauthorizedError(
        'Unauthorized to access this route'
      );
    }
    next();
  };
};

module.exports = { authenticateUser, authorizePermissions };
