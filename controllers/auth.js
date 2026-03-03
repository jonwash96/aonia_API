const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const requireAuth = require("../middleware/requireAuth");
const mongoose = require('mongoose');
const User = require("../models/User");
const Notification = require('../models/Notification');
const { WebLink } = require('../models/WebLink');
const Activity = require('../models/Activity');

const saltRounds = 12;

function signToken(user) {
  const payload = { _id: user._id, username: user.username };
  return jwt.sign(payload, process.env.SECRET, { expiresIn: "7d" });
}

router.post("/sign-up", async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username?.trim() || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const existingUser = await User.findOne({ username: {$regex: new RegExp(`^${username.trim()}$`, 'i')} });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: `User with username ${username} already exists.` });
    }

    const hashed = bcrypt.hashSync(password, saltRounds);

    const newUserId = new mongoose.Types.ObjectId();
    const welcomeNotificationId = new mongoose.Types.ObjectId();
    const newUserActivityId = new mongoose.Types.ObjectId();

    const newUserActivity = new Activity({
      _id: newUserActivityId,
      user: newUserId,
      category: 'user_registration',
      resourceType: 'User',
      resourceId: newUserId,
    });
    newUserActivity.save();

    const welcomeNotification = new Notification({
      _id: welcomeNotificationId,
      title: "Welcome to $pend Sense!",
      description: "Click here to set up your profile",
      status: "unread",
      action: '/profile/edit',
      prority: 3,
      activityId: newUserActivityId
    });
    welcomeNotification.save();

    let profilePhoto = await WebLink.findOne({title: "Default Profile Photo"});
    if (!profilePhoto) {
      profilePhoto = new WebLink({
        title: "Default Profile Photo",
        category: 'photo',
        url: '/default-profile-photo.jpg'
      });
      profilePhoto = await profilePhoto.save();
    };

    let user = new User({
      _id: newUserId,
      username: username.trim(),
      displayName: username.trim(),
      password: hashed,
      email: email,
      notifications: [welcomeNotificationId],
      activity: [newUserActivityId],
      photo: profilePhoto
    });
    user = await user.save();
    await user.populate('notifications activity');

    const token = signToken(user);
    return res.status(201).json({token, user});
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({path: 'notifications', populate:{path: 'activityId'}})
    .populate("activity expenses receipts");
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json(user);
});

router.post("/sign-in", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username?.trim() || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ username: {$regex: new RegExp(`^${username.trim()}$`, 'i')} })
      .select("+password")
      .populate({path: 'notifications', populate:{path: 'activityId'}})
      .populate("notifications activity expenses receipts");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = bcrypt.compareSync(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);

    return res.status(200).json({ token, user });
  } catch (error) {
    console.error("@sign-in. error", error)
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

router.post("/sign-out", async (req, res) => {
  try {
    return res.status(200).json({
      message: "Signed out successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Sign out failed" });
  }
});

module.exports = router;