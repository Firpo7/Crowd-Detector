const express = require('express')
const bodyParser = require('body-parser')
const ws = require('websocket-stream');
const ClientAPI = require('./APIClient')
const ServerAPI = require('./APIServer')
const APIconstants = require('./Constants').APIConstants

const aedes = require("aedes")();


const app = express();
var httpServer = require("http").createServer(app);
ws.createServer({ server: httpServer }, aedes.handle);
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
const port = process.env.PORT || 3000;

function endpointLogger() {
  return (req, _, next) => {
    console.log('Endpoint:', req.url)
    next()
  }
}

app.use(endpointLogger())

app.get(APIconstants.API_ENDPOINT_GETNODES, (req, res) => {
  ClientAPI.getNodes(req, res)
})

app.get(APIconstants.API_ENDPOINT_GET_BUILDINGS, (req, res) => {
  ClientAPI.getBuildings(req, res)
})

app.get(APIconstants.API_ENDPOINT_GET_STAT, (req, res) => {
  ClientAPI.getStatistics(req, res)
})

app.get(APIconstants.API_ENDPOINT_GET_SIMPLE_STAT, (req, res) => {
  ClientAPI.getSimpleStatistics(req, res)
})


app.post(APIconstants.API_ENDPOINT_REGISTER_NEW_NODE, (req, res) => {
  ServerAPI.manageAdminRequests(req, res, ServerAPI.registerNewNode)
})

app.post(APIconstants.API_ENDPOINT_REGISTER_NEW_BUILDING, (req, res) => {
  ServerAPI.manageAdminRequests(req, res, ServerAPI.registerNewBuilding)
})

app.post(APIconstants.API_ENDPOINT_DELETE_BUILDINGS, (req, res) => {
  ServerAPI.manageAdminRequests(req, res, ServerAPI.deleteBuilding)
})

app.post(APIconstants.API_ENDPOINT_DELETE_NODE, (req, res) => {
  ServerAPI.deleteNode(req, res)
})

app.post(APIconstants.API_ENDPOINT_UPDATE_CROWD, (req, res) => {
  ServerAPI.updateCrowd(req, res)
})

httpServer.listen(port, () => {
  console.log(`listening on port ${ port }`);
});
