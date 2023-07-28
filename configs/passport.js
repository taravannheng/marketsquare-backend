const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

const UserModel = require("../models/users/user.model");
const { verifyPassword } = require("../utils/helpers");

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      session: false,
    },
    async (email, password, done) => {
      // find the user in the database using email
      const user = UserModel.findOne({ email });

      if (!user) {
        return done(null, false, { message: "Incorrect email." });
      }

      // check if the password is correct
      if (!(await verifyPassword(password, user.password))) {
        return done(null, false, { message: "Incorrect password." });
      }

      // if email and password are correct, return user
      return done(null, user);
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      try {
        // search user in database using profile.id
        const query = { email: profile.emails[0].value };
        const user = UserModel.findOne(query);

        if (user) {
          // if the user is found, return them
          return done(null, user);
        }

        // if the user is not found, create them in the database
        const newUser = new UserModel({
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
      profileFields: ["id", "email", "name", "photos"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // search user in database using email extract from profile
        const query = { email: profile.emails[0].value };
        const user = UserModel.findOne(query);

        console.log("the user: ", user);

        if (user) {
          // if the user is found, return them
          return done(null, user);
        }

        // if the user is not found, create them in the database
        const newUser = new UserModel({
          provider: "facebook",
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

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
