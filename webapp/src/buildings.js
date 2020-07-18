import React from 'react';


class Buildings extends React.Component {
	componentDidMount() {
		console.log('PROPS:', this.props);
	}

	//EXAMPLE
	render() {
		return (
			<div style={{'backgroundColor': 'blue', 'color': 'yellow'}}>
				<div>{this.props.location.state.building.name}</div>
				<div>{this.props.location.state.building.address}</div>
				<div>{this.props.location.state.building.numfloors}</div>
			</div>
		);
	}
}

export default Buildings;