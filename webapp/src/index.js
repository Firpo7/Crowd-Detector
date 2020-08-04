import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

import TitleBar, { API } from './common/common.js';
import Building from './buildings.js';
import Stats from './stats.js';

import './css/index.css';
import 'bootstrap/dist/css/bootstrap.min.css';


// ================ COMPONENTS ================ \\
class BuildingsView extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			buildings: [],
		};
	}
	 
	componentDidUpdate() {
		if(this.state.buildings !== this.props.buildings)
			this.setState({buildings: this.props.buildings});
	}

	renderBuilding(building) {
		return (
			<div key={building.name} className='card text-center text-white bg-info' style={{'width': '18rem', 'display': 'inline-block'}}>
				<div className='card-body'>
					<h5 className='card-title algerian'>{building.name}</h5>
					<p className='text-white card-text'>Address: {building.address}</p>
					<p className='text-white card-text'>Floors: {building.numfloors}</p>
					<Link to={{
						pathname: '/building',
						state: {building}
					}} className='btn btn-outline-warning'>ENTER</Link>
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

function SearchBar(props) {	
	return (
		<div className='wrap'>
			<div className='search'>
				<input type='text' id='toSearch' className='searchTerm' placeholder='Search for a building'/>
				<button type='submit' onClick={() => props.onClick()} className="searchButton">
					<i className='fa fa-search'/>
				</button>
			</div>
		</div>
	);
}

class MainPage extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			buildings: [],
			buildingsToShow: []
		}
		
		this.updateBuildingsView = this.updateBuildingsView.bind(this);
	}

	componentDidMount() {
		fetch(API + '/getBuildings')
			.then(response => response.json())
			.then(buildingObj => {
				if (buildingObj.code === 42)
					this.setState({ 
						buildings: buildingObj.buildings,
						buildingsToShow: buildingObj.buildings,
					});
			});
	}

	updateBuildingsView() {
		let userInput = document.getElementById('toSearch').value.toLowerCase();

		if (userInput === '') {
			this.setState({buildingsToShow: this.state.buildings});	
			return;
		}

		let regex = new RegExp(userInput);
		let filteredBuildings = this.state.buildings.filter(b => regex.test(b.name.toLowerCase()));
		this.setState({buildingsToShow: filteredBuildings});
	}

	render() {
		return (
			<>
				<TitleBar text={'UNIGE Crowd Detector'}/>
				<SearchBar onClick={this.updateBuildingsView}/>
				<BuildingsView buildings={this.state.buildingsToShow}/>
			</>
		);
	}
}


ReactDOM.render(
	<Router>
		<Route path='/' exact={true} component={MainPage} />
		<Route path='/building' exact={true} component={Building} />
		<Route path='/stats' exact={true} component={Stats} />
	</Router>,

	document.getElementById('root')
);