const _ = require("lodash");

const ReviewModel = require("../../models/reviews/reviews.model");
const UserModel = require("../../models/users/user.model");
const { getFirstThreeChars } = require("../../utils/helpers");
const { redisClient } = require("../../configs/redis-client");

const createReview = async (req, res) => {
  try {
    const reviewData = req.body;

    const review = new ReviewModel(reviewData);
    review.save();

    const { _id, productID, userID, rating, comment, createdAt } = review;

    res.status(200).json({
      _id,
      productID,
      userID,
      rating,
      comment,
      createdAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getReview = async (req, res) => {
  try {
    const reviewID = req.params.reviewID;
    const cacheKey = `review-${reviewID}`;
    let review;

    const redisData = await redisClient.get(cacheKey);

    // CACHE MISS
    if (_.isEmpty(redisData)) {
      // call to db
      review = await ReviewModel.findOne({ _id: reviewID });

      if (_.isEmpty(review)) {
        res.status(204).json({ message: "No review found..." });
      }

      if (!_.isEmpty(review)) {
        // if isDeleted is true, return 404
        if (review.isDeleted === true) {
          return res.status(404).json({ message: "No review found..." });
        }

        // get user info for review from database
        const user = await UserModel.findOne({ _id: review.userID });

        // add username and profileUrl to review
        const { _id, productID, userID, rating, comment, createdAt } = review;

        const modifiedReview = {
          _id,
          productID,
          userID,
          rating,
          comment,
          createdAt,
          username: user?.username ?? null,
          profileUrl: user?.profileUrl ?? null,
        };

        // set redis cache
        redisClient.setEx(cacheKey, 3600, JSON.stringify(modifiedReview));

        res.status(200).json(modifiedReview);
      }
    }

    // CACHE HIT
    if (!_.isEmpty(redisData)) {
      // set review to redisData
      review = JSON.parse(redisData);

      return res.status(200).json(review);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getReviewsByProductID = async (req, res) => {
  try {
    const productID = req.params.productID;
    const cacheKey = `reviews-${productID}`;
    let reviews;

    const redisData = await redisClient.get(cacheKey);

    // CACHE MISS
    if (_.isEmpty(redisData)) {
      // call to db
      reviews = await ReviewModel.find({ productID: productID });

      if (_.isEmpty(reviews)) {
        res.status(204).json({ message: "No reviews found..." });
      }

      if (!_.isEmpty(reviews)) {
        // filter out deleted reviews
        filteredReviews = reviews.filter((review) => review.isDeleted === false);
  
        if (_.isEmpty(filteredReviews)) {
          return res.status(204).json({ message: "No reviews found..." });
        }
  
        // get user info for each review from database
        const userIDs = filteredReviews.map((review) => review.userID);
  
        const users = await UserModel.find({ _id: { $in: userIDs } });
  
        // add username and profileUrls to each review
        let modifiedReviews = filteredReviews;

        modifiedReviews = modifiedReviews.map((review) => {
          const matchedUser = users.find((user) => user._id.toString() === review.userID.toString());

          const { _id, productID, userID, rating, comment, createdAt } = review;

          return {
            _id,
            productID,
            userID,
            rating,
            comment,
            createdAt,
            username: matchedUser?.username ?? null,
            profileUrl: matchedUser?.profileUrl ?? null,
          };
        });

        // filter out reviews with no username
        modifiedReviews = modifiedReviews.filter((review) => review.username !== null);

        // set redis cache
        redisClient.setEx(cacheKey, 3600, JSON.stringify(modifiedReviews));
  
        res.status(200).json(modifiedReviews);
      }
    }

    // CACHE HIT
    if (!_.isEmpty(redisData)) {
      // set reviews to redisData
      reviews = JSON.parse(redisData);

      return res.status(200).json(reviews);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getReviewsByUserID = async (req, res) => {
  try {
    const user = req.user;
    const userID = req.params.userID;
    const cacheKey = `reviews-${userID}`;
    let reviews;

    const redisData = await redisClient.get(cacheKey);

    // CACHE MISS
    if (_.isEmpty(redisData)) {
      // call to db
      reviews = await ReviewModel.find({ userID });

      if (_.isEmpty(reviews)) {
        res.status(204).json({ message: "No reviews found..." });
      }

      // reviews found but deleted
      let filteredReviews = reviews.filter((review) => review.isDeleted === false);
      const reviewsDeleted = !_.isEmpty(reviews) && _.isEmpty(filteredReviews);
      
      if (reviewsDeleted) {
        return res.status(204).json({ message: "No reviews found..." });
      } 

      // reviews found but no ownership
      filteredReviews = filteredReviews.filter((review) => review.userID.toString() === user._id.toString());
      const isNotOwner = !reviewsDeleted && _.isEmpty(filteredReviews);

      if (isNotOwner) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // reviews found and has ownership
      const isOwner = !isNotOwner;
      if (isOwner) {
        // get user info for each review from database
        const userIDs = filteredReviews.map((review) => review.userID);
  
        const users = await UserModel.find({ _id: { $in: userIDs } });
  
        // add username and profileUrls to each review
        let modifiedReviews = filteredReviews;

        modifiedReviews = modifiedReviews.map((review) => {
          const matchedUser = users.find((user) => user._id.toString() === review.userID.toString());

          const { _id, productID, userID, rating, comment, createdAt } = review;

          return {
            _id,
            productID,
            userID,
            rating,
            comment,
            createdAt,
            username: matchedUser?.username ?? null,
            profileUrl: matchedUser?.profileUrl ?? null,
          };
        });

        // filter out reviews with no username
        modifiedReviews = modifiedReviews.filter((review) => review.username !== null);

        // set redis cache
        redisClient.setEx(cacheKey, 3600, JSON.stringify(modifiedReviews));
  
        res.status(200).json(modifiedReviews);
      }
    }

    // CACHE HIT
    if (!_.isEmpty(redisData)) {
      // set reviews to redisData
      reviews = JSON.parse(redisData);

      return res.status(200).json(reviews);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getMultipleReviews = async (req, res) => {
  try {
    const { ids } = req.query;
    const reviewIDs = ids.split(",");
    const cacheKey = `reviews-${getFirstThreeChars(reviewIDs)}`;
    let reviews;

    const redisData = await redisClient.get(cacheKey);

    // CACHE MISS
    if (_.isEmpty(redisData)) {
      // call to db
      reviews = await ReviewModel.find({ _id: { $in: reviewIDs } });

      if (_.isEmpty(reviews)) {
        res.status(204).json({ message: "No reviews found..." });
      }

      if (!_.isEmpty(reviews)) {
        // filter out deleted reviews
        filteredReviews = reviews.filter((review) => review.isDeleted === false);
  
        if (_.isEmpty(filteredReviews)) {
          return res.status(204).json({ message: "No reviews found..." });
        }
  
        // get user info for each review from database
        const userIDs = filteredReviews.map((review) => review.userID);
  
        const users = await UserModel.find({ _id: { $in: userIDs } });
  
        // add username and profileUrls to each review
        let modifiedReviews = filteredReviews;

        modifiedReviews = modifiedReviews.map((review) => {
          const matchedUser = users.find((user) => user._id.toString() === review.userID.toString());

          const { _id, productID, userID, rating, comment, createdAt } = review;

          return {
            _id,
            productID,
            userID,
            rating,
            comment,
            createdAt,
            username: matchedUser?.username ?? null,
            profileUrl: matchedUser?.profileUrl ?? null,
          };
        });

        // set redis cache
        redisClient.setEx(cacheKey, 3600, JSON.stringify(modifiedReviews));
  
        res.status(200).json(modifiedReviews);
      }
    }

    // CACHE HIT
    if (!_.isEmpty(redisData)) {
      // set reviews to redisData
      reviews = JSON.parse(redisData);

      return res.status(200).json(reviews);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getReviews = async (req, res) => {
  try {
    const cacheKey = "reviews";
    let reviews;

    const redisData = await redisClient.get(cacheKey);

    // CACHE MISS
    if (_.isEmpty(redisData)) {
      // call to db
      reviews = await ReviewModel.find();

      if (_.isEmpty(reviews)) {
        res.status(204).json({ message: "No reviews found..." });
      }

      if (!_.isEmpty(reviews)) {
        // filter out deleted reviews
        filteredReviews = reviews.filter((review) => review.isDeleted === false);
  
        if (_.isEmpty(filteredReviews)) {
          return res.status(204).json({ message: "No reviews found..." });
        }
  
        // get user info for each review from database
        const userIDs = filteredReviews.map((review) => review.userID);
  
        const users = await UserModel.find({ _id: { $in: userIDs } });
  
        // add username and profileUrls to each review
        let modifiedReviews = filteredReviews;

        modifiedReviews = modifiedReviews.map((review) => {
          const matchedUser = users.find((user) => user._id.toString() === review.userID.toString());

          const { _id, productID, userID, rating, comment, createdAt } = review;

          return {
            _id,
            productID,
            userID,
            rating,
            comment,
            createdAt,
            username: matchedUser?.username ?? null,
            profileUrl: matchedUser?.profileUrl ?? null,
          };
        });

        // set redis cache
        redisClient.setEx(cacheKey, 3600, JSON.stringify(modifiedReviews));
  
        res.status(200).json(modifiedReviews);
      }
    }

    // CACHE HIT
    if (!_.isEmpty(redisData)) {
      // set reviews to redisData
      reviews = JSON.parse(redisData);

      return res.status(200).json(reviews);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateReview = async (req, res) => {
  const reviewID = req.params.reviewID;
  const review = req.body;

  try {
    // find review by id
    const foundReview = await ReviewModel.findOne({ _id: reviewID });

    if (_.isEmpty(foundReview)) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (!_.isEmpty(foundReview)) {
      // if isDeleted is true, return 404
      if (foundReview.isDeleted === true) {
        return res.status(404).json({ message: "Review not found" });
      }

      // update review
      try {
        const result = await ReviewModel.updateOne(
          { _id: reviewID },
          { $set: review }
        );
        if (result.modifiedCount === 1) {
          res.status(200).json({ message: "Review updated successfully" });
        } else {
          console.error(result);
          res
            .status(404)
            .json({ message: "Review not found or no changes made" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating review" });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating review" });
  }
};

const deleteReview = async (req, res) => {
  const reviewID = req.params.reviewID;

  try {
    const result = await ReviewModel.updateOne(
      { _id: reviewID },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Review deleted successfully" });
    } else {
      console.error(result);
      res.status(404).json({ message: "Review not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting review" });
  }
};

module.exports = {
  createReview,
  getMultipleReviews,
  getReview,
  getReviewsByProductID,
  getReviewsByUserID,
  getReviews,
  updateReview,
  deleteReview,
};
