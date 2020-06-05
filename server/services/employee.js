let async = require('async'),
    parseString = require('xml2js').parseString;

let util = require('../utilities/util'),
    employee_dao = require('../dao/employeeDao');

/**API to create the atricle */
let upload = (data, callback) => {
    async.auto({
        employeeUpload: (cb) => {
            console.log(data);
            employee_dao.uploadEmployees(data, callback);
        }
    }, (err, response) => {
        callback(response.employeeUpload);
    });
}

module.exports = {
    upload: upload
};