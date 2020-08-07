
import React from 'react';

import '../css/common.css';

export const API   = process.env.NODE_ENV === 'development' ? '' : 'http://iot-proj00.herokuapp.com';

function TitleBar(props) {
	return (
		<div className='opaqueContainer'>
			<div className='imgtitle'/>
			<div className='text-center mx-3'>
				<h1 className='algerian'>{props.text}</h1>
			</div>
			<div className='imgtitle d-none d-md-block'/>
		</div>	
	);
}

export default TitleBar;
