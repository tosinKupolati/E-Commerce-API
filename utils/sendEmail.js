const nodemailer = require('nodemailer');
const nodemailerConfig = require('./nodemailerConfig');
const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport(nodemailerConfig);

  let info = await transporter.sendMail({
    from: `"Tosin Kupolati" <sunkanmikupolati@gmail.com>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
