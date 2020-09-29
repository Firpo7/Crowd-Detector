'use strict';

const noble  = require('@abandonware/noble');
const nodebt = require('node-bluetooth');

const fetch = require('node-fetch');
const APIconstants = require('../server/app/Constants').APIConstants;
const CronJob = require('cron').CronJob;

require('dotenv').config();


function pushUpdate() {
	let i = 0;
	console.log('DEVICEs DETECTED:');
	devices.forEach((localName, btAddr) => {
		console.log(i++ + ') ' + btAddr + ' ' + localName);
	});
	console.log('\n');

	// it prevents to loose people during the query delay
	let currP = currentNewPeople;
	let newP = currentNewPeople;

	currentNewPeople = 0;
	currentPeople = 0;
	devices.clear();

	fetch(API + APIconstants.API_ENDPOINT_UPDATE_CROWD,
		{
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					id: private_id,
					current: currP,
					new: newP,
					time: new Date().toISOString()
				})
		})
		.then(response => response.json())
		.then(data => {
				if (data.code !== 42)
					throw data.code;
		})
		.catch(err => console.error('[ERROR (push)]:', err));
}


function registerSensor() {
	fetch(API + APIconstants.API_ENDPOINT_REGISTER_NEW_NODE,
		{
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({
				name: NAME,
				building: BUILDING,
				max_people: MAX_PEOPLE,
				floor: FLOOR,
				type: TYPE,
				token: TOKEN
			})
		})
		.then(response => response.json())
		.then(data => {
			if (data.code === 42) {
				private_id = data.id;
				console.log('[OK] Registration successful ===> ID:', data.id);
				startScanning();
				return;
			}

			// if the registration fails
			throw data.code;
		})
		.catch(err => { console.error('[ERROR (register)]:', err); process.exit(); });
}


function checkEnvParameters() {
	if (!private_id) {
		console.log('/!\\ Sensor not known, starting the registration...');

		if (!TOKEN) {
			console.error('[ERROR] An administrator token must be provided !');
			return false;
		}

		if (!BUILDING) {
			console.error('[ERROR] A building must be provided !');
			return false;
		}

		if (!NAME) {
			console.error('[ERROR] A name for the sensor must be provided !');
			return false;
		}

		if (!MAX_PEOPLE) {
			console.error('[ERROR] A capacity for the area must be provided !');
			return false;
		}

		if (!FLOOR) {
			console.error('[ERROR] A floor must be provided !');
			return false;
		}

		if (!TYPE) {
			console.error('[ERROR] A type of room must be provided !');
			return false;
		}

		registerSensor();
		return true;
	}

	console.log('[*] Sensor already registered !');
	startScanning();
	return true;
}


function startScanning() {
	// node-bluetooth scan
	const device = new nodebt.DeviceINQ();
	device
		.on('found', (btAddr, localName) => {
			if (!todaysDevices.has(btAddr)) {
				todaysDevices.add(btAddr);
				currentNewPeople++;
			}

			if (devices.has(btAddr))
				return;

			currentPeople++;
			devices.set(btAddr, localName);

			//console.log('\t/[NODE-BT] FOUND/ -> (' + currentPeople + ') ' + btAddr + ' ' + localName);
		})
		.on('finished', () => {
			device.scan();	// to enter in a loop to find devices continuously
		})
		.scan();


	// @abandonware/noble scan
	noble
		.on('stateChange', state => {
			if (state !== 'poweredOn')
				return;

			console.log('[OK] Bluetooth detection started at ' + new Date() + '\n');
			noble.startScanningAsync([], true); // allow repetitions
		})
		.on('discover', dev => {
			let btAddr = dev.address;
			let localName = dev.advertisement.localName;

			if (!todaysDevices.has(btAddr)) {
				todaysDevices.add(btAddr);
				currentNewPeople++;
			}

			if (devices.has(btAddr))
				return;

			currentPeople++;
			devices.set(btAddr, localName);

			//console.log('\t/[NOBLE] FOUND/ -> (' + currentPeople + ') ' + btAddr + ' ' + localName);
		});
}


// ===== MAIN ===== \\
const devices = new Map();
const todaysDevices = new Set();

const API = process.env.API || 'https://localhost:4000';
//const API = process.env.API || 'https://iot-proj00.herokuapp.com';

var currentNewPeople = 0;
var currentPeople = 0;

var private_id = process.env.ID;

const NAME = process.env.NAME;
const TOKEN = process.env.TOKEN;
const BUILDING = process.env.BUILDING;
const MAX_PEOPLE = process.env.MAX_PEOPLE;
const FLOOR = process.env.FLOOR;
const TYPE = process.env.TYPE;

if (checkEnvParameters()) {
	// push the devices found every 5 minutes to the database
	setInterval(pushUpdate, 5*60*1000);

	// every day at 12:00 AM clear the devices found during the day
	new CronJob('0 0 0 * * *', () => {
		todaysDevices.clear();
	}).start();
}
