import nodemailer from "nodemailer";
export const sendEmail=async(options)=>{
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "88c39b427b5179",
      pass: "787bd6ee56bc62"
    }
  });

const mailOptions={
    from:'',
    to:options.email,
    subject:options.subject,
    text:options.message
     }
     
     await transporter.sendMail(mailOptions);

}