const pd = require('pretty-data').pd;
const ntlmClient = require('node-ntlm-client');
const Agent = require('agentkeepalive');
const fetch = require('isomorphic-fetch');
const getFetchTestPlansXML = require('./xmlHelper').getFetchTestPlansXML;
const getFetchTestSuitesXML = require('./xmlHelper').getFetchTestSuitesXML;
const getFetchTestCasesXML = require('./xmlHelper').getFetchTestCasesXML;
const parseTestSuitesResponse = require('./xmlHelper').parseTestSuitesResponse;
const parseTestPlanResponse = require('./xmlHelper').parseTestPlanResponse;
const parseTestCasesResponse = require('./xmlHelper').parseTestCasesResponse;

require('es6-promise').polyfill();
const _ = require('lodash');

const keepaliveAgent = new Agent();

const options = {
    url: "specify url here",
    workstation: '',
    domain: 'specify domain here'
};

const type1message = ntlmClient.createType1Message(options.workstation, options.domain);

function fetchTestPlans(testPlansIDsArray, username, password){
    return getFetchTestPlansXML(testPlansIDsArray)
        .then(function(xmlBody){
            return fetch('http://tfs.com:8080/tfs/Main',{
                method: 'POST',
                username: username,
                password: password,
                agent: keepaliveAgent,
                headers:{
                    'Content-Type': 'application/soap+xml; charset=utf-8',
                    'Authorization': type1message
                }
            })
                .then(result => {
                    let message2 = result.headers._headers['www-authenticate'][0];
                    let decodedMessage2 = ntlmClient.decodeType2Message(message2);
                    let message3 = ntlmClient.createType3Message(decodedMessage2, username, password, undefined, options.domain);
                    return fetch('http://tfs.com:8080/tfs/Main/TestManagement/v1.0/TestResults.asmx', {
                        method: 'POST',
                        username: username,
                        password: password,
                        agent: keepaliveAgent,
                        headers:{
                            'Content-Type': 'application/soap+xml; charset=utf-8',
                            'Authorization': message3
                        },
                        body: xmlBody
                    }).then(result => {
                        if (result.status >= 400) {
                            throw new Error("Bad response from server");
                        }
                        return result.text();
                    });
                })
                .then(result => {
                    return parseTestPlanResponse(result);
                })
                .then(testPlanResponse => {
                    return testPlanResponse;
                })
                .catch(err => console.log(err));
        });
};

function fetchTestSuites(testSuitesIDsArray, username, password){
    return getFetchTestSuitesXML(testSuitesIDsArray)
        .then(function(xmlBody){
            return fetch('http://tfs.com:8080/tfs/Main',{
                method: 'POST',
                username: username,
                password: password,
                agent: keepaliveAgent,
                headers:{
                    'Content-Type': 'application/soap+xml; charset=utf-8',
                    'Authorization': type1message
                }
            })
                .then(result => {
                    let message2 = result.headers._headers['www-authenticate'][0];
                    let decodedMessage2 = ntlmClient.decodeType2Message(message2);
                    let message3 = ntlmClient.createType3Message(decodedMessage2, username, password, undefined, options.domain);
                    return fetch('http://tfs.com:8080/tfs/Main/TestManagement/v1.0/TestResults.asmx', {
                        method: 'POST',
                        username: username,
                        password: password,
                        agent: keepaliveAgent,
                        headers:{
                            'Content-Type': 'application/soap+xml; charset=utf-8',
                            'Authorization': message3
                        },
                        body: xmlBody
                    }).then(result => {
                        if (result.status >= 400) {
                            throw new Error("Bad response from server");
                        }
                        return result.text();
                    })
                })
                .then(result => {
                    return parseTestSuitesResponse(result);
                })
                .then(resultArray => {
                    return resultArray;
                })
                .catch(err => console.log(err));
        });
};


function fetchTestCases(testCasesArray, username, password){
    return getFetchTestCasesXML(testCasesArray)
        .then(function(xmlBody){
            return fetch('http://tfs.com:8080/tfs/Main',{
                method: 'POST',
                username: username,
                password: password,
                agent: keepaliveAgent,
                headers:{
                    'Content-Type': 'application/soap+xml; charset=utf-8',
                    'Authorization': type1message
                }
            })
                .then(result => {
                    let message2 = result.headers._headers['www-authenticate'][0];
                    let decodedMessage2 = ntlmClient.decodeType2Message(message2);
                    let message3 = ntlmClient.createType3Message(decodedMessage2, username, password, undefined, options.domain);
                    return fetch('http://tfs.com:8080/tfs/Main/WorkItemTracking/v4.0/ClientService.asmx', {
                        method: 'POST',
                        username: username,
                        password: password,
                        agent: keepaliveAgent,
                        headers:{
                            'Content-Type': 'application/soap+xml; charset=utf-8',
                            'Authorization': message3
                        },
                        body: xmlBody
                    }).then(result => {
                        if (result.status >= 400) {
                            throw new Error("Bad response from server");
                        }
                        return result.text();
                    })
                })
                .then(result => {
                    return parseTestCasesResponse(result);
                })
                .then(resultArray => {
                    return resultArray;
                })
                .catch(err => console.log(err));
        });
};


module.exports = {fetchTestPlans, fetchTestSuites, fetchTestCases}