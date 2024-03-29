const express = require("express");
const router = express.Router();
const {
  createReview,
  getMultipleReviews,
  getReview,
  getReviewsByProductID,
  getReviewsByUserID,
  getReviews,
  updateReview,
  deleteReview,
} = require("../../controllers/reviews/reviews.controller");
const {
  checkAuth,
} = require("../../middlewares/authenticator/authenticator.middleware");

router.post("/reviews", createReview); // need auth - check if the user has bought the product
router.get("/reviews/batch", getMultipleReviews);
router.get("/reviews/:reviewID", getReview);
router.get("/reviews/product/:productID", getReviewsByProductID);
router.get("/reviews/users/:userID", checkAuth, getReviewsByUserID);
router.get("/reviews", getReviews);
router.put("/reviews/:reviewID", updateReview); // need auth - check if the user is the owner of the review
router.delete("/reviews/:reviewID", deleteReview); // need auth - check if the user is the owner of the review

module.exports = router;
