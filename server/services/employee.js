let async = require('async'),
    parseString = require('xml2js').parseString,
    dbConfig = require("../utilities/mysqlConfig"),
    util = require('../utilities/util');

function performQuery(data, cb) {
    const db = dbConfig.getDB();
    db.query("SELECT * FROM employee WHERE id = ?", [data.id], function(selectErr, rows) {
        if (selectErr) {
            return cb(selectErr);
        } else {
            if (rows.length <= 0) {
                db.query("INSERT INTO employee SET ? ", data, function(err, results) {
                    if (err) {
                        return cb(err);
                    } else {
                        cb();
                    }
                });
            } else { // got record
                // check login map to different id
                if (rows[0].login != data.login) {
                    // check for existing login id in DB
                    db.query("SELECT * FROM employee WHERE login = ?", [data.login], function(loginErr, login_rows) {
                        if (loginErr) {
                            return cb(loginErr);
                        } else {
                            if (login_rows.length > 0) { // there's an existing record, proceed to swap
                                let temp_data = [data.login + data.login, data.id];
                                let first_login = rows[0].login;
                                dbConfig.getDB().query("UPDATE employee SET login = ? \
                                    WHERE id = ?", temp_data, function (tempUpdateErr, tempData) {
                                    if (tempUpdateErr) {
                                        return cb(tempUpdateErr);
                                    } else {
                                        let second_login_data = [first_login, rows[0].name, rows[0].salary, login_rows[0].id];
                                        dbConfig.getDB().query("UPDATE employee SET login = ?, name = ?, salary = ? \
                                            WHERE id = ?", second_login_data, function (secondUpdateErr, secondData) {
                                            if (secondUpdateErr) {
                                                return cb(secondUpdateErr);
                                            } else {
                                                let final_login_data = [data.login, data.name, data.salary, data.id];
                                                dbConfig.getDB().query("UPDATE employee SET login = ?, name = ?, salary = ? \
                                                    WHERE id = ?", final_login_data, function (finalUpdateErr, finalData) {
                                                    if (finalUpdateErr) {
                                                        return cb(finalUpdateErr);
                                                    } else {
                                                        cb();
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            } else {
                                dbConfig.getDB().query("UPDATE employee SET login = ?, name = ?, salary = ? \
                                    WHERE id = ?", update_data, function(updateErr, dbData) {
                                    if (updateErr) {
                                        return cb(updateErr);
                                    } else {
                                        cb();
                                    }
                                });
                            }
                        }
                    });
                } else {
                    let update_data = [data.login, data.name, data.salary, data.id];
                    dbConfig.getDB().query("UPDATE employee SET login = ?, name = ?, salary = ? \
                        WHERE id = ?", update_data, function(updateErr, dbData) {
                        if (updateErr) {
                            return cb(updateErr);
                        } else {
                            cb();
                        }
                    });
                }
            }
        }
    });
}

let uploadEmployee = async function(dataToSet) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = dbConfig.getDB();
            db.beginTransaction((beginTransactionError) => {
                if (beginTransactionError) {
                    reject({ "statusCode": util.statusCode.FIVE_ZERO_ZERO, "statusMessage": beginTransactionError.message });
                }

                // loop through all queries
                async.each(dataToSet, performQuery, function(err) {
                    if (err) {
                        db.rollback((rollbackError) => {
                            if (rollbackError != null) {
                                reject({ "statusCode": util.statusCode.FIVE_ZERO_ZERO, "statusMessage": rollbackError.message });
                            } else {
                                console.log(err.message);
                                reject({ "statusCode": util.statusCode.FIVE_ZERO_ZERO, "statusMessage": err.message });
                            }
                        });
                        return;
                    }

                    // if all loops have iterated and no errors, then commit
                    db.commit((commitError) => {
                        if (commitError) {
                            reject({ "statusCode": util.statusCode.FIVE_ZERO_ZERO, "statusMessage": commitError.message });
                        }
                        resolve({ "statusCode": util.statusCode.OK, "statusMessage": util.statusMessage.DATA_UPDATED, "result": dataToSet });
                    });
                });
            });
        } catch (error) {
            reject({ "statusCode": util.statusCode.FIVE_ZERO_ZERO, "statusMessage": error.message });
        }
    });
}

let getEmployees = async function(dataToSet) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = dbConfig.getDB();
            sort_order = dataToSet.sort[0];

            if (sort_order == '+') {
                sort_order = ' ASC';
            } else {
                sort_order = ' DESC';
            }

            sql_query = "SELECT * FROM employee"
                + " WHERE salary >= " + dataToSet.minSalary + " AND salary <= " + dataToSet.maxSalary
                + " ORDER BY " + dataToSet.sort.substr(1) + sort_order
                + " LIMIT " + dataToSet.offset + ", " + dataToSet.limit;

            db.query(sql_query, function(selectErr, rows) {
                if (selectErr) {
                    console.log(selectErr.message);
                    reject({ "statusCode": util.statusCode.FOUR_ZERO_ZERO, "statusMessage": selectErr.message });
                } else {
                    resolve(rows);
                }
            });
        } catch (error) {
            reject({ "statusCode": util.statusCode.FOUR_ZERO_ZERO, "statusMessage": error.message });
        }
    });
}

module.exports = {
    uploadEmployee: uploadEmployee,
    getEmployees: getEmployees
};