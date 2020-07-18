import React from 'react';
import { Link } from "react-router-dom";
import TitleBar, {PROXY, API} from './common/common.js';

import './css/buildings.css';


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
			<div className="product-card">
  				<div className="product-details">
    				<h1>{sensor.name}</h1>
    				<p>Great product title for a great product and all of the extra things a product might need to make it fill an entire card.</p>
    				<Link className='btn button'>Buy Now</Link>
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

		console.log('PROPS:', this.props);

		let params = this.props.location.state.building;

		this.state = {
			building: params.name,
			max_people: params.numfloors,
			sensors: [],
			sensorsToShow: []
		}
	}

	componentDidMount() {
		fetch(PROXY + API + '/getNodes?building=' + this.state.building)
			.then(response => response.json())
			.then(sensorsObj => {
				if (sensorsObj.code === 42) {
					this.setState({
						sensors: sensorsObj.listOfNodes,
						sensorsToShow: sensorsObj.listOfNodes
					});
				}
			});
	}

	//EXAMPLE
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