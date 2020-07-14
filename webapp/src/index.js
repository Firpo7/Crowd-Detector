import React from 'react';
import ReactDOM from 'react-dom';

import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';

// ================= FUNCTIONS ================= \\
function createHttpRequest(APIendpoint) {
	let request = null;
	if (window.XMLHttpRequest) {
		request = new XMLHttpRequest();

		//require proxy to avoid CORS
		request.open('GET', 'https://cors-everywhere.herokuapp.com/http://iot-proj00.herokuapp.com/' + APIendpoint, true);
		//request.setRequestHeader('Access-Control-Allow-Origin', 'https://iot-proj00.herokuapp.com/');
	}
	return request;
}


// ================ COMPONENTS ================ \\
class Buildings extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			buildings: [],
		};

		this.getBuildingsToShow();
	}

	getBuildingsToShow() {
		let request = createHttpRequest('getBuildings');
		request.onreadystatechange = this.getBuildingsCB(request);
		request.send();
	}

	getBuildingsCB(request) {
		return () => {
			if (request.readyState === 4 && request.status === 200) {
				let buildingObj = JSON.parse(request.responseText);
				if (buildingObj.code === 42) {
					this.setState({buildings: buildingObj.listOfNodes});
				}
			}
		}
	}

	renderBuilding(building) {
		return (
			<div key={building.name} className='card text-center text-white bg-info' style={{'width': '18rem', 'display': 'inline-block'}}>
				<div className='card-body'>
					<h5 className='text-white card-title'>{building.name}</h5>
					<p className='text-white card-text'>Address: {building.address}</p>
					<p className='text-white card-text'>Floors: {building.numfloors}</p>
					<a href='localhost:3000' className='btn btn-danger'>ENTER</a>
				</div>
			</div>
		);
	}

	render() {
		return (
			<div>
				{ this.state.buildings.map(b => console.log(b) || this.renderBuilding(b)) }
			</div>
		)
	}
}


function SearchBar() {
	return (
		<div className='wrap'>
			<div className='search'>
				<input type='text' className='searchTerm' placeholder='Search for a building'/>
				<button type='submit' className="searchButton">
					<i className='fa fa-search'/>
				</button>
			</div>
		</div>
	);
}


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


function MainPage() {
	return (
		<>
			<TitleBar />
			<SearchBar />
			<Buildings />
		</>
	);
}


ReactDOM.render(
	<MainPage />,
	document.getElementById('root')
);
