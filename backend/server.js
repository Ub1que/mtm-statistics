const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const fetchTestPlans = require('./helpers/fetch').fetchTestPlans;
const fetchTestSuites = require('./helpers/fetch').fetchTestSuites;
const fetchTestCases = require('./helpers/fetch').fetchTestCases;

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', (req, res) => res.send('Hello World!'))

app.post('/fetchTestPlans', (req, res) => {
    fetchTestPlans(req.body.keysArray, req.body.username, req.body.password)
        .then(testPlanResponse => {
            res.send(testPlanResponse);
        });
})

app.post('/fetchTestSuites', (req, res) => {
    fetchTestSuites(req.body.keysArray, req.body.username, req.body.password)
        .then(result => {
            res.send({
                resultArray: result
            });
        });
})

app.post('/fetchTestCases', (req, res) => {
    fetchTestCases(req.body.testCases, req.body.username, req.body.password)
        .then(result => {
            res.send({
                resultArray: result
            });
        });
})

app.listen(3005, () => console.log('Example app listening on port 3005!'))

