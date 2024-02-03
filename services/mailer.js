const brevo = require('@getbrevo/brevo');
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });

function sendTransactionalEmail(username, sendingVariableValue, senderEmail, emailTemplate) {

  return new Promise((resolve, reject) => {
    let apiInstance = new brevo.TransactionalEmailsApi();
    let apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_KEY;

    let sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.subject ="Your verification code for Chat-Server" ;
    sendSmtpEmail.htmlContent = emailTemplate(username,sendingVariableValue);
    sendSmtpEmail.sender = { "name": "Chat-Server", "email": "techbtechblog@gmail.com" };
    sendSmtpEmail.to = [
      { "email": senderEmail, "name": username }
    ];
    sendSmtpEmail.replyTo = { "email": "techbtechblog@gmail.com", "name": "Chat-Server" };
    sendSmtpEmail.headers = { "Chat-Server": "unique-id-1234" };
    sendSmtpEmail.params = { "parameter": "My param value", "subject": "common subject" };

    apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data) {
      console.log('API called successfully. Returned data: ' + JSON.stringify(data));
      resolve('success');
    }, function (error) {
      console.error(error);
      reject('failed');
    });
  });
}

// Export the function
module.exports = sendTransactionalEmail;
