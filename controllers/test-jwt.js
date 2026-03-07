const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

router.get("/sign-token", (req, res) => {
  const user = {
    _id: 1,
    username: "test",
    password: "daowpodijwa908u9oiajwd8awyd8wyudn7y",
  };

  delete user.password;

  const token = jwt.sign({ user }, process.env.SECRET);

  res.json({ message: "You are authorized!", token });
});

router.get("/verify-token", (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    const decoded = jwt.verify(token, process.env.SECRET )

    res.json({ decoded });

  } catch (error) {
    res.json({err: error.message})
  }
});

module.exports = router;
