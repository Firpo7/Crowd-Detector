const UtilsDB = require('./UtilsDB')
const mqttHandler = require('./MqttHandler')


const port = process.env.SERVER_PORT || 3000;
var mqttClient = new mqttHandler(`ws://localhost:${port}`);
mqttClient.connect();

var topic_subscribed = new Set();

function subscribeToTopic(topic) {
  if(!(topic in topic_subscribed)) {
    mqttClient.subscribe(topic)
    topic_subscribed.add(topic)
  }
}

async function publishOnMqtt(topic, data) {
  let toPromise = function(resolve, reject) {
    subscribeToTopic(topic)
    mqttClient.sendMessage(topic, JSON.stringify(data));
    resolve()
  }
  return new Promise(toPromise)
}

function publishSensorDataOnMqtt(public_id, data) {
  UtilsDB.getNodeFromDB(public_id)
  .then((sensor_info) => {
    data = {...data, name: sensor_info.name}
    publishOnMqtt(sensor_info.building+"-"+sensor_info.floor, data)
    publishOnMqtt(sensor_info.building+"-"+sensor_info.roomtype, data)
  })
}

exports.publishSensorDataOnMqtt = publishSensorDataOnMqtt;