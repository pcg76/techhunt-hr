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

module.exports = {
    uploadEmployee: uploadEmployee
};