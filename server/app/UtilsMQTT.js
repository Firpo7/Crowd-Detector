const UtilsDB = require('./UtilsDB')
const mqttHandler = require('./MqttHandler')


const port = process.env.PORT || 3000;
var mqttClient = new mqttHandler(`ws://localhost:${port}`);
mqttClient.connect();
mqttClient.subscribe("ALERTS")

async function publishOnMqtt(topic, data) {
  mqttClient.sendMessage(topic, JSON.stringify(data));
}

function publishSensorDataOnMqtt(public_id, data) {
  UtilsDB.getNodeFromDB(public_id)
  .then((sensor_info) => {
    console.log(JSON.stringify(sensor_info))
    if(sensor_info.maxpeople <= data.current_people) {
      delete sensor_info.private_id
      data = {...data, ...sensor_info}
      publishOnMqtt("ALERTS", data)
    }
  })
}

exports.publishSensorDataOnMqtt = publishSensorDataOnMqtt;