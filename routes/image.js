'use strict';

const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const User = require('../models/user');
const Image = require('../models/image');

const { isLoggedIn } = require('../helpers/Middlewares');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

router.post('/', isLoggedIn(), async (req, res, next) => {
  const { image } = req.body;
  try {
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
        result: result
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error
      });
  });
  } catch (error) {
    next(error);
  }
  
});

router.delete('/:id', isLoggedIn(), async (req, res, next) => {
  const { id } = req.params;
  try {
    const image = await Image.findById(id);
    if(image.owner === req.session.user.username) {
      const deleteImageFromDatabase = await Image.findByIdAndDelete(id);
      const deleteImageFromUserImagesList = await User.updateOne({ username: req.session.user.username}, { $pull: { uploadedImages: id } }, { new: true });
      cloudinary.uploader.destroy(image.publicId)
      .then(result => {
        res.status(200).json({
        result: result
      });
      })
      .catch(error => {
        res.status(500).json({
          error: error
        });
      });
    } else {
      res.status(403).json({
        message: "The image can only be removed by the owner"
     });
    }
  } catch (error) {
    next(error);
  } 
});

router.get('/all', isLoggedIn(), async (req, res, next) => {
  try {
    const listOfAllImages = await Image.find()
    res.status(200).json({ 
      listOfAllImages: listOfAllImages 
    });
  } catch (error) {
    next(error);
  }
});

router.get('/byId/:id', isLoggedIn(), async (req, res, next) => {
  const { id } = req.params
  try {
    const image = await Image.findById(id);
    res.status(200).json({ 
      image: image 
    });
  } catch (error) {
    next(error);
  }
});

router.get('/byCategory/:category', isLoggedIn(), async (req, res, next) => {
  const { category } = req.params
  try {
    const images = await Image.find({ category: category });
    res.status(200).json({ 
      images: images
    });
  } catch (error) {
    next(error);
  }
});

router.get('/byAuthor/:author', isLoggedIn(), async (req, res, next) => {
  const { author } = req.params
  try {
    const images = await Image.find({ author: author });
    res.status(200).json({ 
      images: images
    });
  } catch (error) {
    next(error);
  }
});

router.get('/notSelled', isLoggedIn(), async (req, res, next) => {
  try {
    const images = await Image.find({ selled: false });
    res.status(200).json({ 
      images: images
    });
  } catch (error) {
    next(error);
  }
});

router.post('/buy', isLoggedIn(), async (req, res, next) => {
  const { imageId } = req.body;
  try {
    const setSelledToTrue = await Image.updateOne({ _id: imageId}, { $set: { selled: true } }, { new: true });
    const addImageToBuyedList = await User.updateOne({ username: req.session.user.username}, { $push: { buyedImages: imageId } }, { new: true });
    res.status(200).json({ 
      message: "Image succesfully buyed"
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
