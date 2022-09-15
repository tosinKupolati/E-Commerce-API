const sendEmail = require('./sendEmail');

const sendPasswordResetEmail = ({ email, token, origin, name }) => {
  const passwordResetLink = `${origin}/user/password-reset?email=${email}&token=${token}`;
  const message = `<p>A front-end is not connected to this, so please do not click on the dummy link to reset your password, instead copy the token and use it in the postman : <a href="${passwordResetLink}">dummy link</a> copy ${token}</p>`;
  sendEmail({
    to: email,
    subject: 'Password Reset',
    html: `<h4>Hello, ${name}</h4> ${message}`,
  });
};

module.exports = sendPasswordResetEmail;
