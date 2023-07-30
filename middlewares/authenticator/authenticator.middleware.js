const passport = require('passport');

const checkAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err || !user) return res.status(401).json({ message: 'Unauthorized' });
    req.user = user;
    return next();
  }
  )(req, res, next);
};

module.exports = checkAuth;