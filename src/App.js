import React, { Component } from 'react';
import './App.css';
import TestPlanTree from './components/TestPlanTree'

class App extends Component {

  componentDidCatch(error, info) {
    console.log('componentDidCatch\n');
    console.log('error\n', error);
    console.log('info\n', info);
  }

  render() {
    return (
        <TestPlanTree />
    );
  }
}

export default App;
