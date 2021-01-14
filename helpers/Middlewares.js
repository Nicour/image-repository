'use strict';

const createError = require('http-errors');

exports.isLoggedIn = () => (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    next(createError(401));
  };
};

exports.isNotLoggedIn = () => (req, res, next) => {
  if (!req.session.user) {
    next();
  } else {
    next(createError(403));
  };
};