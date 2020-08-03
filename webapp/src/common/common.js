
import React from 'react';

import '../css/common.css';

export const API   = process.env.NODE_ENV === 'development' ? '' : 'http://iot-proj00.herokuapp.com';

function TitleBar(props) {
	return (
		<div className='opaqueContainer'>
			<div className='imgtitle'/>
			<div className='textCenter'>
				<h1 className='algerian'>{props.text}</h1>
			</div>
			<div className='imgtitle'/>
		</div>	
	);
}

export default TitleBar;
