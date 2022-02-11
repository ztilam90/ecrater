import React from "react"
import ReactDOM from 'react-dom'
import { App } from './App'
import { constants } from './common/constants'

if (constants.isDevMode) {
    if (!localStorage.getItem('session')) localStorage.setItem('session', `{"user":{"username":"${constants.defaultUser.username}"},"id":"${constants.defaultUser.id}"}`)
}

ReactDOM.render(<App />, document.getElementById('root'))

