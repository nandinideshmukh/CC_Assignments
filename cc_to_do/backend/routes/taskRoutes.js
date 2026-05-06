const express = require("express");
const router = express.Router();

const Task = require("../models/Task");


// CREATE Task
router.post("/", async (req, res) => {

  try {

    const task = new Task(req.body);

    await task.save();

    res.status(201).json(task);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});


// GET All Tasks
router.get("/", async (req, res) => {

  try {

    const tasks =
      await Task.find()
      .sort({ createdAt: -1 });

    res.json(tasks);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});


// UPDATE Task
router.put("/:id", async (req, res) => {

  try {

    const task =
      await Task.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    res.json(task);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});


// DELETE Task
router.delete("/:id", async (req, res) => {

  try {

    await Task.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message: "Task Deleted"
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

module.exports = router;