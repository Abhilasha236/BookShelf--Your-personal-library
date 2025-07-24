const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: String,
  author: String,
  thumbnail: String,
  publisher: String,
  publishedDate: String,
  rating: Number,
  ratingsCount: Number,
  description: String,
  previewLink: String,
  status: {
    type: String,
    enum: ['To Read', 'Reading', 'Finished'],
    default: 'To Read'
  },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
