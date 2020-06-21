const { Client } = require('pg');
const redis = require('redis')
const mqttHandler = require('./MqttHandler')

var mqttClient = new mqttHandler('ws://localhost:3000');
mqttClient.connect();

var topic_subscribed = new Set()

const port_redis = process.env.REDIS_PORT || 6379;
const redis_client = redis.createClient(port_redis);

var APIconstants = require('./APIConstants').constants;

var knex = require('knex')({
  client: 'pg',
  connection: {
    host : process.env.DBHOST,
    user : process.env.DBUSER,
    password : process.env.DBPASSWORD,
    database : process.env.DBNAME
  }
});

function S4() {
  return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}

function generateRandomID() {
  return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
}


function subscribeToTopic(topic) {
  if(!(topic in topic_subscribed)) {
    mqttClient.subscribe(topic)
    topic_subscribed.add(topic)
  }
}

async function publishOnMqtt(public_id, dataCurrent, dataNew) {
  subscribeToTopic(public_id)
  mqttClient.sendMessage(public_id, JSON.stringify({
    'public_id': public_id,
    'current_people': dataCurrent,
    'new_people': dataNew
  }))
}

function insertDataIntoDB(res, table, data, ret) {
  knex.insert(data).into(table).then(() => {
    res.send({code: APIconstants.API_CODE_SUCCESS, ...ret})
  }).catch((err) => {
    res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err)
  })
}

function insertNewNodeDB(res, name, max_people, type, floor, building) {
  let publicID = generateRandomID()
  let privateID = generateRandomID()
  insertDataIntoDB(res, 'sensor', {
    'public_id' : publicID,
    'private_id' : privateID,
    'name' : name,
    'maxpeople' : max_people,
    'floor' : floor,
    'roomtype' : type,
    'building' : building,
  }, {id: privateID})
}

function insertNewBuildingDB(res, name, address, numFloors) {
  insertDataIntoDB(res, 'building', {
    'name' : name,
    'address' : address,
    'numfloors' : numFloors
  });
}

function deleteBuildingDB(res, name) {
  knex("building").where('name', name).del().then(() => {
    res.send({code: APIconstants.API_CODE_SUCCESS})
  }).catch((err) => {
    res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err)
  })
}

function deleteNodeDB(res, private_id) {
  knex('sensor').where('private_id', private_id).del().then(() => {
    res.send({code: APIconstants.API_CODE_SUCCESS})
  }).catch((err) => {
    res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err)
  })
}

function insertIntoDBAndPublishMqtt(res, public_id, dataCurrent, dataNew) {
  let data = {
    'sensor_id': public_id,
    'time': new Date(),
    'current_people': dataCurrent,
    'new_people': dataNew
  };

  knex.insert(data).into('sensor_data').then(() => {
    res.send({code: APIconstants.API_CODE_SUCCESS})
    publishOnMqtt(public_id, dataCurrent, dataNew)
  }).catch((err) => {
    res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err)
  })

}

function insertSensorDataDB(res, private_id, dataCurrent, dataNew) {
  redis_client.get(private_id, (err, public_id) => {
    if (err) { res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err) }

    //if no match found in redis
    if (public_id != null) {
      insertIntoDBAndPublishMqtt(res, public_id, dataCurrent, dataNew)
    } else {
      knex.select('public_id').from('sensor').where('private_id', private_id).then((rows) => {
        let public_id = rows[0].public_id
        redis_client.setex(private_id, 36000, public_id);
        insertIntoDBAndPublishMqtt(res, public_id, dataCurrent, dataNew)
      }).catch((err) => { res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err) })
    }
  });
}


function registerNewNodeController(req, res) {
  if( !( req.body.name && typeof(req.body.name)==='string' ) ||
      !( req.body.max_people && typeof(req.body.max_people)==='string' ) ||
      !( req.body.type && typeof(req.body.type)==='string' ) ||
      !( req.body.floor && typeof(req.body.floor)==='string' ) ||
      !( req.body.building && typeof(req.body.building)==='string' )) {
        res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
        return
  }
  insertNewNodeDB(res, req.body.name, req.body.max_people, req.body.type, req.body.floor, req.body.building)
}

function registerNewBuildingController(req, res) {
  if( !( req.body.name && typeof(req.body.name)==='string' ) ||
      !( req.body.address && typeof(req.body.address)==='string' ) ||
      !( req.body.numFloors && typeof(req.body.numFloors)==='string' )) {
        res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
        return
  }
  insertNewBuildingDB(res, req.body.name, req.body.address, req.body.numFloors)
}

function deleteBuildingController(req, res) {
  if( !( req.body.name && typeof(req.body.name)==='string' ) ) {
    res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
    return
  }
  deleteBuildingDB(res, req.body.name)
}

function deleteNodeController(req, res) {
  if( !( req.body.id && typeof(req.body.id)==='string' ) ) {
    res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
    return
  }
  deleteNodeDB(res, req.body.id)
}

function updateCrowdController(req, res) {
  if( !( req.body.id && typeof(req.body.id)==='string' ) ||
      !( req.body.current && typeof(req.body.current)==='string' ) ||
      !( req.body.new && typeof(req.body.new)==='string' )) {
        res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
        return
  }

  insertSensorDataDB(res, req.body.id, req.body.current, req.body.new)
}


async function manageAdminRequests(req, res, callback) {
  let token = req.body.token
  if(!token) { res.send({ code: APIconstants.API_CODE_UNAUTHORIZED_ACCESS }); return}

  knex.select('validity').from('token').where('token', token).then((rows) =>{
    if(!rows.length && new Date(rows[0].validity) < new Date()) { res.send({ code: APIconstants.API_CODE_UNAUTHORIZED_ACCESS }); return }
      callback(req, res)
  }).catch((err) => { res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err) })
}


exports.updateCrowd = updateCrowdController;
exports.deleteNode = deleteNodeController;
exports.deleteBuilding = deleteBuildingController;
exports.registerNewNode = registerNewNodeController;
exports.registerNewBuilding = registerNewBuildingController;
exports.manageAdminRequests = manageAdminRequests;
