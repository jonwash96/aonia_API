const router = require("express").Router();
const User = require("../models/User");
const Notification = require("../models/Notification");
const requireAuth = require("../middleware/requireAuth");
router.get("/", async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
});
router.get("/:userId", requireAuth, async (req, res) => {
  try {
    if (req.user._id !== req.params.userId && !req.user.isAdmin) {
      res.status(403);
      throw new Error("Not Authorized");
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.status(200).json(user);
  } catch (error) {
    if (req.statusCode === 403 || req.statusCode === 404) {
      res.json({ err: error.message });
    } else {
      res.status(500).json({ err: error.message });
    }
  }
});
router.put("/:userId", requireAuth, async (req, res) => {
  try {
    if (req.user._id !== req.params.userId && !req.user.isAdmin) {
      res.status(403);
      throw new Error("Not Authorized");
    }

    let user = await User.findById(req.params.userId).populate("photo");
    if (!user) throw new Error("User Not found.");

    let profilePhoto = user.photo;
    if (user.photo?.url && req.body.photo !== user.photo.url) {
      try {
        const newPhoto = new WebLink({
          title: "profile-photo",
          url: req.body.photo,
        });
        profilePhoto = await newPhoto.save();
      } catch (error) {
        if (!profilePhoto) throw new Error("New Profile Photo failed.");
      }
    }

    user.username = req.body.username;
    user.displayName = req.body.displayName;
    user.email = req.body.email;
    user.photo = profilePhoto;

    await user.save();

    res.status(200).json(user);
  } catch (error) {
    if (req.statusCode === 403 || req.statusCode === 404) {
      res.json({ err: error.message });
    } else {
      res.status(500).json({ err: error.message });
    }
  }
});
router.delete("/:userId", requireAuth, async (req, res) => {
  try {
    if (req.user._id !== req.params.userId && !req.user.isAdmin) {
      res.status(403);
      throw new Error("Not Authorized");
    }

    let user = await User.findByIdAndDelete(req.params.userId);
    if (!user) throw new Error("User Not found.");

    res.status(204).json({ message: "Successfully deleted" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
});

module.exports = router;
