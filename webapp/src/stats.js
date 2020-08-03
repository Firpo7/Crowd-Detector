import React from 'react';
import TitleBar from './common/common.js';

import './css/stats.css';

function RoomData(props) {
    return (
        <div className='roomDataWrapper'>
            <div>
                <span>FLOOR:</span>
                <span>{props.room.floor}</span>
            </div>
            <div>
                <span>CAPACITY:</span>
                <span>{props.room.maxpeople}</span>
            </div>
            <div>
                <span>TYPE:</span>
                <span>{props.room.roomtype}</span>
            </div>
        </div>
    );
}

class Stats extends React.Component {
    constructor(props) {
        super(props);

        let params = this.props.location.state.sensor;

        console.log(params);
        this.state = {
            sensor: params
        };
    }

    render() {
        return (
            <>
                <TitleBar text={this.state.sensor.name}/>
                <RoomData room={this.state.sensor}/>
            </>
        );
    }
}

export default Stats;