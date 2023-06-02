const generateCartID = async () => {
  const nanoid = (await import('nanoid')).nanoid;
  const cartID = nanoid();

  return cartID;
};

const generateOrderID = async () => {
  const { customAlphabet } = await import('nanoid');

  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const generate = customAlphabet(alphabet, 12);
  const orderID = generate();

  return orderID;
};

module.exports = { generateOrderID, generateCartID };