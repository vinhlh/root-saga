import React, { Component } from 'react';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import createSagaMiddleware from 'redux-saga';
import { all, fork, takeEvery, spawn } from 'redux-saga/effects';
import { createLogger } from 'redux-logger';

const sagaMiddleware = createSagaMiddleware({
  onError: error => {
    console.warn('Uncaught error', error);
  }
});
const logger = createLogger();

const helloAction = {
  type: 'hello'
};

const rootReducer = state => state;

const makeBrokenSaga = groupNumber => () => {
  throw new Error(`Something wrong happened! (${groupNumber})`);
};

const makeLogToScreenSaga = groupNumber => action => {
  console.warn(`Log from saga (${groupNumber}) => `, action);
};

const getSagas = groupNumber => [
  takeEvery(helloAction.type, makeLogToScreenSaga(groupNumber)),
  takeEvery(helloAction.type, makeBrokenSaga(groupNumber))
];

function* parallelSaga() {
  yield all(getSagas(1));
}

const spawnSaga = saga =>
  spawn(function*() {
    yield saga;
  });

function* failureToleranceSaga() {
  yield all(getSagas(2).map(spawnSaga));
}

class App extends Component {
  constructor() {
    super();

    this.store = createStore(
      rootReducer,
      {},
      applyMiddleware(sagaMiddleware, logger)
    );

    sagaMiddleware.run(parallelSaga);
    sagaMiddleware.run(failureToleranceSaga);
  }

  componentDidMount() {
    this.sayHello();
  }

  sayHello = () => {
    this.store.dispatch(helloAction);
  };

  render() {
    return (
      <Provider store={this.store}>
        <button onClick={this.sayHello}>Say hello</button>
      </Provider>
    );
  }
}

export default App;
