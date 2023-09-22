const express = require("express");
const router = express.Router();
const {
  createWishlist,
  getMultipleWishlists,
  getWishlistsByUserID,
  getWishlist,
  getWishlists,
  updateWishlist,
  deleteWishlist,
} = require("../../controllers/wishlists/wishlists.controller");
const {
  checkAuth,
  isAdmin,
} = require("../../middlewares/authenticator/authenticator.middleware");

router.post("/wishlists", checkAuth, createWishlist);
router.get("/wishlists", checkAuth, isAdmin, getWishlists);
router.get("/wishlists/:wishlistID", checkAuth, getWishlist);
router.get("/wishlists/batch", checkAuth, getMultipleWishlists);
router.get("/wishlists/users/:userID", checkAuth, getWishlistsByUserID);
router.put("/wishlists/:wishlistID", checkAuth, updateWishlist);
router.delete("/wishlists/:wishlistID", checkAuth, deleteWishlist);

module.exports = router;
