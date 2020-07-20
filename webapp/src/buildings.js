import React from 'react';
import { Link } from "react-router-dom";
import TitleBar, {PROXY, API} from './common/common.js';

import './css/buildings.css';


const FIVE_MINUTES = 5 * 60 * 1000; //in milliseconds


class SensorsView extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			sensors: []
		}
	}

	componentDidUpdate() {
		if(this.state.sensors !== this.props.sensors)
			this.setState({sensors: this.props.sensors});
	}

	renderSensor(sensor) {
		return (
			<div key={sensor.id} className="product-card" style={
				/* 
					Color-code for rooms:
						RED    -> more than 80% full
						YELLOW -> more than 60% full
						GREEN  -> otherwise
				*/
				sensor.curr_people >= parseInt(sensor.max_people*0.8) ? {'backgroundColor': '#ff6961', 'color': '#963d35'}   :
				sensor.curr_people >= parseInt(sensor.max_people*0.5) ? {'backgroundColor': '#ffee75', 'color': '#7c5407'} :
				{'backgroundColor': 'lightgreen', 'color': '#435e55'}
			}>
  				<div className="product-details">
    				<h1>{sensor.name}</h1>
    				<p><b><i>At floor:</i></b> {sensor.floor}</p>
					<p><b><i>Type:</i></b> {sensor.roomtype}</p>
					<p><b><i>People allowed</i></b>: {sensor.max_people}</p>
    				<Link to='#' className='btn button'>Show Statistics</Link>
  				</div>
			</div>
		);
	}

	render() {
		return (
			<div className='sensorsDiv'>
				{ this.state.sensors.map(s => this.renderSensor(s)) }
			</div>
		)
	}
}

class Building extends React.Component {
	constructor(props) {
		super(props);

		let params = this.props.location.state.building;

		this.state = {
			building: params.name,
			max_people: params.numfloors,
			sensors: [],
			sensorsToShow: []
		}

		//get the people count every 5 minutes to update the view
		setInterval(() => this.fetchSensorsInBuildings(), FIVE_MINUTES);
	}

	fetchCurrentPeople(sensors, ids) {
		const idsString = ids.map(id => 'id=' + id + '&').join('').slice(0, -1);

		fetch(PROXY + API + '/getSimpleStatistics?' + idsString)
		.then(people => people.json())
		.then(peopleObj => {
			if (peopleObj.code === 42) {
				let currentSensor = 0;
				let updatedSensors = [];

				sensors.forEach(s => {
					s.curr_people = peopleObj.datas[currentSensor].current_people;
					updatedSensors.push(s);
				});
				
				this.setState({
					sensors: updatedSensors,
					sensorsToShow: updatedSensors
				});
			}
		});
	}

	fetchSensorsInBuildings() {
		fetch(PROXY + API + '/getNodes?building=' + this.state.building)
			.then(response => response.json())
			.then(sensorsObj => {
				if (sensorsObj.code === 42) {
					let sensors = sensorsObj.listOfNodes;
					let ids = sensors.map(s => s.id);

					this.fetchCurrentPeople(sensors, ids);
				}
			}
		);
	}

	componentDidMount() {
		this.fetchSensorsInBuildings();
	}

	render() {
		return (
			<>
				<TitleBar />
				<SensorsView sensors={this.state.sensorsToShow}/>
			</>
		);
	}
}

export default Building;