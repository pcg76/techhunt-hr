let express = require('express'),
    router = express.Router(),
    util = require('../utilities/util'),
    employee_service = require('../services/employee');

const IncomingForm = require('formidable').IncomingForm;

const csv = require('csv-parser');
const fs = require('fs');

var isProcessing = false;

/**Api to get employees */
router.get('', function(request, response) {
    console.log('minSalary: ' + request.query.minSalary + "  maxSalary: " + request.query.maxSalary
        + " offset: " + request.query.offset + " limit: " + request.query.limit
        + " sort: " + request.query.sort);
    
    var test = {id: 'e0003', login: 'rwesley', name: 'Ron Weasley', salary: 19234.5};
    var test1 = {id: 'e0004', login: 'rhagrid', name: 'Rubeus Hagrid', salary: 4000.0};
    var final_test = { results: [test, test1] };

    response.setHeader('Content-Type', 'application/json');

    employee_service.getEmployees(request.query)
        .then(resolve => {
            res = { results: resolve};
            response.send(JSON.stringify(res));
        })
        .catch(err => {
            response.send(JSON.stringify(err));
        });
});

/**Api to upload employee */
router.post('/upload', (req, res) => {
    console.log('Api invoked');
    var form = new IncomingForm();

    form.on('file', (field, file) => {
        console.log('Filename: ' + file.path);

        const employees = [];

        var isError = false;

        if (isProcessing == true) {
            isError = true;
            console.log('File uploading in progress...');
            res.status(util.statusCode.FIVE_ZERO_ZERO).send('File uploading in progress...');
            return;
        }

        isProcessing = true;

        fs.createReadStream(file.path)
            .on('error', (e) => {
                console.log(e.message);
                isProcessing = false;
                res.status(util.statusCode.FIVE_ZERO_ZERO).send({message: e.message});
            })
            .pipe(csv({
                skipComments: '#',
                strict: true,
                mapHeaders: ({ header, index }) => {
                    if (index == 0) {
                        return 'id';
                    } else if (index == 1) {
                        return 'login';
                    } else if (index == 2) {
                        return 'name';
                    } else {
                        return 'salary';
                    }
                }
            }))
            .on('data', (row) => {
                var n_salary = +row.salary;
                if (isNaN(n_salary) || n_salary < 0.0) {
                    isError = true;
                    isProcessing = false;
                    res.status(util.statusCode.FIVE_ZERO_ZERO).send({message: 'Invalid salary found in CSV file!'});
                } else {
                    const employee = {
                        id: row.id,
                        login: row.login,
                        name: row.name,
                        salary: n_salary
                    }

                    employees.push(employee);
                }
            })
            .on('end', () => {
                if (!isError) {
                    console.log('CSV file successfully processed');
                    console.table(employees);

                    // proceed to check for duplicates
                    const status = employees.some(employee => {
                        let counter = 0;
                        for (const iterator of employees) {
                            if (iterator.id === employee.id && iterator.login === employee.login) {
                                counter += 1;
                            }
                        }
                        return counter > 1;
                    });

                    if (status == true) {
                        isProcessing = false;
                        console.log('Duplicates found!');
                        res.status(util.statusCode.FIVE_ZERO_ZERO).send({message: 'Duplicates found in CSV file!'});
                    } else {
                        employee_service.uploadEmployee(employees)
                            .then(resolve => {
                                isProcessing = false;
                                res.json();
                            })
                            .catch(err => {
                                isProcessing = false;
                                res.status(err.statusCode).send(err.statusMessage);
                            });
                    }
                }
            })
            .on('error', (e) => {
                isProcessing = false;
                console.log(e.message);
                res.status(util.statusCode.FIVE_ZERO_ZERO).send({message: e.message});
            })
    });

    form.parse(req);
});

module.exports = router;