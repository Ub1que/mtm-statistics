const fs = require('fs');
const xml2js = require('xml2js');
const builder = new xml2js.Builder();
const parser = new xml2js.Parser();
const pd = require('pretty-data').pd;
const _ = require('lodash');
const path = require('path');

function getFetchTestPlansXML(testPlansIDsArray){
    return new Promise(function(resolve, reject){
        fs.readFile(path.join(__dirname, '../xmlFiles/FetchTestPlans.xml'), function(err, data) {
            if (err) reject(err);
            parser.parseString(data, function (err, result) {
                if (err) reject(err);
                try {
                    let IDsArray = testPlansIDsArray.map(planID => {
                        return {
                            "$": {
                                "Id": planID
                            }
                        }
                    });
                    result['soap12:Envelope']['soap12:Body'][0]['FetchTestPlans'][0]['idsToFetch'][0]['IdAndRev'] = IDsArray;   
                    resultObj = builder.buildObject(result);                 
                } catch (error) {
                    reject('Error occured during building test plan xml body for request \n' + error);
                }
                resolve(resultObj);
            });
        });
    })
};

function getFetchTestSuitesXML(suitesIDsArray){
    return new Promise(function(resolve, reject){
        fs.readFile(path.join(__dirname, '../xmlFiles/FetchTestSuites.xml'), function(err, data) {
            if (err) reject(err);
            parser.parseString(data, function (err, result) {
                if (err) reject(err);
                try {
                    let IDsArray = suitesIDsArray.map(suit => {
                        return {
                            "$": {
                                "Id": suit
                            }
                        }
                    });
                    result['soap12:Envelope']['soap12:Body'][0]['FetchTestSuites'][0]['suiteIds'][0]['IdAndRev'] = IDsArray;
                    resultObj = builder.buildObject(result); 
                } catch (error) {
                    reject('Error occured during building test suite xml body for request \n' + error);
                }
                resolve(resultObj);
            });
        });
    })
};

function getFetchTestCasesXML(casesIDsArray){
    return new Promise(function(resolve, reject){
        fs.readFile(path.join(__dirname, '../xmlFiles/FetchTestCases.xml'), function(err, data) {
            if (err) reject(err);
            parser.parseString(data, function (err, result) {
                if (err) reject(err);
                try {
                    result['soap12:Envelope']['soap12:Body'][0]['PageWorkitemsByIds'][0]['ids'][0]['int'] = casesIDsArray;
                    resultObj = builder.buildObject(result); 
                } catch (error) {
                    reject('Error occured during building test cases xml body for request \n' + error);
                }
                resolve(resultObj);
            });
        });
    })
};

function parseTestPlanResponse(response){
    return new Promise(function(resolve, reject){
        parser.parseString(response, function (err, result) {
            if (err) reject(err);
            let testPlanID = _.get(result, "['soap:Envelope']['soap:Body'][0]['FetchTestPlansResponse'][0]['FetchTestPlansResult'][0]['TestPlan'][0]['$']['PlanId']");
            let testPlanName = _.get(result, "['soap:Envelope']['soap:Body'][0]['FetchTestPlansResponse'][0]['FetchTestPlansResult'][0]['TestPlan'][0]['$']['Name']");
            let rootSuiteId = _.get(result, "['soap:Envelope']['soap:Body'][0]['FetchTestPlansResponse'][0]['FetchTestPlansResult'][0]['TestPlan'][0]['$']['RootSuiteId']");
            if (!testPlanID || !testPlanName || !rootSuiteId) reject('Error occured during parsing test plan xml response\n');
            resolve({
                testPlanID: testPlanID,
                testPlanName: testPlanName,
                rootSuiteId: rootSuiteId
            });
        });
    });
};

function parseTestSuitesResponse(response){
    return new Promise(function(resolve, reject){
            parser.parseString(response, function (err, result) {
                if (err) reject(err);
                let responseArr = [];
                try {
                    let suitesDataArray = _.get(result, "['soap:Envelope']['soap:Body'][0]['FetchTestSuitesResponse'][0]['FetchTestSuitesResult'][0]['ServerTestSuite']");
                    
                    if (suitesDataArray) {
                        suitesDataArray.forEach(function(suit){
                            let suitID = _.get(suit, "['$']['Id']");
                            let suitName = _.get(suit, "['$']['Title']");
                            
                            let childrenSuits = [];
                            let childrenTestCases = [];
        
                            let entries = _.get(suit, "['ServerEntries'][0]['TestSuiteEntry']");
                            if (entries){
                                entries.forEach(function(entry){
                                    let testCaseId = _.get(entry, "['PointAssignments'][0]['TestPointAssignment'][0]['$']['TestCaseId']");
                                    if (testCaseId){
                                        childrenTestCases.push(testCaseId);
                                    } else {
                                        let childrenTestSuit = _.get(entry, "['$']['EntryId']");
                                        childrenSuits.push(childrenTestSuit);
                                    }
                                })
                            }
                            
                            responseArr.push({
                                suitID: suitID,
                                suitName: suitName,
                                childrenSuits: childrenSuits,
                                childrenTestCases: childrenTestCases
                            });
    
                        });
                    }
                } catch (error) {
                    reject('Error occured during parsing test suites xml response\n' + error);
                }
                resolve(responseArr);
            });
    });
};

function parseTestCasesResponse(response){
    return new Promise(function(resolve, reject){
            parser.parseString(response, function (err, result) {
                if (err) reject(err);
                let responseArr = [];
                try {
                    let suitesDataArray = _.get(result, "['soap:Envelope']['soap:Body'][0]['PageWorkitemsByIdsResponse'][0]['items'][0]['table'][0]['rows'][0]['r']");
                    responseArr = suitesDataArray.map(obj => {
                        return {
                            testCaseId: obj.f[0],
                            automation: obj.f[1],
                            priority: obj.f[2]
                        }
                    });
                } catch (error) {
                    reject('Error occured during parsing test cases xml response\n' + error);
                }
                resolve(responseArr);
            });
    });
};

module.exports = {
    getFetchTestPlansXML,
    getFetchTestSuitesXML,
    getFetchTestCasesXML,
    parseTestSuitesResponse,
    parseTestPlanResponse,
    parseTestCasesResponse
}