# Crowd Detector

Crowd Detector is a project aimed to provide updates about the number of people in rooms of different buildings. Each person must have a bluetooth beacon with him (it could be for example a bracelet or a phone).

The server exposes a REST API. In this repo is provided a program that interact with it and ready to be deployed on a raspberry, with a bluetooth module, installed in a room.

## Installation

### Server:
* ```git clone``` this repo

  docker:
  * run ```docker-compose up``` inside the cloned folder
  
  standalone:
  ```
  cd server/app
  npm install
  node main.js
  ```

DB connection configuration is taken from environment, in the docker installation it is taken from the ```.env``` file.

To initialize the database run:
```
cd db/
psql -h $DBHOST -p $DBPORT -d $DBNAME -U $DBUSER
```

Insert the $DBPASSWORD, then:
```
$DBNAME=# \i create-and-populate-db.sql
```

### Sensor:
The code for the sensor was implemented and run on a Raspberry Pi 4:
* ```git clone``` this repo
* ```cd sensor``` to change directory
* run ```chmod u+x configure_rpi.sh``` to give the execute permission
* run ```./configure_rpi.sh``` to initialize the environment
* run ```npm install``` to get all the packages needed
* run ```node sensor/sensor.js```

For the registration to the server the node needs to have a valid token. Remember to fill the `.env` file with your configurations.

### Webapp:
* ```git clone``` this repo
* run ```npm install``` to get all the packages needed
* ```cd webapp``` to change directory
* run ```npm start```
* open your browser and go to location ```localhost:3000``` to view the webapp

### Bot telegram
* ```git clone``` this repo
* ```cd bot-telegram``` to change directory
* run ```npm install``` to get all the packages needed
* run ```node bot.js```

Remeber to fill with your configurations the `.env` file. Then you can receive real-time information directly on you telegram app when you start the bot.

## Authors
* Tiziano Firpo - [*@Firpo7*](https://github.com/Firpo7)
* Andrea Canepa - [*@A-725-K*](https://github.com/A-725-K)