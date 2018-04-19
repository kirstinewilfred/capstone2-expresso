const menusRouter = require('express').Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const {
  getFromDatabaseById
} = require('./db');

//handle param menuId
menusRouter.param('menuId', (req, res, next, id) => {
  getFromDatabaseById(req, res, next, id, "Menu");

});

//handle menu_items for menus
const menu_itemsRouter = require('./menu-items.js');
menusRouter.use('/:menuId/menu-items', menu_itemsRouter);


/*
/api/menus
GET
Returns a 200 response containing all saved menus on the menus property of the response body
*/
menusRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Menu;', (err, rows) => {
    if (err) {
      next(error);
    } else {
      res.send({menus: rows});
    }
  }); //end db.all
}); //end get

/*
/api/menus/:menuId
GET
Returns a 200 response containing the menu with the supplied menu ID on
the menu property of the response body
If a menu with the supplied menu ID doesn't exist, returns a 404 response
*/
menusRouter.get('/:menuId', (req, res, next) => {
    res.send({menu: req["Menu"]});
});


//helper function for validating menu
const validateMenu = (req, res, next) => {
  const newMenu = req.body.menu;
  if (!newMenu.title  ) {
        //console.log(" xxxxxxxxxxxxxxx INVALID xxxxxxx", newMenu );
    return res.sendStatus(400);
  }
  //console.log(" ------------ VALID ------", newMenu );
  next();
}


/*
/api/menus
POST
Creates a new menu with the information from the menu property of the request body
and saves it to the database. Returns a 201 response with the newly-created menu on
the menu property of the response body
If any required fields are missing, returns a 400 response
*/
menusRouter.post('/', validateMenu, (req, res, next) => {
  const newMenu = req.body.menu;
  db.run(`INSERT INTO Menu ( title )
          VALUES ($title);`, {
            $title: newMenu.title
          }, function (error) {
            if (error) {
              next(error);
            } else {
              db.get("SELECT * from Menu where id=$id", { $id: this.lastID}, (error, menu) => {
                res.status(201).send({ menu: menu });
              })//end get
            } //end else
          } ) //end db.run
}); //end post




/* /api/menus/:menuId
PUT
Updates the menu with the specified menu ID using the information from the
menu property of the request body and saves it to the database.
Returns a 200 response with the updated menu on the menu property of the response body
If any required fields are missing, returns a 400 response
If a menu with the supplied menu ID doesn't exist, returns a 404 response
*/
menusRouter.put('/:menuId', validateMenu, (req, res, next) => {
  db.serialize(() => {
    const newMenu = req.body.menu;
    var inputData = [newMenu.title, req.Menu.id];

    db.run("UPDATE Menu SET title=? WHERE id=?;",
    inputData,function(error){
      if (error) {
        next(error);
      }
    }); //end db.run
    db.get("SELECT * from Menu where id = $id;", {
      $id: req.Menu.id
    }, function (error, row) {
      res.send({menu: row})
    }); //end db get
  }); //end db serialize
}); //end put



/*
DELETE
Deletes the menu with the supplied menu ID from the database if that menu has no related menu items.
Returns a 204 response.
If the menu with the supplied menu ID has related menu items, returns a 400 response.
If a menu with the supplied menu ID doesn't exist, returns a 404 response
*/
menusRouter.delete('/:menuId', (req, res, next) => {
  //first figure out if menu has related menu_items
  db.get("SELECT * from MenuItem where menu_id = $id;", {
    $id: req.Menu.id
  }, function (error, row) {
    //console.log('--------- inside select issues with menusId row=', row)
    if (undefined !== row) {
      //console.log('----- we found an issue with that menusId -----')
      res.status(400).send(); //send 400
    } else {
      db.run(`DELETE FROM Menu WHERE id = $id;`,
        { $id: req.Menu.id },
         function (error) {
           if (error) {
             next(error);
           } else {
             res.status(204).send();
           } //end else error
         }); //end db.run
       } //end else menu_item
  }); //end db get
}); //end delete


module.exports = menusRouter;
