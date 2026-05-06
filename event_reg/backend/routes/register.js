const express = require("express");
const router = express.Router();
const Registration = require("../models/Registration");


router.post("/", async (req, res) => {
  try {

    const newUser = new Registration(req.body);
    await newUser.save();

    res.status(201).json({
      message: "Registration Successful"
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
});


router.get("/", async (req, res) => {

  try {

    const users =
      await Registration.find()
      .sort({ _id: -1 });

    res.json(users);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});


router.get("/:id", async (req, res) => {

  try {

    const user =
      await Registration.findById(
        req.params.id
      );

    res.json(user);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

module.exports = router;