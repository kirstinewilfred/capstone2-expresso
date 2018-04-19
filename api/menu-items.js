const express = require('express');
const menu_itemsRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const {
  getFromDatabaseById
} = require('./db');

//handle param menuItemId
menu_itemsRouter.param('menuItemId', (req, res, next, id) => {
  getFromDatabaseById(req, res, next, id, "MenuItem");

});


/*
/api/menus/:menuId/menu-items
GET
Returns a 200 response containing all saved menu items related to the menu
with the supplied menu ID on the menuItems property of the response body
If a menu with the supplied menu ID doesn't exist, returns a 404 response
*/
menu_itemsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM MenuItem WHERE menu_id = $menu_id';
  const values = { $menu_id: req.Menu.id};
  db.all(sql, values, (error, menuItems) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({menuItems: menuItems});
    }
  });
});


//helper function for validating MenuItem
const validateMenuItem = (req, res, next) => {
  const newMenuItem = req.body.menuItem;
  //console.log("------------ new MenuItem ------", newMenuItem);
  if (!newMenuItem.name || !newMenuItem.description ||
      !newMenuItem.inventory || !newMenuItem.price ) {
        //console.log(" xxxxxxxxxxxxxxx INVALID xxxxxxx" );
        return res.sendStatus(400);
      }
  //console.log(" ------------ VALID ------", newMenuItem );
  next();
}

/*
POST
Creates a new menu item, related to the menu with the supplied menu ID,
with the information from the menuItem property of the request body and
saves it to the database. Returns a 201 response with the newly-created menu item
on the menuItem property of the response body
If any required fields are missing, returns a 400 response
If a menu with the supplied menu ID doesn't exist, returns a 404 response
*/
menu_itemsRouter.post('/', validateMenuItem, (req, res, next) => {
  const name = req.body.menuItem.name,
        description = req.body.menuItem.description,
        inventory = req.body.menuItem.inventory,
        price = req.body.menuItem.price,
        menuId = req.Menu.id;
  const sql = 'INSERT INTO MenuItem (name, description, inventory, price, menu_id)' +
            'VALUES ($name, $description, $inventory, $price, $menu_id)';
  const values = {
    $name: name,
    $description: description,
    $inventory: inventory,
    $price: price,
    $menu_id: menuId,
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM MenuItem WHERE id = ${this.lastID}`,
        (error, menuItem) => {
          res.status(201).json({menuItem: menuItem});
        });
    }
  });
});

/*
/api/menus/:menuId/menu-items/:menuItemId
PUT
Updates the menu item with the specified menu item ID using the information from the
menuItem property of the request body and saves it to the database.
Returns a 200 response with the updated menu item on the menuItem property of the response body
If any required fields are missing, returns a 400 response
If a menu with the supplied menu ID doesn't exist, returns a 404 response
If a menu item with the supplied menu item ID doesn't exist, returns a 404 response
*/
menu_itemsRouter.put('/:menuItemId', validateMenuItem, (req, res, next) => {
  const name = req.body.menuItem.name,
        description = req.body.menuItem.description,
        inventory = req.body.menuItem.inventory,
        price = req.body.menuItem.price,
        menuId = req.Menu.id;
  //console.log("----------- param? -------", req.MenuItem)
  //console.log("----------- updated menuItem -------", req.body.menuItem)
  var inputData = [name, description, inventory, price, req.MenuItem.id, menuId];

  db.run("UPDATE MenuItem SET name=?, description=?, inventory=?, price=? WHERE id=? AND menu_id=?",
  inputData, function(error){
    if (error) {
      next(error);
    } else {
      db.get("SELECT * from MenuItem where id = $id;", {
        $id: req.MenuItem.id
      }, function (error, menuItem) {
        res.status(200).json({menuItem: menuItem});
      }); //end db get
    } //end else
  }); //end db.run
}); //end put

/*
DELETE
Deletes the menu item with the supplied menu item ID from the database. Returns a 204 response.
If a menu with the supplied menu ID doesn't exist, returns a 404 response
If a menu item with the supplied menu item ID doesn't exist, returns a 404 response
*/
menu_itemsRouter.delete('/:menuItemId', (req, res, next) => {
  const sql = 'DELETE FROM MenuItem WHERE id = $menuItemId';
  const values = {$menuItemId: req.params.menuItemId};

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  });
});


module.exports = menu_itemsRouter;
