import React, { useState } from 'react';
import { Link } from "react-router-dom";
import TitleBar, { API } from './common/common.js';
import { Picky } from 'react-picky';

import 'react-picky/dist/picky.css';
import './css/buildings.css';


const FIVE_MINUTES = 5 * 60 * 1000; //in milliseconds


// ========== COMPONENTS ========== \\
function FloorDrowpdown(props) {
	const floors = [];
	for (let i = 1; i <= props.numfloors; i++)
		floors.push(i);
  
	const [selected, setSelected] = useState([]);

	return (
		<div className='dropdown'>			
			<Picky
				value={selected}
				options={floors}
				onChange={setSelected}
				open={false}
				valueKey='id'
				labelKey='name'
				multiple
				placeholder={<span><span class="d-none d-sm-inline-block">Select </span> Floors...</span>}
				dropdownHeight={600}
				numberDisplayed={1}
				manySelectedPlaceholder={selected.length + ' selected...'}
				render={({
					style,
					isSelected,
					item,
					selectValue
				}) => {
					return (
						<li
							style={style}
							className={isSelected ? 'selected' : ''}
							key={item}
							onClick={() => {
								selectValue(item);
								props.changeFloor(
									!isSelected ? 
										selected.concat([item]) :
										selected.filter(x => x !== item)
								)
							}}
						>
							<input type='checkbox' checked={isSelected} readOnly />
							<span>{item}</span>
						</li>
					);
  				}}
			/>
		</div>
	);
};

function TypeDrowpdown(props) {
	const roomTypes = [
		'office',
		'lecture room',
		'common room',
		'library',
		'study room',
		'laboratory',
		'reserved room'
	];
  
	const [selected, setSelected] = useState([]);

	return (
		<div className='dropdown'>			
			<Picky
				value={selected}
				options={roomTypes}
				onChange={setSelected}
				open={false}
				valueKey='id'
				labelKey='name'
				multiple
				placeholder={<span><span class="d-none d-md-inline-block">Select Room </span> Types...</span>}
				dropdownHeight={600}
				numberDisplayed={1}
				manySelectedPlaceholder={selected.length + ' selected...'}
				render={({
					style,
					isSelected,
					item,
					selectValue
				}) => {
					return (
						<li
							style={style}
							className={isSelected ? 'selected' : ''}
							key={item}
							onClick={() => {
								selectValue(item);
								props.changeType(
									!isSelected ? 
										selected.concat([item]) : 
										selected.filter(x => x !== item)
								)
							}}
						>
							<input type='checkbox' checked={isSelected} readOnly />
							<span>{item}</span>
						</li>
					);
  				}}
			/>
		</div>
	);
};

function SearchButton(props) {
	return (
		<div className='dropdown divBtn'>
			<button className='searchBtn' onClick={props.onClick}>
				<b>SEARCH</b>
				<i className="fa fa-search"/>
			</button>
		</div>
	);
}

class Search extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			roomTypes: [],
			floors: [],
			numfloors: props.numfloors
		}

		this.changeType  = this.changeType.bind(this);
		this.changeFloor = this.changeFloor.bind(this);
		this.doSearch = this.doSearch.bind(this);
	}

	changeType(roomTypes) {
		this.setState({roomTypes: roomTypes});
	}

	changeFloor(floors) {
		this.setState({floors: floors});
	}

	doSearch() {
		this.props.onClick(this.state.roomTypes, this.state.floors);
	}

	render() {
		return (
			<div className='searchWrapper'>
				<FloorDrowpdown 
					numfloors={this.state.numfloors} 
					changeFloor={this.changeFloor}
				/>
				<TypeDrowpdown 
					changeType={this.changeType}
				/>
				<SearchButton 
					onClick={this.doSearch}
				/>
			</div>
		);
	}
}

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
				sensor.curr_people >= parseInt(sensor.maxpeople*0.8) ? {'backgroundColor': '#ff6961', 'color': '#963d35'} :
				sensor.curr_people >= parseInt(sensor.maxpeople*0.5) ? {'backgroundColor': '#ffee75', 'color': '#7c5407'} :
				{'backgroundColor': 'lightgreen', 'color': '#435e55'}
			}>
  				<div className="product-details">
    				<h1>{sensor.name}</h1>
    				<p><b><i>At floor:</i></b> {sensor.floor}</p>
					<p><b><i>Type:</i></b> {sensor.roomtype}</p>
					<p><b><i>People allowed</i></b>: {sensor.maxpeople}</p>
					{/* <p><b><i>People in room</i></b>: {sensor.curr_people}</p> */}
    				<Link to={{
						pathname: '/stats',
						state: {sensor}
					}} className='btn button'>Show Statistics</Link>
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
			maxpeople: params.maxpeople,
			numfloors: params.numfloors,
			sensors: [],
			sensorsToShow: [],
			interval: null
		}

		this.updateSensorView = this.updateSensorView.bind(this);

		//get the people count every 5 minutes to update the view
		this.state.interval = setInterval(() => this.fetchSensorsInBuildings(), FIVE_MINUTES);
	}

	fetchCurrentPeople(sensors, ids) {
		const idsString = ids.map(id => 'id=' + id + '&').join('').slice(0, -1);

		fetch(API + '/getSimpleStatistics?' + idsString)
		.then(people => people.json())
		.then(peopleObj => {
			if (peopleObj.code === 42) {
				let updatedSensors = [];
				let peopleValuesMap = {};

				peopleObj.datas.forEach(val => {
					peopleValuesMap[val.sensor_id] = val.current_people;
				});

				sensors.forEach(s => {
					let id = s.id;
					s.curr_people = peopleValuesMap.hasOwnProperty(id) ? peopleValuesMap[id] : 0;
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
		fetch(API + '/getNodes?building=' + this.state.building)
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

	componentWillUnmount() {
		clearInterval(this.state.interval);
	}

	updateSensorView(types, floors) {
		if (!types.length && !floors.length) {
			this.setState({sensorsToShow: this.state.sensors});
			return;
		}

		let sensors = this.state.sensors;
		let filteredSensors = [];
		
		if (!types.length) //search by floor
			filteredSensors = sensors.filter(
				s => floors.includes(s.floor)
			);	
		else if (!floors.length) //search by type
			filteredSensors = sensors.filter(
				s => types.includes(s.roomtype)
			);
		else //search for both
			filteredSensors = sensors.filter(
				s => types.includes(s.roomtype) && floors.includes(s.floor)
			);

		this.setState({sensorsToShow: filteredSensors});
	}

	render() {
		return (
			<>
				<TitleBar text={this.state.building}/>,
				<Search 
					numfloors={this.state.numfloors}
					onClick={this.updateSensorView}
				/>
				<SensorsView sensors={this.state.sensorsToShow} />
			</>
		);
	}
}

export default Building;