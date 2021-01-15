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
    const addImageToUserImagesList = await User.updateOne({ username: req.session.user.username}, { $push: { uploadedImages: createImageInDatabase._id } }, { new: true })
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

router.delete('/:id', isLoggedIn(), async (req, res, next) => {
  const { id } = req.params;
  const image = await Image.findById(id);
  if(image.owner === req.session.user.username) {
    const deleteImageFromDatabase = await Image.findByIdAndDelete(id);
    const deleteImageFromUserImagesList = await User.updateOne({ username: req.session.user.username}, { $pull: { uploadedImages: id } }, { new: true })
    cloudinary.uploader.destroy(image.publicId)
    .then(result => {
      res.status(200).json({
      message: "success",
      result: result
    });
    })
    .catch(error => {
      res.status(500).json({
      message: "failure",
      error: error
    });
    })
  } else {
    res.status(403).json({
      message: "The image can by deleted only by the owner"
    })
  }
});

module.exports = router;
