let dbConfig = require("../utilities/mysqlConfig"),
    util = require('../utilities/util'),
    async = require('async');

let uploadEmployees = (dataToSet, callback) => {
    async.series([
        function(cb) {
            var data = [];

            for (idx = 0; idx < dataToSet.length; ++idx) {
                data.push([dataToSet[idx].id, dataToSet[idx].login, dataToSet[idx].name, dataToSet[idx].salary]);
            }
        
            dbConfig.getDB().query("insert into employee (id, login, name, salary) VALUES ? ON DUPLICATE KEY UPDATE \
            login=VALUES(login), name=VALUES(name), salary=VALUES(salary)", [data], (err, dbData) => {
                if (err) {
                    callback({ "statusCode": util.statusCode.FIVE_ZERO_ZERO, "statusMessage": err.message });
                    return;
                }
                
                cb();
            });
        },

        function(cb) {
            console.log('Finished updating');
            callback({ "statusCode": util.statusCode.OK, "statusMessage": util.statusMessage.DATA_UPDATED, "result": dataToSet });
            cb();
        }
    ]);
}

module.exports = {
    uploadEmployees: uploadEmployees,
}