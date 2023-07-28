const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

const UserModel = require("../models/users/user.model");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // search user in database using profile.id
        const query = { id: profile.id };
        const user = await UserModel.findOne(query);

        console.log(user);

        // if the user is found, return them
        if (user) {
          return done(null, user);
        }

        // if the user is not found, create them in the database
        const newUser = new UserModel({
          id: profile.id,
          provider: "google",
          username: profile.displayName,
          email: profile.emails[0].value,
          profileUrl: profile.photos[0].value,
        });

        newUser.save();
        return done(null, newUser);
      } catch (error) {
        console.log(error);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/api/auth/facebook/callback",
      profileFields: ["id", "emails", "name", "photos"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // search user in database using id
        const query = { id: profile.id };
        const user = await UserModel.findOne(query);

        if (user) {
          // if the user is found, return them
          return done(null, user);
        }

        // if the user is not found, create them in the database
        const newUser = new UserModel({
          id: profile.id,
          provider: "facebook",
          username: `${profile.name.givenName} ${profile.name.familyName}`,
          profileUrl: profile.photos[0].value,
        });

        newUser.save();

        return done(null, newUser);
      } catch (error) {
        console.log(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
