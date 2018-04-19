const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const {
  getFromDatabaseById
} = require('./db');

//handle param timesheetId
timesheetsRouter.param('timesheetId', (req, res, next, id) => {
  getFromDatabaseById(req, res, next, id, "Timesheet");

});

/*
/api/employees/:employeeId/timesheets
GET
Returns a 200 response containing all saved timesheets related to the employee with
the supplied employee ID on the timesheets property of the response body
If an employee with the supplied employee ID doesn't exist, returns a 404 response
*/
timesheetsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Timesheet WHERE employee_id = $employee_id';
  const values = { $employee_id: req.Employee.id};
  db.all(sql, values, (error, timesheets) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({timesheets: timesheets});
    }
  });
});


//helper function for validating Timesheet
const validateTimesheet = (req, res, next) => {
  const newTimesheet = req.body.timesheet;
  //console.log("------------ new Timesheet ------", newTimesheet);
  if (!newTimesheet.hours || !newTimesheet.rate ||
      !newTimesheet.date ) {
        //console.log(" xxxxxxxxxxxxxxx INVALID xxxxxxx" );
        return res.sendStatus(400);
      }
  //console.log(" ------------ VALID ------", newTimesheet );
  next();
}

/*
POST
Creates a new timesheet, related to the employee with the supplied employee ID,
with the information from the timesheet property of the request body and saves
it to the database. Returns a 201 response with the newly-created timesheet on
the timesheet property of the response body
If an employee with the supplied employee ID doesn't exist, returns a 404 response
*/
timesheetsRouter.post('/', validateTimesheet, (req, res, next) => {
  const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date,
        employeeId = req.Employee.id;
  const sql = 'INSERT INTO Timesheet (hours, rate, date, employee_id)' +
            'VALUES ($hours, $rate, $date, $employee_id)';
  const values = {
    $hours: hours,
    $rate: rate,
    $date: date,
    $employee_id: employeeId,
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`,
        (error, timesheet) => {
          res.status(201).json({timesheet: timesheet});
        }); //end db get
    } //end else
  }); //end db run
}); //end post

/*
/api/employees/:employeeId/timesheets/:timesheetId
PUT
Updates the timesheet with the specified timesheet ID using the information from the
timesheet property of the request body and saves it to the database.
Returns a 200 response with the updated timesheet on the timesheet property of the response body
If any required fields are missing, returns a 400 response
If an employee with the supplied employee ID doesn't exist, returns a 404 response
If an timesheet with the supplied timesheet ID doesn't exist, returns a 404 response
*/
timesheetsRouter.put('/:timesheetId', validateTimesheet, (req, res, next) => {
  const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date,
        employeeId = req.Employee.id;
  //console.log("----------- param? -------", req.Timesheet)
  //console.log("----------- updated timesheet -------", req.body.timesheet)
  var inputData = [hours, rate, date, req.Timesheet.id, employeeId];

  db.run("UPDATE Timesheet SET hours=?, rate=?, date=? WHERE id=? AND employee_id=?",
  inputData, function(error){
    if (error) {
      next(error);
    } else {
      db.get("SELECT * from Timesheet where id = $id;", {
        $id: req.Timesheet.id
      }, function (error, timesheet) {
        res.status(200).json({timesheet: timesheet});
      }); //end db get
    } //end else
  }); //end db.run
}); //end put

/*
DELETE
Deletes the timesheet with the supplied timesheet ID from the database. Returns a 204 response.
If an employee with the supplied employee ID doesn't exist, returns a 404 response
If an timesheet with the supplied timesheet ID doesn't exist, returns a 404 response
*/
timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  const sql = 'DELETE FROM Timesheet WHERE id = $timesheetId';
  const values = {$timesheetId: req.params.timesheetId};

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  });
});


module.exports = timesheetsRouter;
