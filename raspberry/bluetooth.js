'use strict';

const noble  = require('@abandonware/noble');
const nodebt = require('node-bluetooth');

//let nDevs = 0;
const devices = new Map();


function printDevices() {
	let i = 0;
	devices.forEach((localName, btAddr) => {
		console.log(i++ + ') ' + btAddr + ' ' + localName);
	});
	console.log('\n');

	devices.clear();
}


// node-bluetooth scan
const device = new nodebt.DeviceINQ();
device
	.on('found', (btAddr, localName) => {
		if (devices.has(btAddr))
			return;

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

	if (devices.has(btAddr))
		return;

	devices.set(btAddr, localName);
	//console.log('\t|FOUND| -> (' + nDevs++ + ') ' + btAddr + ' ' + localName);
});


// print the devices found every 10 seconds
setInterval(printDevices, 10*1000);
