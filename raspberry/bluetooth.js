'use strict';

const noble  = require('@abandonware/noble');
const fetch = require('node-fetch');
const APIconstants = require('../server/app/Constants').APIConstants;
const nodebt = require('node-bluetooth');
const CronJob = require('cron').CronJob;
require('dotenv').config()

//let nDevs = 0;
const devices = new Map();
const todaysDevices = new Set();
const private_id = process.env.id

let currentNewPeople = 0;
let currentPeople = 0;

function pushUpdate() {
	let i = 0;
	devices.forEach((localName, btAddr) => {
		console.log(i++ + ') ' + btAddr + ' ' + localName);
	});
	console.log('\n');

	// this prevents to lose people during the query delay
	currP = currentNewPeople;
	newP = currentNewPeople;
	
	currentNewPeople = 0;
	currentPeople = 0;
	devices.clear();

	fetch(API + APIconstants.API_ENDPOINT_UPDATE_CROWD,
		{
				method: 'POST',
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				body: 'id=' + private_id + '&current=' + currP + '&new=' + newP + '&time=' + new Date()
		})
		.then(res => res.json())
		.then(data => {
				if (data.code !== 42)
					console.log('ERROR:', data.code);
		})
		.catch(err => console.log(err));
}


// node-bluetooth scan
const device = new nodebt.DeviceINQ();
device
	.on('found', (btAddr, localName) => {
		if (!todaysDevices.has(btAddr)) {
			todaysDevices.add(btAddr);
			++currentNewPeople;
		}

		if (devices.has(btAddr))
			return;

		++currentPeople;
		devices.set(btAddr, localName);
		//console.log('\t/FOUND/ -> (' + nDevs++ + ') ' + btAddr + ' ' + localName);
	}).on('finished', () => {
		device.scan();	// to enter in a loop to find devices continuously
	}).scan();


// @abandonware/noble scan
noble.on('stateChange', (state) => {
	if (state !== 'poweredOn')
		return;

	console.log('Bluetooth detection started at ' + new Date() + '\n');
	noble.startScanningAsync([], true); // allow repetitions
});

noble.on('discover', (dev) => {
	let btAddr = dev.address;
	let localName = dev.advertisement.localName;

	if (!todaysDevices.has(btAddr)) {
		todaysDevices.add(btAddr);
		++currentNewPeople;
	}

	if (devices.has(btAddr))
		return;

	++currentPeople;
	devices.set(btAddr, localName);
	//console.log('\t|FOUND| -> (' + nDevs++ + ') ' + btAddr + ' ' + localName);
});


// print the devices found every 30 seconds
setInterval(pushUpdate, 30*1000);
new CronJob('0 0 0 * * *', function() {
	//will run every day at 12:00 AM
	todaysDevices.clear()
}).start()