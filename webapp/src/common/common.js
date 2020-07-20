
import React from 'react';

import '../css/common.css';

export const PROXY = 'https://cors-everywhere.herokuapp.com/';
export const API   = 'http://iot-proj00.herokuapp.com';

function TitleBar() {
	return (
		<div className='opaqueContainer'>
			<div className='imgtitle'/>
			<div className='textCenter'>
				<h1 className='algerian'>UNIGE Crowd Detector</h1>
			</div>
			<div className='imgtitle'/>
		</div>	
	);
}

export default TitleBar;
