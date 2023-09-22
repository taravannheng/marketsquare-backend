const _ = require("lodash");

const WishlistModel = require("../../models/wishlists/wishlists.model");
const UserModel = require("../../models/users/user.model");
const { getFirstThreeChars } = require("../../utils/helpers");
const { redisClient } = require("../../configs/redis-client");

const createWishlist = async (req, res) => {
  try {
    const { productID } = req.body;
    const userID = req.user._id;

    // check if the docuemnt already exists in db using productID and userID
    const matchedWishlist = await WishlistModel.findOne({ productID, userID });

    if (matchedWishlist) {
      // update the isInWishlist to true
      const result = await WishlistModel.updateOne(
        { productID, userID },
        {
          isInWishlist: true,
        }
      );

      matchedWishlist.isInWishlist = true;

      return res.status(200).json({ wishlist: matchedWishlist });
    }

    // if wishlist is not existed, create new document
    if (!matchedWishlist) {
      const wishlistData = {
        productID,
        userID: req.user._id,
      };

      const wishlist = new WishlistModel(wishlistData);
      wishlist.save();

      // delete deletedAt field
      delete wishlist.deletedAt;

      res.status(201).json({ wishlist });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getWishlist = async (req, res) => {
  try {
    const wishlistID = req.params.wishlistID;
    const user = req.user;
    let wishlist;

    // call to db
    wishlist = await WishlistModel.findOne({ _id: wishlistID });

    // wishlist does not exists
    if (_.isEmpty(wishlist)) {
      return res.status(204).json({ message: "No wishlist found..." });
    }

    // wishlist exists but has been deleted
    const wishlistDeleted = !_.isEmpty(wishlist) && wishlist.deletedAt !== null;
    if (wishlistDeleted) {
      // filter deleted wishlist, return 404
      return res.status(404).json({ message: "No wishlist found..." });
    }

    // wishlist exists but user does not owns the wishlist
    const isNotOwner =
      !wishlistDeleted && wishlist.userID.toString() !== user._id.toString();
    if (isNotOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // wishlist exists and user owns the wishlist
    // -- delete deletedAt field
    delete wishlist.deletedAt;

    res.status(200).json(wishlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getMultipleWishlists = async (req, res) => {
  try {
    const { ids } = req.query;
    const user = req.user;
    const wishlistIDs = ids.split(",");
    let wishlists;

    // call to db
    wishlists = await WishlistModel.find({ _id: { $in: wishlistIDs } });

    // wishlists do not exist
    if (_.isEmpty(wishlists)) {
      res.status(204).json({ message: "No wishlists found..." });
    }

    // wishlists exist but has been deleted
    // -- filter out deleted wishlists
    let filteredWishlists = wishlists.filter(
      (wishlist) => wishlist.deletedAt !== null
    );
    const wishlistsDeleted =
      !_.isEmpty(wishlists) && _.isEmpty(filteredWishlists);
    if (wishlistsDeleted) {
      return res.status(204).json({ message: "No wishlists found..." });
    }

    // wishlists exists but no ownership
    filteredWishlists = filteredWishlists.filter(
      (wishlist) => wishlist.userID.toString() === user._id.toString()
    );
    const isNotOwner = !wishlistsDeleted && _.isEmpty(filteredWishlists);
    if (isNotOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // wishlists exists and has ownership
    // -- delete deletedAt field
    const modifiedWishlists = filteredWishlists.map((wishlist) => {
      delete wishlist.deletedAt;
      return wishlist;
    });

    res.status(200).json(modifiedWishlists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getWishlistsByUserID = async (req, res) => {
  const userID = req.params.userID;
  const user = req.user;

  try {
    let wishlists;

    // call to db
    wishlists = await WishlistModel.find({ userID });

    // no wishlists found
    if (_.isEmpty(wishlists)) {
      return res.status(204).json({ message: "No wishlists found..." });
    }

    // wishlists found but deleted
    // -- filter out deleted wishlists
    let filteredWishlists = wishlists.filter(
      (wishlist) => wishlist.deletedAt === null
    );
    const wishlistsDeleted =
      !_.isEmpty(wishlists) && _.isEmpty(filteredWishlists);
    if (wishlistsDeleted) {
      console.log("204 - deleted");
      return res.status(204).json({ message: "No wishlists found..." });
    }

    // wishlists found but no ownership
    filteredWishlists = filteredWishlists.filter(
      (wishlist) => wishlist.userID.toString() === user._id.toString()
    );
    const isNotOwner = !wishlistsDeleted && _.isEmpty(filteredWishlists);
    if (isNotOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // wishlists found and has ownership
    // -- delete deletedAt field
    const modifiedWishlists = filteredWishlists.map((wishlist) => {
      delete wishlist.deletedAt;
      return wishlist;
    });

    return res.status(200).json(modifiedWishlists);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getWishlists = async (req, res) => {
  try {
    const user = req.user;
    let wishlists;

    // call to db
    wishlists = await WishlistModel.find();

    // no wishlists found
    if (_.isEmpty(wishlists)) {
      res.status(204).json({ message: "No wishlists found..." });
    }

    // wishlists found but deleted
    // -- filter out deleted wishlists
    filteredWishlists = wishlists.filter(
      (wishlist) => wishlist.deletedAt !== null
    );
    const wishlistsDeleted =
      !_.isEmpty(wishlists) && _.isEmpty(filteredWishlists);

    if (wishlistsDeleted) {
      return res.status(204).json({ message: "No wishlists found..." });
    }

    // wishlists found but no ownership
    filteredWishlists = filteredWishlists.filter(
      (wishlist) => wishlist.userID.toString() === user._id.toString()
    );
    const isNotOwner = !wishlistsDeleted && _.isEmpty(filteredWishlists);
    if (isNotOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // wishlists found and has ownership
    // -- delete deletedAt field
    const modifiedWishlists = filteredWishlists.map((wishlist) => {
      delete wishlist.deletedAt;
      return wishlist;
    });

    res.status(200).json(modifiedWishlists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateWishlist = async (req, res) => {
  const wishlistID = req.params.wishlistID;
  const wishlist = req.body;
  const user = req.user;

  try {
    // find wishlist by id
    const foundWishlist = await WishlistModel.findOne({ _id: wishlistID });

    if (_.isEmpty(foundWishlist)) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    // wishlist found but deleted
    const wishlistDeleted =
      !_.isEmpty(foundWishlist) && foundWishlist.deletedAt !== null;
    if (wishlistDeleted) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    // wishlist found but no ownership
    const isNotOwner =
      !wishlistDeleted &&
      foundWishlist.userID.toString() !== user._id.toString();
    if (isNotOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // wishlist found and has ownership
    // -- update updatedAt field to now
    wishlist.updatedAt = new Date();

    const result = await WishlistModel.updateOne(
      { _id: wishlistID },
      { $set: wishlist }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Wishlist updated successfully" });
    } else {
      console.error(result);
      res
        .status(404)
        .json({ message: "Wishlist not found or no changes made" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating wishlist" });
  }
};

const deleteWishlist = async (req, res) => {
  const wishlistID = req.params.wishlistID;
  const user = req.user;

  try {
    // find wishlist by id
    const foundWishlist = await WishlistModel.findOne({ _id: wishlistID });

    if (_.isEmpty(foundWishlist)) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    // wishlist found but deleted
    const wishlistDeleted =
      !_.isEmpty(foundWishlist) && foundWishlist.deletedAt !== null;
    if (wishlistDeleted) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    // wishlist found but no ownership
    const isNotOwner =
      !wishlistDeleted &&
      foundWishlist.userID.toString() !== user._id.toString();
    if (isNotOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // wishlist found and has ownership
    // update wishlist
    const result = await WishlistModel.updateOne(
      { _id: wishlistID },
      { $set: { deletedAt: new Date() } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Wishlist deleted successfully" });
    } else {
      console.error(result);
      res
        .status(404)
        .json({ message: "Wishlist not found or no changes made" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting wishlist" });
  }
};

module.exports = {
  createWishlist,
  getMultipleWishlists,
  getWishlistsByUserID,
  getWishlist,
  getWishlists,
  updateWishlist,
  deleteWishlist,
};
