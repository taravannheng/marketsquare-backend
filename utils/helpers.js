const argon2 = require("argon2");

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

module.exports = {
  generateOrderID,
  generateCartID,
  getFirstThreeChars,
  hashPassword,
  generateUserId,
  verifyPassword,
};
