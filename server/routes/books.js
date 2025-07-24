const express = require('express');
const router = express.Router();
const Book = require('../modals/Book');
const authMiddleware = require('../middleware/authMiddleware');

// Add book
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { title, author } = req.body;
    const existing = await Book.findOne({ title, author, userId: req.user.id });
    if (existing) {
      return res.status(400).json({ error: "Book already exists!" });
    }

    const book = new Book({ ...req.body, userId: req.user.id });
    await book.save();
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Get user's books
router.get('/mybooks', authMiddleware, async (req, res) => {
  try {
    const books = await Book.find({ userId: req.user.id });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update book status or notes
router.put('/update/:id', authMiddleware, async (req, res) => {
  try {
    const updatedBook = await Book.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    res.json(updatedBook);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete book
router.delete('/delete/:id', authMiddleware, async (req, res) => {
  try {
    await Book.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
