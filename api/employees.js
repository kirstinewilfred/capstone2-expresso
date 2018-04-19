const employeesRouter = require('express').Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const {
  getFromDatabaseById
} = require('./db');

//handle param employeeId
employeesRouter.param('employeeId', (req, res, next, id) => {
  getFromDatabaseById(req, res, next, id, "Employee");

});

//handle timesheets for employees
const timesheetsRouter = require('./timesheets.js');
employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);


/*
/api/employees
GET
Returns a 200 response containing all saved currently-employed employees (is_current_employee is equal to 1)
on the employees property of the response body
*/
employeesRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Employee where is_current_employee=1;', (err, rows) => {
    if (err) {
      next(error);
    } else {
      res.send({employees: rows});
    }
  }); //end db.all
}); //end get

/*
/api/employees/:employeeId
GET
Returns a 200 response containing the employee with the supplied employee ID on the
employee property of the response body
If an employee with the supplied employee ID doesn't exist, returns a 404 response
*/
employeesRouter.get('/:employeeId', (req, res, next) => {
    res.send({employee: req["Employee"]});
});


//helper function for validating employee
const validateEmployee = (req, res, next) => {
  const newEmployee = req.body.employee;
  if (!newEmployee.name || !newEmployee.position || !newEmployee.wage ) {
        //console.log(" xxxxxxxxxxxxxxx INVALID xxxxxxx", newEmployee );
    return res.sendStatus(400);
  }
  //console.log(" ------------ VALID ------", newEmployee );
  next();
}

/*
/api/employees
POST
Creates a new employee with the information from the employee property of the request body
and saves it to the database. Returns a 201 response with the newly-created employee on
the employee property of the response body
If any required fields are missing, returns a 400 response
*/
employeesRouter.post('/', validateEmployee, (req, res, next) => {
  const newEmployee = req.body.employee;

  db.run(`INSERT INTO Employee (name, position, wage)
          VALUES ($name, $position, $wage);`, {
            $name: newEmployee.name,
            $position: newEmployee.position,
            $wage: newEmployee.wage,
          }, function (error) {
            if (error) {
              next(error);
            } else {
              db.get("SELECT * from Employee where id=$id", { $id: this.lastID}, (error, row) => {
                res.status(201).send({ employee: row });
              })//end get
            } //end else
          } ) //end db.run
}); //end post


/* /api/employees/:employeeId
PUT
Updates the employee with the specified employee ID using the information from the
employee property of the request body and saves it to the database.
Returns a 200 response with the updated employee on the employee property of the response body
If any required fields are missing, returns a 400 response
If an employee with the supplied employee ID doesn't exist, returns a 404 response
*/
employeesRouter.put('/:employeeId', validateEmployee, (req, res, next) => {
  db.serialize(() => {
    const newEmployee = req.body.employee;
    var inputData = [newEmployee.name, newEmployee.position,
                     newEmployee.wage, req.Employee.id];

    db.run("UPDATE Employee SET name=?, position=?, wage=? WHERE id=?;",
    inputData,function(error,rows){
      if (error) {
        next(error);
      }
    }); //end db.run
    db.get("SELECT * from Employee where id = $id;", {
      $id: req.Employee.id
    }, function (error, row) {
      res.send({employee: row})
    }); //end db get
  }); //end db serialize
}); //end put


/*
DELETE
Updates the employee with the specified employee ID to be unemployed (is_current_employee equal to 0).
Returns a 200 response.
If an employee with the supplied employee ID doesn't exist, returns a 404 response
*/
employeesRouter.delete('/:employeeId', (req, res, next) => {
  db.serialize(() => {
    const newEmployee = req.body.employee;
    var inputData = [ 0, req.Employee.id];

    db.run("UPDATE Employee SET is_current_employee=? WHERE id=?;",
    inputData,function(error,rows){
      if (error) {
        next(error);
      }
    }); //end db.run
    db.get("SELECT * from Employee where id = $id;", {
      $id: req.Employee.id
    }, function (error, row) {
      res.status(200).send({employee: row})
    }); //end db get
  }); //end db serialize

});

module.exports = employeesRouter;
