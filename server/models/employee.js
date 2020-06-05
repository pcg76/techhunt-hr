let mysqlConfig = require("../utilities/mysqlConfig");

let initialize = () => {
    mysqlConfig.getDB().query("create table IF NOT EXISTS employee (id VARCHAR(30) primary key, login VARCHAR(30), name VARCHAR(30), salary DECIMAL(10,2))");
}

module.exports = {
    initialize: initialize
}