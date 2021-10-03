const nodemailer = require("nodemailer");
const smtpPool = require("nodemailer-smtp-pool");

const randomOtp = require("./randomOtp");
require("dotenv").config();

const transporter = nodemailer.createTransport(smtpPool({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS
    },
    maxConnections: 5,
    maxMessages: 10
  }));

const passwordResetMail = (email) => {
    return new Promise((resolve, reject) => {
        const otp = randomOtp();

        const mailOptions = {
            from: "nihaln0077@gmail.com",
            to: email,
            subject: "Sending Email using Node.js",
            text: "That was easy! " + otp,
        };

        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                reject(err);
            } else {
                resolve(otp);
            }
        });
    });
};

module.exports = passwordResetMail;
