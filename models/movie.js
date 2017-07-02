const mongoose = require('mongoose');

const movieSchema = mongoose.Schema({
  title : String,
  poster : String,
  rating : String,
  introduction : String,
  created_at : { type : Date, default : Date.now },
  update_at : { type : Date, default : Date.now }
})

const Movie = module.exports = mongoose.model('Movie',movieSchema)
