const argon2 = require('argon2');

const generateCartID = async () => {
  const nanoid = (await import('nanoid')).nanoid;
  const cartID = nanoid();

  return cartID;
};

const generateUserId = async () => {
  const nanoid = (await import('nanoid')).nanoid;
  const userId = nanoid();

  return userId;
};

const generateOrderID = async () => {
  const { customAlphabet } = await import('nanoid');

  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const generate = customAlphabet(alphabet, 12);
  const orderID = generate();

  return orderID;
};

const getFirstThreeChars = (ids) => {
  const result = ids.map(id => id.slice(0, 3)).join('');
  return result;
}

const hashPassword = async (password) => {
  let hashedPassword;
  const hashedPasswordString = (async () => {
    const hash = await argon2.hash(password, {
      memoryCost: 1 << 19,
      timeCost: 2,
      parallelism: 1,
      type: argon2.argon2id,
    });    
    return hash;
  })();

  const regex = /^\$argon2id\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+\/]+\$([A-Za-z0-9+\/]+)$/;
  const match = (await hashedPasswordString).toString().match(regex);

  if (match && match[1]) {
    hashedPassword = match[1];
  } else {
    hashedPassword = null;
  }

  return hashedPassword;
}


module.exports = { generateOrderID, generateCartID, getFirstThreeChars, hashPassword, generateUserId };