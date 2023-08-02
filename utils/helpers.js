const argon2 = require("argon2");

const sgMail = require('../configs/sendgrid.config');

const generateCartID = async () => {
  const nanoid = (await import("nanoid")).nanoid;
  const cartID = nanoid();

  return cartID;
};

const generateUserId = async () => {
  const nanoid = (await import("nanoid")).nanoid;
  const userId = nanoid();

  return userId;
};

const generateOrderID = async () => {
  const { customAlphabet } = await import("nanoid");

  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const generate = customAlphabet(alphabet, 12);
  const orderID = generate();

  return orderID;
};

const getFirstThreeChars = (ids) => {
  const result = ids.map((id) => id.slice(0, 3)).join("");
  return result;
};

// write a function called hashPassword which uses argon2 to hash a password
const hashPassword = async (password) => {
  // let hashedPassword;
  const hashedPassword = (async () => {
    const hash = await argon2.hash(password);
    return hash;
  })();

  return hashedPassword;
};

// write a function called verifyPassword which uses argon2 to verify a password
const verifyPassword = async (hashedPassword, plainPassword) => {
  try {
    const isPasswordValid = await argon2.verify(hashedPassword, plainPassword);

    return isPasswordValid;
  } catch (err) {
    // internal failure
    return false;
  }
};

// use nanoid to generate a random string which include 4 numbers
const generateResetPasswordCode = async () => {
  const { customAlphabet } = await import("nanoid");

  const alphabet = "0123456789";
  const generate = customAlphabet(alphabet, 4);
  const resetPasswordCode = generate();

  return resetPasswordCode;
};

const sendResetPasswordCode = async (to, code) => {
  const msg = {
    to,
    from: `${process.env.NOREPLY_EMAIL}`,
    templateId: `${process.env.SENDGRID_TEMPLATE_ID}`,
    dynamicTemplateData: {
      code,
      link: `${process.env.ACCESS_CONTROL_ALLOW_ORIGIN}/reset-password/verify?email=${to}`,
    },
  };

  return sgMail
    .send(msg)
    .then(() => {
      return 'Email sent successfully';
    })
    .catch((error) => {
      return error;
    });
}


module.exports = {
  generateOrderID,
  generateCartID,
  getFirstThreeChars,
  hashPassword,
  generateUserId,
  verifyPassword,
  generateResetPasswordCode,
  sendResetPasswordCode,
};
