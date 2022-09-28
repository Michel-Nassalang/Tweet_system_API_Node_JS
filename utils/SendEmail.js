const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text) => {
    var transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: 'email-identifiant',
            pass: 'password-identifiant'
        }
    });

    var mailOptions = {
        from: 'email-identifiant',
        to: email,
        subject: subject,
        text: text
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

module.exports = sendEmail;