const _ = require("lodash");
const mongoose = require("mongoose");

const SlideshowModel = require("../../models/slideshows/slideshow.model");
const { getFirstThreeChars } = require("../../utils/helpers");
const { redisClient } = require("../../configs/redis-client");

const createSlideshow = async (req, res) => {
  try {
    const slideshowData = req.body;
    const slideshow = new SlideshowModel(slideshowData);

    // add fields for soft delete
    slideshow.isDeleted = false;
    slideshow.deletedAt = null;

    await slideshow.validate();
    await slideshow.save();

    res
      .status(200)
      .json({
        slideshow: slideshowData,
        message: "Successfully created a slideshow",
      });
  } catch (error) {
    console.error(error);

    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

const getSlideshow = async (req, res) => {
  try {
    const slideshowID = req.params.slideshowID;
    const cacheKey = `${slideshowID}`;
    let slideshow;

    const redisData = await redisClient.get(cacheKey);

    // CACHE MISS
    if (_.isEmpty(redisData)) {
      // call to db
      slideshow = await SlideshowModel.find({ _id: slideshowID });

      // set redis cache
      if (!_.isEmpty(slideshow)) {
        redisClient.setEx(cacheKey, 3600, JSON.stringify(slideshow));
      }
    }

    // CACHE HIT
    if (!_.isEmpty(redisData)) {
      // set slideshow to redisData
      slideshow = JSON.parse(redisData);
    }

    if (_.isEmpty(slideshow)) {
      res.status(204).json({ message: "No slideshow found..." });
    }

    if (!_.isEmpty(slideshow)) {
      // filter out deleted slideshows
      const filteredSlideshow = slideshow.filter(
        (slideshow) => slideshow.isDeleted === false
      );

      if (_.isEmpty(filteredSlideshow)) {
        return res.status(204).json({ message: "No slideshow found..." });
      }

      res.status(200).json(filteredSlideshow[0]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getMultipleSlideshows = async (req, res) => {
  try {
    const { ids } = req.query;
    const slideshowIDs = ids.split(",");
    const cacheKey = `slideshows-${getFirstThreeChars(slideshowIDs)}`;
    let slideshows;

    const redisData = await redisClient.get(cacheKey);

    // CACHE MISS
    if (_.isEmpty(redisData)) {
      // call to db
      slideshows = await SlideshowModel.find({ _id: { $in: slideshowIDs } });

      // set redis cache
      if (!_.isEmpty(slideshows)) {
        redisClient.setEx(cacheKey, 3600, JSON.stringify(slideshows));
      }
    }

    // CACHE HIT
    if (!_.isEmpty(redisData)) {
      // set slideshows to redisData
      slideshows = JSON.parse(redisData);
    }

    if (_.isEmpty(slideshows)) {
      res.status(204).json({ message: "No slideshows found..." });
    }

    if (!_.isEmpty(slideshows)) {
      // filter out deleted slideshows
      const filteredSlideshows = slideshows.filter(
        (slideshow) => slideshow.isDeleted === false
      );

      if (_.isEmpty(filteredSlideshows)) {
        return res.status(204).json({ message: "No slideshows found..." });
      }

      res.status(200).json(filteredSlideshows);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getSlideshows = async (req, res) => {
  try {
    const cacheKey = "slideshows";
    let slideshows;

    const redisData = await redisClient.get(cacheKey);

    // CACHE MISS
    if (_.isEmpty(redisData)) {
      // call to db
      slideshows = await SlideshowModel.find();

      // set redis cache
      if (!_.isEmpty(slideshows)) {
        redisClient.setEx(cacheKey, 3600, JSON.stringify(slideshows));
      }
    }

    // CACHE HIT
    if (!_.isEmpty(redisData)) {
      // set slideshow to redisData
      slideshows = JSON.parse(redisData);
    }

    if (_.isEmpty(slideshows)) {
      res.status(204).json({ message: "No slideshows found..." });
    }

    if (!_.isEmpty(slideshows)) {
      // filter out deleted slideshows
      const filteredSlideshows = slideshows.filter(
        (slideshow) => slideshow.isDeleted === false
      );

      if (_.isEmpty(filteredSlideshows)) {
        return res.status(204).json({ message: "No slideshows found..." });
      }

      res.status(200).json(filteredSlideshows);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateSlideshow = async (req, res) => {
  const slideshowID = req.params.slideshowID;
  const slideshow = req.body;

  try {
    // find in db
    const foundSlideshow = await SlideshowModel.findOne({ _id: slideshowID });

    // if not found
    if (_.isEmpty(foundSlideshow)) {
      return res.status(404).json({ message: "Document not found" });
    }

    // if deleted
    if (foundSlideshow.isDeleted === true) {
      return res.status(404).json({ message: "Document not found" });
    }

    // update slideshow
    const result = await SlideshowModel.updateOne(
      { _id: slideshowID },
      { $set: slideshow }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Document updated successfully" });
    } else {
      console.error(result);
      res
        .status(404)
        .json({ message: "Document not found or no changes made" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating document" });
  }
};

const deleteSlideshow = async (req, res) => {
  const slideshowID = req.params.slideshowID;

  try {
    const result = await SlideshowModel.updateOne(
      { _id: slideshowID },
      { $set: { isDeleted: true, deletedAt: Date.now() } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Document deleted successfully" });
    } else {
      console.error(result);
      res.status(404).json({ message: "Document not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting document" });
  }
};

module.exports = {
  createSlideshow,
  getSlideshow,
  getMultipleSlideshows,
  getSlideshows,
  updateSlideshow,
  deleteSlideshow,
};
