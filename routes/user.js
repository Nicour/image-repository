'use strict';

const express = require('express');
const createError = require('http-errors');
const router = express.Router();

const User = require('../models/user');

const { isLoggedIn } = require('../helpers/Middlewares');

router.get('/uploadedImages', isLoggedIn(), async (req, res, next) => {
  try {
    const getUserWithUploadedImages = await User.findById(req.session.user._id).populate("uploadedImages");
    res.status(200).json({ 
      uploadedImages: getUserWithUploadedImages.uploadedImages 
    });
  } catch (error) {
    next(error);
  }
});

router.get('/buyedImages', isLoggedIn(), async (req, res, next) => {
  try {
    const getUserWithBuyedImages = await User.findById(req.session.user._id).populate("buyedImages");
    res.status(200).json({ 
      buyedImages: getUserWithBuyedImages.buyedImages 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
