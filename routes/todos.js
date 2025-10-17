const express = require("express");
const mongoose = require("mongoose");
const Todo = require("../models/Todo");
const auth = require("../middleware/auth");

const router = express.Router();

// Get all todos for the authenticated user
router.get("/", auth, async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .populate('userId', 'username email');
    
    res.json(todos);
  } catch (error) {
    console.error("Get todos error:", error);
    res.status(500).json({ message: "Failed to fetch todos" });
  }
});

// Create a new todo
router.post("/", auth, async (req, res) => {
  try {
    const { title, description, priority, dueDate, category } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: "Todo title is required" });
    }

    const todo = new Todo({
      title: title.trim(),
      description: description?.trim(),
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      category: category?.trim(),
      userId: req.user.userId
    });

    await todo.save();
    
    // Populate user info for response
    await todo.populate('userId', 'username email');

    console.log(`New todo created by ${req.user.userId}: ${title}`);
    res.status(201).json(todo);
  } catch (error) {
    console.error("Create todo error:", error);
    res.status(500).json({ message: "Failed to create todo" });
  }
});

// Update a todo
router.put("/:id", auth, async (req, res) => {
  try {
    const { title, description, completed, priority, dueDate, category } = req.body;

    const todo = await Todo.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    // Update fields
    if (title !== undefined) todo.title = title.trim();
    if (description !== undefined) todo.description = description?.trim();
    if (completed !== undefined) todo.completed = completed;
    if (priority !== undefined) todo.priority = priority;
    if (dueDate !== undefined) todo.dueDate = dueDate ? new Date(dueDate) : null;
    if (category !== undefined) todo.category = category?.trim();

    await todo.save();
    await todo.populate('userId', 'username email');

    console.log(`Todo updated by ${req.user.userId}: ${todo.title}`);
    res.json(todo);
  } catch (error) {
    console.error("Update todo error:", error);
    res.status(500).json({ message: "Failed to update todo" });
  }
});

// Delete a todo
router.delete("/:id", auth, async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    console.log(`Todo deleted by ${req.user.userId}: ${todo.title}`);
    res.json({ message: "Todo deleted successfully" });
  } catch (error) {
    console.error("Delete todo error:", error);
    res.status(500).json({ message: "Failed to delete todo" });
  }
});

// Get todo statistics for the user
router.get("/stats", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const stats = await Todo.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: ["$completed", 1, 0] } },
          pending: { $sum: { $cond: ["$completed", 0, 1] } },
          high: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ["$priority", "medium"] }, 1, 0] } },
          low: { $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] } }
        }
      }
    ]);

    res.json(stats[0] || { total: 0, completed: 0, pending: 0, high: 0, medium: 0, low: 0 });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
});

module.exports = router;
