'use strict';

const express = require('express');
const createError = require('http-errors');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/user');

const { isLoggedIn, isNotLoggedIn } = require('../helpers/Middlewares');

router.post('/signup', isNotLoggedIn(), async (req, res, next) => {
  const { username, email, password } = req.body;
  try {
		const findUserByEmail = await User.findOne({ email }, 'email');
		const findUserByUsername = await User.findOne({ username }, 'username');
		if (findUserByUsername || findUserByEmail) {
			res.status(422).json({message: "There is already a user with that username/email"});
		} else {
			const salt = bcrypt.genSaltSync(10);
			const hashPass = bcrypt.hashSync(password, salt);
			const newUser = await User.create({ username, password: hashPass, email });
      req.session.currentUser = newUser;
			res.status(200).json({ message: "User succesfully created", user: newUser});
		};
	} catch (error) {
		next(error);
	};
});

router.post('/login', isNotLoggedIn(), async (req, res, next) => {
  const { username, password } = req.body;
  try {
		const findUserByUsername = await User.findOne({ username });
		if (!findUserByUsername) {
			next(createError(404));
		} else if (bcrypt.compareSync(password, findUserByUsername.password)) {
			req.session.user = findUserByUsername;
			res.status(200).json({message: "User succesfully logged in", user: findUserByUsername});
		} else {
			next(createError(401));
		};
	} catch (error) {
		next(error);
	};
});

router.post('/logout', isLoggedIn(), async (req, res, next) => {
  try {
    await req.session.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/me', isLoggedIn(), async (req, res, next) => {
	try {
    const user = req.session.user;
		res.status(200).send(req.session.user);
	} catch (error) {
		next(error);
	};
});


module.exports = router;
