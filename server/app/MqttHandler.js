const mqtt = require('mqtt');

class MqttHandler {
  constructor(host) {
    this.mqttClient = null;
    this.host = (host || 'mqtt://localhost');
    //this.username = 'YOUR_USER'; // mqtt credentials if these are needed to connect
    //this.password = 'YOUR_PASSWORD';
  }
  
  connect() {
    // Connect mqtt with credentials (in case of needed, otherwise we can omit 2nd param)
    this.mqttClient = mqtt.connect(this.host)//, { username: this.username, password: this.password });

    // Mqtt error calback
    this.mqttClient.on('error', (err) => {
      console.log(err);
      this.mqttClient.end();
    });

    // Connection callback
    this.mqttClient.on('connect', () => {
      console.log(`mqtt client connected`);
    });

    // When a message arrives, console.log it
    this.mqttClient.on('message', function (topic, message) {
      console.log(topic.toString() + " - " + message.toString());
    });

    this.mqttClient.on('close', () => {
      console.log(`mqtt client disconnected`);
    });
  }

  subscribe(topic) {
    // mqtt subscriptions
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