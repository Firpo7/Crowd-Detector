'use strict';

const fetch = require('node-fetch');
const APIconstants = require('../server/app/APIConstants').constants;

const API = 'http://localhost:3000';
//const API = 'https://iot-proj00.herokuapp.com';
const DIBRIS = 'DIBRIS-VP';
const TOKEN = 'AAAAABBBBBCCCCCDDDDDEEEEE';

const ROOMTYPES = {
    o: 'office',
    lr: 'lecture room',
    cr: 'common room',
    l: 'library',
    sr: 'study room',
    lb: 'laboratory',
    rr: 'reserved room'
};

const sensors_ids = [];

function createSensorObj(name, floor, type, max_people) {
    let pieces = [
        'name=' + name,
        'floor=' + floor,
        'type=' + type,
        'max_people=' + max_people,
        'building=' + DIBRIS,
        'token=' + TOKEN
    ];
    
    return pieces.join('&')
}

function createBuildingObj(name, numfloors, address) {
    let pieces = [
        'name=' + name,
        'numFloors=' + numfloors,
        'address=' + address,
        'token=' + TOKEN
    ];

    return pieces.join('&');
}

function registerBuildings() {
    const buildingsToRegister = [
        createBuildingObj(DIBRIS, 8, 'via Dodecaneso'),
        createBuildingObj('DIBRIS-OP', 6, 'via all\'Opera Pia'),
        createBuildingObj('CAMPUS SAVONA, PALAZZINA LAGORIO', 2, 'via Magliotto'),
        createBuildingObj('DISTAV', 7, 'corso Europa')
    ];

    let toPromise = (resolve, reject) => {
        buildingsToRegister.forEach(b => {
            fetch(API + APIconstants.API_ENDPOINT_REGISTER_NEW_BUILDING,
                {
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    body: b
                })
            .then(res => res.json())
            .then(data => {
                if (data.code !== 42) {
                    console.log('ERROR_B:', data.code, 'COULD NOT REGISTER ->', b);
                    reject(data.code);
                }
                resolve();
            })
            .catch(err => reject(err));
        });
    };
    
    return new Promise(toPromise);
}

function registerSensorsAndGetPrivateIds() {
    const sensorsToRegister = [
        createSensorObj('Studying area', 7, ROOMTYPES['sr'], 50),
        createSensorObj('Room 710', 7, ROOMTYPES['lr'], 90),
        createSensorObj('Room 711', 7, ROOMTYPES['lr'], 70),
        createSensorObj('Room 506', 5, ROOMTYPES['lr'], 100),
        createSensorObj('Studying area', 5, ROOMTYPES['sr'], 50),
        createSensorObj('Room 505', 5, ROOMTYPES['ls'], 60),
        createSensorObj('Library', 4, ROOMTYPES['l'], 10),
        createSensorObj('Studying room', 4, ROOMTYPES['sr'], 75),
        createSensorObj('Lab SW-2', 3, ROOMTYPES['lb'], 40),
        createSensorObj('Conference room', 3, ROOMTYPES['rr'], 80),
        createSensorObj('Office Prof X', 3, ROOMTYPES['o'], 5),
        createSensorObj('Office Prof Y', 3, ROOMTYPES['o'], 5),
        createSensorObj('Office Prof Z', 3, ROOMTYPES['o'], 4),
        createSensorObj('PhD Room', 3, ROOMTYPES['o'], 30),
        createSensorObj('Lab SW-1', 2, ROOMTYPES['lb'], 55),
        createSensorObj('Room 216', 2, ROOMTYPES['lr'], 45),
        createSensorObj('Room 217', 2, ROOMTYPES['lr'], 45),
        createSensorObj('Room 218', 2, ROOMTYPES['lr'], 45),
        createSensorObj('Office Prof A', 2, ROOMTYPES['o'], 4),
        createSensorObj('Office Prof B', 2, ROOMTYPES['o'], 6),
        createSensorObj('Office Prof C', 2, ROOMTYPES['o'], 5),
        createSensorObj('Office Prof D', 2, ROOMTYPES['o'], 4),
        createSensorObj('ZenHack Room', 2, ROOMTYPES['rr'], 7),
        createSensorObj('Common room 1', 2, ROOMTYPES['cr'], 15),
        createSensorObj('Common room 2', 2, ROOMTYPES['cr'], 40),
        createSensorObj('Little kitchen', 2, ROOMTYPES['cr'], 12)
    ];

    let promises = [];
    sensorsToRegister.forEach(s => {
        promises.push(
            fetch(API + APIconstants.API_ENDPOINT_REGISTER_NEW_NODE,
                {
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    body: s
                })
            .then(res => res.json())
            .then(data => {
                if (data.code !== 42) {
                    console.log('ERROR_S:', data.code, 'COULD NOT REGISTER ->', s);
                    return;
                }
                sensors_ids.push(data.id);
            })
            .catch(err => console.log(err))
        );
    });

    return Promise.all(promises);
}

// START THE SIMULATION
console.log('Registering buildings...');
registerBuildings()
    .then(() => {
        console.log('Registering sensors...');
        registerSensorsAndGetPrivateIds()
            .then(() => console.log(sensors_ids.length));
    })
    .catch(err => console.log(err));