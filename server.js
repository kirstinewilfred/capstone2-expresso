const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const logger = require('morgan');
const cors = require('cors');


module.exports = app;

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');


const PORT = process.env.PORT || 4000;

//middleware for parsing request bodies
app.use(bodyParser.json());
app.use(logger('dev'));

//middleware for handling CORS requests from index.html
app.use(cors());


// Mounting existing apiRouter at the '/api' path.
const apiRouter = require('./api/api');
app.use('/api', apiRouter);


//start the server listening at PORT:
app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});
