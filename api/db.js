const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//helper function for getting item from Database
function getFromDatabaseById(req, res, next, id, dbName) {
  db.get(`SELECT * from ${dbName} where id=${id};`, (error, row) => {
    if (!row) {
      return res.sendStatus(404);
    }
    req[dbName] = row;
    next();
  });

}

module.exports = {
  getFromDatabaseById
};
