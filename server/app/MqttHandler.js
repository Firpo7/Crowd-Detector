const mqtt = require('mqtt');

class MqttHandler {
  constructor(host) {
    this.mqttClient = null;
    this.host = (host || 'mqtt://localhost');
  }
  
  connect() {
    // Connect mqtt
    this.mqttClient = mqtt.connect(this.host);

    // Mqtt error calback
    this.mqttClient.on('error', (err) => {
      console.log(err);
      this.mqttClient.end();
    });

    // Connection callback
    this.mqttClient.on('connect', () => {
      console.log(`mqtt client connected`);
    });

    this.mqttClient.on('close', () => {
      console.log(`mqtt client disconnected`);
    });
  }

  // mqtt subscriptions
  subscribe(topic) {
    this.mqttClient.subscribe(topic, {qos: 0});
    console.log("SUBSCRIBED TO " + topic)
  }

  // Sends a mqtt message to topic: mytopic
  sendMessage(topic, message) {
    console.log(`TOPIC: ${topic}  -  sending message: ${message}`)
    this.mqttClient.publish(topic, message);
  }
}

module.exports = MqttHandler;