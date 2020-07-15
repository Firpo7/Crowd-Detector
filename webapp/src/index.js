import React from 'react';
import ReactDOM from 'react-dom';

import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';


const PROXY = 'https://cors-everywhere.herokuapp.com/';
const API   = 'http://iot-proj00.herokuapp.com/';


// ================ COMPONENTS ================ \\
class Buildings extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			buildings: [],
		};

		this.getBuildings();
	}

	getBuildings() {
		fetch(PROXY + API + '/getBuildings')
			.then(response => response.json())
			.then(buildingObj => {
				if (buildingObj.code === 42)
					this.setState({ buildings: buildingObj.buildings })
			});
	}

	renderBuilding(building) {
		return (
			<div key={building.name} className='card text-center text-white bg-info' style={{'width': '18rem', 'display': 'inline-block'}}>
				<div className='card-body'>
					<h5 className='card-title algerian'>{building.name}</h5>
					<p className='text-white card-text'>Address: {building.address}</p>
					<p className='text-white card-text'>Floors: {building.numfloors}</p>
					<a href='http://localhost:3000' className='btn btn-outline-warning'>ENTER</a>
				</div>
			</div>
		);
	}

	render() {
		return (
			<div className='buildingsDiv'>
				{ this.state.buildings.map(b => this.renderBuilding(b)) }
			</div>
		)
	}
}


class SearchBar extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			valueToSearch: ''
		};
	}

	handleChange() {
		let userInput = document.getElementById('toSearch').value;
		this.setState({ valueToSearch: userInput });
	}

	doSearch() {
		console.log(this.state.valueToSearch);
	}
	
	render() {
		return (
			<div className='wrap'>
				<div className='search'>
					<input type='text' id='toSearch' onChange={() => this.handleChange()} className='searchTerm' placeholder='Search for a building'/>
					<button type='submit' onClick={() => this.doSearch()} className="searchButton">
						<i className='fa fa-search'/>
					</button>
				</div>
			</div>
		);
	}
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
