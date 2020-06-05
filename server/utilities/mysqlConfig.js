var config = require("./config").config;
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: config.DB_URL_MYSQL.host,
    user: config.DB_URL_MYSQL.user,
    password: config.DB_URL_MYSQL.password,
    database: config.DB_URL_MYSQL.database,
});

connection.connect((err) => {
    require('../models/employee').initialize();

    if (!err) {
        console.log('Database is connected...');
    } else {
        console.log('Error connecting to database...' + err.message);
    }
});

let getDB = () => {
    return connection;
}

module.exports = {
    getDB: getDB
}