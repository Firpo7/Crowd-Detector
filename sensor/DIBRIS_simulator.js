'use strict';

const fetch = require('node-fetch');
const { time } = require('cron');
const APIconstants = require('../server/app/Constants').APIConstants;
const ROOMTYPES = Array.from(require('../server/app/Constants').ParamsConstants.ROOMTYPES.keys());
require('dotenv').config();

const SERVER_HOST = process.env.SERVER_HOST || 'localhost'
const SERVER_PORT = process.env.SERVER_PORT || 4000

const API = `http://${SERVER_HOST}:${SERVER_PORT}`;
const DIBRIS = 'DIBRIS-VP';
const APITOKEN = process.env.APITOKEN;


const MAX_PEOPLE_PER_ROOM = {
    'Studying area': 50,
    'Room 710': 90,
    'Room 711': 70,
    'Room 506': 100,
    'Room 505': 60,
    'Library': 10,
    'Studying room': 75,
    'Lab SW-2': 40,
    'Conference room': 80,
    'Office Prof X': 5,
    'Office Prof Y': 5,
    'Office Prof Z': 4,
    'PhD Room': 30,
    'Lab SW-1': 55,
    'Room 216': 45,
    'Room 217': 45,
    'Room 218': 45,
    'Office Prof A': 4,
    'Office Prof B': 6,
    'Office Prof C': 5,
    'Office Prof D': 4,
    'ZenHack Room': 7,
    'Common room 1': 15,
    'Common room 2': 40,
    'Little kitchen': 12
};

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}

function createSensorObj(name, floor, type) {
    return JSON.stringify({
        name: name,
        floor: floor,
        type: type,
        max_people: MAX_PEOPLE_PER_ROOM[name],
        building: DIBRIS,
        token: APITOKEN
    });
}

function createBuildingObj(name, numfloors, address) {
    return JSON.stringify({
        name: name,
        numFloors: numfloors,
        address: address,
        token: APITOKEN
    });
}

function registerBuildings() {
    const buildingsToRegister = [
        createBuildingObj(DIBRIS, 8, 'via Dodecaneso'),
        createBuildingObj('DIBRIS-OP', 6, 'via all Opera Pia'),
        createBuildingObj('CAMPUS SAVONA, PALAZZINA LAGORIO', 2, 'via Magliotto'),
        createBuildingObj('DISTAV', 7, 'corso Europa'),
        createBuildingObj('DIMA', 8, 'via Dodecaneso'),
        createBuildingObj('DIFI', 8, 'via Dodecaneso'),
        createBuildingObj('DCCI', 8, 'via Dodecaneso'),
        createBuildingObj('DAFIST', 8, 'Via Balbi, 2'),
    ];

    const promises = [];
    buildingsToRegister.forEach(b => {
        promises.push(
            fetch(API + APIconstants.API_ENDPOINT_REGISTER_NEW_BUILDING,
                {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: b
                })
            .then(res => res.json())
            .then(data => {
                if (data.code !== 42) {
                    console.log('ERROR_B:', data.code, 'COULD NOT REGISTER ->', b);
                    return;
                }
            })
            .catch(err => console.log(err))
        );
    });
    
    return Promise.all(promises);
}

function registerSensorsAndGetPrivateIds() {
    const sensorsToRegister = [
        createSensorObj('Studying area', 7, ROOMTYPES[5]),
        createSensorObj('Room 710', 7, ROOMTYPES[0]),
        createSensorObj('Room 711', 7, ROOMTYPES[0]),
        createSensorObj('Room 506', 5, ROOMTYPES[0]),
        createSensorObj('Studying area', 5, ROOMTYPES[5]),
        createSensorObj('Room 505', 5, ROOMTYPES[0]),
        createSensorObj('Library', 4, ROOMTYPES[1]),
        createSensorObj('Studying room', 4, ROOMTYPES[5]),
        createSensorObj('Lab SW-2', 3, ROOMTYPES[6]),
        createSensorObj('Conference room', 3, ROOMTYPES[4]),
        createSensorObj('Office Prof X', 3, ROOMTYPES[2]),
        createSensorObj('Office Prof Y', 3, ROOMTYPES[2]),
        createSensorObj('Office Prof Z', 3, ROOMTYPES[2]),
        createSensorObj('PhD Room', 3, ROOMTYPES[2]),
        createSensorObj('Lab SW-1', 2, ROOMTYPES[6]),
        createSensorObj('Room 216', 2, ROOMTYPES[0]),
        createSensorObj('Room 217', 2, ROOMTYPES[0]),
        createSensorObj('Room 218', 2, ROOMTYPES[0]),
        createSensorObj('Office Prof A', 2, ROOMTYPES[2]),
        createSensorObj('Office Prof B', 2, ROOMTYPES[2]),
        createSensorObj('Office Prof C', 2, ROOMTYPES[2]),
        createSensorObj('Office Prof D', 2, ROOMTYPES[2]),
        createSensorObj('ZenHack Room', 2, ROOMTYPES[4]),
        createSensorObj('Common room 1', 2, ROOMTYPES[3]),
        createSensorObj('Common room 2', 2, ROOMTYPES[3]),
        createSensorObj('Little kitchen', 2, ROOMTYPES[3])
    ];

    let promises = [];
    sensorsToRegister.forEach(s => {
        promises.push(
            fetch(API + APIconstants.API_ENDPOINT_REGISTER_NEW_NODE,
                {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: s
                })
            .then(res => res.json())
            .then(data => {
                if (data.code !== 42) {
                    console.log('ERROR_S:', data.code, 'COULD NOT REGISTER ->', s);
                    return;
                }

                const sensorName = JSON.parse(s).name; 
                sensors_ids[sensorName] = data.id;
            })
            .catch(err => console.log(err))
        );
    });

    return Promise.all(promises);
}

function createPeopleCountObj(id, currP, newP, time) {
    return JSON.stringify({
        id: id,
        current: currP,
        new: newP,
        time: time
    });
}

function updatePeopleCount(jsonBody) {
    fetch(API + APIconstants.API_ENDPOINT_UPDATE_CROWD,
            {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: jsonBody
            })
            .then(res => res.json())
            .then(data => {
                if (data.code !== 42)
                    console.log('ERROR:', data.code);
            })
            .catch(err => console.log(err));
}

function fillWithSimulatedData() {
    const SW1 = 'Lab SW-1';
    const LC  = 'Little kitchen';
    const CR2 = 'Common room 2';

    const currPeople = Array(3);
    const newPeople = Array(3);
    const adjust = Array(3);  //to simulate a more realistic flow of people

    const thisMonth = new Date().getMonth() + 1; //because it's 0-based numeration
    const yy = 2020;
    for (let MM=thisMonth-1; MM<=thisMonth; MM++) { //last and current
        for (let dd=1; dd<=daysInMonth(MM, yy); dd++) {
            currPeople[0] = getRandomInt(MAX_PEOPLE_PER_ROOM[SW1]);
            currPeople[1] = getRandomInt(MAX_PEOPLE_PER_ROOM[LC]);
            currPeople[2] = getRandomInt(MAX_PEOPLE_PER_ROOM[CR2]);

            for (let hh=8; hh<19; hh++) {    //timetable DIBRIS: 8-19
                for (let mm=0; mm<60; mm+=10) {
                    const coin = getRandomInt(100);
                    for (let i=0; i<adjust.length; i++)
                        adjust[i] = parseInt(currPeople[i]/10) + (coin > 50 ? 1 : 0);
                    
                    currPeople[0] = 
                        coin > 50 ? 
                            (currPeople[0] + adjust[0] > MAX_PEOPLE_PER_ROOM[SW1] ? MAX_PEOPLE_PER_ROOM[SW1] : currPeople[0] + adjust[0]) :
                            (currPeople[0] - adjust[0] < 0 ? 0 : currPeople[0] - adjust[0]);
    
                    currPeople[1] = 
                        coin < 50 ? 
                            (currPeople[1] + adjust[1] > MAX_PEOPLE_PER_ROOM[LC] ? MAX_PEOPLE_PER_ROOM[LC] : currPeople[1] + adjust[1]) :
                            (currPeople[1] - adjust[1] < 0 ? 0 : currPeople[1] - adjust[1]);

                    currPeople[2] = 
                            coin < 50 ? 
                                (currPeople[2] + adjust[2] > MAX_PEOPLE_PER_ROOM[CR2] ? MAX_PEOPLE_PER_ROOM[CR2] : currPeople[2] + adjust[2]) :
                                (currPeople[2] - adjust[2] < 0 ? 0 : currPeople[2] - adjust[2]);
    
                    for (let i=0; i<newPeople.length; i++)
                        newPeople[i] = coin > 50 ? parseInt(currPeople[i]/10) : 0;
    
                    const time = new Date(`${MM}/${dd}/${yy} ${hh}:${mm}`).toISOString();
    
                    updatePeopleCount(createPeopleCountObj(sensors_ids[SW1], currPeople[0], newPeople[0], time));
                    updatePeopleCount(createPeopleCountObj(sensors_ids[LC], currPeople[1], newPeople[1], time));
                    updatePeopleCount(createPeopleCountObj(sensors_ids[CR2], currPeople[2], newPeople[2], time));
                }
            }
        }
    }   
}

// MAIN
const sensors_ids = {};

// START THE SIMULATION
console.log('Registering buildings...');
registerBuildings()
    .then(() => {
        console.log('Registering sensors...');
        registerSensorsAndGetPrivateIds()
            .then(() => {
                console.log('Filling tables with sample data...');
                fillWithSimulatedData();
            })
    })
    .catch(err => console.log(err));
