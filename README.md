# Crowd Detector

Crowd Detector is a project aimed to provide updates about the number of people in rooms of different buildings. Each person must have a bluetooth beacon with him (it could be for example a bracelet or a phone).

The server exposes a REST API. In this repo is provided a program that interact with it and ready to be deployed on a raspberry, with a bluetooth module, installed in a room.

## Installation

### Server:
* ```git clone``` this repo

  docker:
  * run ```docker-compose up``` inside the cloned folder
  
  standalone:
  * ```cd server/app```
  * ```npm install```
  * ```node main.js```

DB connection configuration is taken from environment, in the docker installation it is taken from the ```.env``` file.

To initialize the database run:
* ```cd db/```
* ```psql -h $DBHOST -p $DBPORT -d $DBNAME -U $DBUSER```

Insert the $DBPASSWORD, then:
* ```$DBNAME=# \i create-and-populate-db.sql```

### Sensor:
* ```git clone``` this repo
* run ```node raspberry/bluetooth.js```

For the registration to the server the node needs to have a valid token.


## Authors
* Tiziano Firpo - [*@Firpo7*](https://github.com/Firpo7)
* Andrea Canepa - [*@A-725-K*](https://github.com/A-725-K)