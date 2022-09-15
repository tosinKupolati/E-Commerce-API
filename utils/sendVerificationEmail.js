const sendEmail = require('./sendEmail');
const sendVerificationEmail = ({ email, token, name, origin }) => {
  const verificationLink = `${origin}/user/verify-email?email=${email}&token=${token}`;
  const message = `<p>A front-end is not connected to this, so please do not click on the dummy link to reset your password, instead copy the token and use it in the postman : <a href="${verificationLink}">dummy link</a> copy ${token}</p>`;
  sendEmail({
    to: email,
    subject: 'Email Verification',
    html: `<h4>Hello, ${name}<h4> ${message}`,
  });
};

module.exports = sendVerificationEmail;
