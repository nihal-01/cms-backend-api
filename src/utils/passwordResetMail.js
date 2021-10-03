const sgMail = require("@sendgrid/mail");

const randomOtp = require("./randomOtp");
require("dotenv").config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const passwordResetMail = (email) => {
    return new Promise((resolve, reject) => {
        const otp = randomOtp();
        const msg = {
            to: email, // Change to your recipient
            from: "nihaln0066@gmail.com", // Change to your verified sender
            subject: "Seen Web",
            text: "Your Seen web password reset otp.",
            html: `<p>You 6 digit OTP is <b>${otp}</b>. Do not share with anyone.</p>`,
        };

        sgMail
            .send(msg)
            .then(() => {
                resolve(otp);
            })
            .catch((error) => {
                reject(error);
            });
    });
};

module.exports = passwordResetMail;
