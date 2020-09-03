# Sensor

This part of the project has been developed and run on a ***Raspberry PI 4*** sensor. Its purpose is to detect the people present in an area and to update the count of the people in the database on the server thanks to the *bluetooth* technology.

It relies on two libraries that you can find on github:

- [@abandonware/noble](https://github.com/abandonware/noble#scanning-and-discovery)

- [node-bluetooth](https://github.com/song940/node-bluetooth)


## Instructions
First of all you have to run the `configure_rpi.sh` script in order to prepare the Raspberry to become operating simply doing:
```
chmod u+x configure_rpi.sh
./configure_rpi.sh
```
N.B. it require administrative privileges for some of the commands during the configuration and it needs `sudo`.

The script installs all dependencies and creates a `.env` file that the user has to configure depending on her needs before launching the *Node.js* main program.

Then you can launch the main script to start gather and send data:
```
node bluetooth.js
```

Otherwise, if you are intereseted to populate the databse on the server with some sample data (useful for instance during the developement phase) you have to fire the following commands:
```
npm install
node DIBRIS_simulator.js
```

### First run VS other runs
The first time you run `bluetooth.js`, it registers the sensor on the server. You have to take a look to the *standard output* on the terminal to retrieve the `private_id` of the sensor in order to communicate with the API. You can store that value in the correspondent field in the `.env` file to ease the following runs if the sensor is stopped for whatever reason(s). Otherwise, you have to register again with a different name the sensor.
