import React from 'react';
import Tree, { TreeNode } from 'rc-tree';
import 'rc-tree/assets/index.css';
import _ from 'lodash';
import immutable from 'object-path-immutable'
import 'bootstrap/dist/css/bootstrap.css'
import PieChart from 'react-minimal-pie-chart';
require('isomorphic-fetch');
require('es6-promise').polyfill();

const fetchTestPlans = (testPlansArray, username, password) => {
  return fetch('http://localhost:3005/fetchTestPlans',{
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      keysArray: testPlansArray,
      username: username,
      password: password
    })
  })
  .then(result => {return result.text()})
  .then(resultText => {
    return JSON.parse(resultText);
  })
  .catch(err => console.log(err));
};

const fetchTestSuites = (suitsArray, username, password) => {
  return fetch('http://localhost:3005/fetchTestSuites',{
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      keysArray: suitsArray,
      username: username,
      password: password
    })
  })
  .then(result => {return result.text()})
  .then(resultText => {
    let resultObj = JSON.parse(resultText);
    return _.get(resultObj,'resultArray');
  })
  .catch(err => console.log(err));
};

const fetchTestCasesChunk = (testCases, username, password) => {
  return new Promise(resolve => {
    setTimeout(()=>{
      return fetch('http://localhost:3005/fetchTestCases',{
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testCases: testCases,
          username: username,
          password: password
        })
      })
      .then(result => {return result.text()})
      .then(resultText => {
        let resultObj = JSON.parse(resultText);
        // return _.get(resultObj,'resultArray');
        resolve(_.get(resultObj,'resultArray'));
      })
      .catch(err => console.log(err));
    },200);
  });

};

const chunkArray = (arr, chunk_size) => {
  var results = [];
  
  while (arr.length) {
      results.push(arr.splice(0, chunk_size));
  }
  
  return results;
}

const fetchTestCases = (testCases, username, password) => {
  return new Promise((resolve, reject) => {
    let testCasesByChunks = chunkArray(testCases, 200);
  
    let resultArray = [];
    testCasesByChunks.reduce(
      (p, chunk) =>
        p.then(_ => {
          return fetchTestCasesChunk(chunk, username, password)
            .then((currentResult)=>{
              resultArray = resultArray.concat(currentResult);
            })
        }),
      Promise.resolve()
    ).then(_ => {
      resolve(resultArray);
    });
  })
};

const getObjPath = function(state, value){
  const searchTree = function(state, value) {
    if (state.suitID === value) {
        return [];
    } else if (state.childrenSuits) {
        for (var i = 0; i < state.childrenSuits.length; i++) {
            var path = searchTree(state.childrenSuits[i], value);
            if (path !== null) {
                path.unshift(i);
                return path;
            }
        }
    }
    return null;
  };
  
  let pathArray = searchTree(state, value);
  let path = '';

  pathArray.forEach(element => {
    path = path + '.childrenSuits.'+ element;
  });
  return path;
};

export default class TestPlanTree extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      creds: {},
      checkedIDs: [],
      prevExpandedKeys: [],
      testPlan: {
        testPlanID: '',
        testPlanName: '',
        childrenSuits: []
      }
    }
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  onLoadData = (treeNode) => {
    console.log('treeNode\n', treeNode);
    let path = getObjPath(this.state.testPlan, treeNode.props.eventKey);
    let childrenSuits = _.get(this.state, `testPlan${path}.childrenSuits`);
    if (typeof childrenSuits[0] === 'string') {
      return fetchTestSuites(childrenSuits, this.refs.username.value, this.refs.password.value)
        .then(childrenSuitsResult => {
          this.setState((prevState) => {
            return immutable.set(prevState, `testPlan${path}.childrenSuits`, childrenSuitsResult);
          });
        })
        .catch(err => console.log(err));
    }
  };

  onCheck = (checkedKeys, info) => {
    this.setState({
      checkedIDs: checkedKeys
    });
  };

  onGetState = () => {
    console.log(this.state);
  };

  onShowCoverageClick = () => {
    
    const getCheckedNodesTestCases = (checkedIDs) => {
      let testCases = [];
      let alreadyChecked = [];
      checkedIDs.forEach(node => {
        var path;
        if (typeof node === 'string') {
          path = getObjPath(this.state.testPlan, node);
        } else {
          path = getObjPath(this.state.testPlan, node.suitID);
        }

        let childrenTestCases = _.get(this.state, `testPlan${path}.childrenTestCases`);
        let childrenSuits = _.get(this.state, `testPlan${path}.childrenSuits`);

        testCases = testCases.concat(childrenTestCases);
        if (childrenSuits.length > 0) {
          testCases = testCases.concat(getCheckedNodesTestCases(childrenSuits));
        }
        alreadyChecked.push(node.suitID);

      });
      return [...new Set(testCases)];
    };

    const buildCheckedNodesTree = (parentSuitsIDs) => {

      //gather all children suits to fetch them once
      const getParentSuitsChildrenSuits = parentSuitsIDs => {
        let filteredChildrenNodes = [];
        parentSuitsIDs.forEach(nodeID => {
          let path = getObjPath(this.state.testPlan, nodeID);
          let childrenSuits = _.get(this.state, `testPlan${path}.childrenSuits`);
          if (childrenSuits.length > 0 && typeof childrenSuits[0] === 'string') {
            filteredChildrenNodes = filteredChildrenNodes.concat(childrenSuits);
          }
        });
        return filteredChildrenNodes;
      };

      let parentChildrenSuits = getParentSuitsChildrenSuits(parentSuitsIDs);

      return fetchTestSuites(parentChildrenSuits, this.refs.username.value, this.refs.password.value)
        .then(childrenSuitsResult => {
          //for each checked node replace array of objects and return immutable state
          let state = Object.assign({}, this.state);
          parentSuitsIDs.forEach(parentSuitId => {
            let path = getObjPath(this.state.testPlan, parentSuitId);
            let childrenSuits = _.get(this.state, `testPlan${path}.childrenSuits`);

            //get array of one checked children nodes and generate immutable state
            if (childrenSuits.length > 0 && typeof childrenSuits[0] === 'string') {
              let currentParentNodeChildrenNodes = childrenSuitsResult.filter(suit => {
                return childrenSuits.includes(suit.suitID);
              });
              
              state = immutable.set(state, `testPlan${path}.childrenSuits`, currentParentNodeChildrenNodes);
            }
          })
          //here children suits become parent suits for next fetch
          return {
            state: state,
            nextParentSuitsIDs: parentChildrenSuits
          };
        })
        .then((data) => {

          this.setState(data.state, () => {
            if (data.nextParentSuitsIDs.length > 0) {
              buildCheckedNodesTree(data.nextParentSuitsIDs);
            } else {
              fetchTestCases(getCheckedNodesTestCases(this.state.checkedIDs), this.refs.username.value, this.refs.password.value)
                .then((result)=> {
                  console.log('final result in button\n', result);
                })
            }
          });
        });
    };

    buildCheckedNodesTree(this.state.checkedIDs)
      .catch(err => console.log(err));
  };

  handleSubmit(event) {
    event.preventDefault();
    if (this.state.testPlan.testPlanID === '') {
      fetchTestPlans([this.refs.testplan.value.toString()], this.refs.username.value, this.refs.password.value)
      .then(testPlanResponse => {
        return fetchTestSuites([testPlanResponse.rootSuiteId], this.refs.username.value, this.refs.password.value)
          .then(result => {
            this.setState({
              testPlan: {
                testPlanID: testPlanResponse.testPlanID,
                testPlanName: testPlanResponse.testPlanName,
                childrenSuits: result
              }
            });
          });
      })
      .catch(err => console.log(err));
    }
  }

  render() {
    const generateTreeFrom = suitsArray => {
      return suitsArray.map(suit => {
        if (typeof suit === 'object') {
          return <TreeNode
            isLeaf={suit.childrenSuits.length !== 0 ? false : true}
            title={suit.suitName}
            key={suit.suitID}
          >
            {generateTreeFrom(suit.childrenSuits)}
          </TreeNode>
        }
        return null;
      });
    };

    const generateTree = this.state.testPlan.childrenSuits.map(suit => {
      return  <TreeNode isLeaf={false} title={this.state.testPlan.testPlanName} key={suit.suitID}>
                {generateTreeFrom(suit.childrenSuits)}
              </TreeNode>
    });

    return (
      <div style={{ margin: '15px 30px' }}>
        <div className="row">
          <div className="sidebar" style={{float: 'left', 'minWidth': '300px', 'maxWidth': '500px'}}>
            <form onSubmit={ this.handleSubmit }>
              <div className="form-group">
                <input className="form-control" placeholder="Username" ref="username" />
                <input className="form-control" placeholder="Password" type="password" ref="password" />
                <input className="form-control" placeholder="TestPlan (default: 102)" ref="testplan" />
              </div>
              <button className="btn btn-success">Submit</button>
            </form>

            <Tree
              showLine
              checkable
              selectable={ false }
              loadData={this.onLoadData}
              onSelect={this.onSelect}
              onCheck={this.onCheck}
            >
              {generateTree}
            </Tree>
            
            <button className="btn btn-secondary" onClick={this.onShowCoverageClick}> Show Coverage </button>
            <button onClick={this.onGetState}> State </button>
          </div>
          {/* <div className="pagination-centered">
            <PieChart 
              data={[
                { title: 'One', value: 10, color: '#E38627'},
                { title: 'Two', value: 15, color: '#C13C37'},
                { title: 'Three', value: 20, color: '#6A2135'},
              ]}
              style={{ height: '300px' }}
              lineWidth={15}
            />
          </div> */}
        </div>
      </div>
    );
  }
}
