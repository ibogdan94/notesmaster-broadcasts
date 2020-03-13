const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { readdirSync, statSync } = require('fs');
const { join } = require('path');

const { mount } = require('./lib/server/rest/connectionsapi');
const WebRtcConnectionManager = require('./lib/server/connections/webrtcconnectionmanager');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const routesDirectory = join(__dirname, 'routes');

const examples = readdirSync(routesDirectory).filter(path =>
  statSync(join(routesDirectory, path)).isDirectory());

function setupRoute(route) {
  const path = join(routesDirectory, route);

  const serverPath = join(path, 'server.js');
  const options = require(serverPath);
  const connectionManager = WebRtcConnectionManager.create(options);
  mount(app, connectionManager, `/${route}`);

  return connectionManager;
}

const connectionManagers = examples.reduce((connectionManagers, route) => {
  const connectionManager = setupRoute(route);
  return connectionManagers.set(route, connectionManager);
}, new Map());

const server = app.listen(3001, () => {
  const address = server.address();
  console.log(`http://localhost:${address.port}\n`);

  server.once('close', () => {
    connectionManagers.forEach(connectionManager => connectionManager.close());
  });
});
