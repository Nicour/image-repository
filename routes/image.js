'use strict';

const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const User = require('../models/user');
const Image = require('../models/image');

const { isLoggedIn, isNotLoggedIn } = require('../helpers/Middlewares');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

router.post('/', isLoggedIn(), async (req, res, next) => {
  const { image } = req.body;
  cloudinary.uploader.upload(image)
  .then(async (result) => {
    const newImage = {
      name: req.body.imageName,
      author: req.body.author,
      owner: req.session.user.username,
      description: req.body.description,
      category: req.body.category,
      imageUrl: result.url,
      publicId: result.public_id
    };
    const createImageInDatabase = await Image.create(newImage);
    const addImageToUserImagesList = await User.update({ username: req.session.user.username}, { $push: { uploadedImages: createImageInDatabase._id } }, { new: true })
    res.status(200).json({
      message: "success",
      result: result
    });
  })
  .catch((error) => {
    res.status(500).json({
      message: "failure",
      error: error
    });
  });
});

router.post('/delete/:public_id', (req, res, next) => {
  const publicId = req.params;
  cloudinary.uploader.destroy(publicId)
  .then(result => {
    res.send(result)
  })
  .catch(error => {
    res.send(error)
  })
});

module.exports = router;
