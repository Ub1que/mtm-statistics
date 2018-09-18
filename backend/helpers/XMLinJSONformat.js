const fetchTestPlans = {
  "soap12:Envelope": {
    "$": {
      "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      "xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
      "xmlns:soap12": "http://www.w3.org/2003/05/soap-envelope"
    },
    "soap12:Body": [
      {
        "FetchTestPlans": [
          {
            "$": {
              "xmlns": "http://schemas.microsoft.com/TeamFoundation/2007/02/TCM/TestResults/01"
            },
            "idsToFetch": [
              {
                "IdAndRev": [
                  {
                    "$": {
                      "Id": "int"
                    }
                  },
                  {
                    "$": {
                      "Id": "int"
                    }
                  }
                ]
              }
            ],
            "projectName": [
              "projectName"
            ]
          }
        ]
      }
    ]
  }
};

const fetchTestSuites = {
  "soap12:Envelope": {
    "$": {
      "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      "xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
      "xmlns:soap12": "http://www.w3.org/2003/05/soap-envelope"
    },
    "soap12:Body": [
      {
        "FetchTestSuites": [
          {
            "$": {
              "xmlns": "http://schemas.microsoft.com/TeamFoundation/2007/02/TCM/TestResults/01"
            },
            "teamProjectName": [
              "projectName"
            ],
            "suiteIds": [
              {
                "IdAndRev": [
                  {
                    "$": {
                      "Id": "int"
                    }
                  },
                  {
                    "$": {
                      "Id": "int"
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
};

module.exports = {fetchTestPlans, fetchTestSuites}