const express = require('express')
const app = express();
const index = require('./router/index')
const movie = require('./router/movie')
var cookieParser = require('cookie-parser');

app.use(cookieParser('this is the secret key for singed cookie'));

app.use('/',index)
app.use('/api',movie)

app.listen(3000,() => {
    console.log('app listening on port 3000.')
})

/*const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/test');*/



