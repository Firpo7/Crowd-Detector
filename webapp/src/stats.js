import React from 'react';
import TitleBar from './common/common.js';

import './css/stats.css';

function RoomData(props) {
    return (
        <div className='roomDataWrapper'>
            <div className='singleData'>
                <div className='dataTitle'>FLOOR</div>
                <div className='dataValue'>{props.room.floor}</div>
            </div>
            <div className='singleData'>
                <div className='dataTitle'>OCCUPANCY</div>
                <div className='dataValue'>{props.room.maxpeople} ppl</div>
            </div>
            <div className='singleData'>
                <div className='dataTitle'>TYPE</div>
                <div className='dataValue'>{props.room.roomtype}</div>
            </div>
        </div>
    );
}

class StatsChart extends React.Component {
    render() {
        return (
            <div className='test' />
        );
    }
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
                <div style={{'display': 'flex', 'flexDirection': 'row'}}>
                    <RoomData room={this.state.sensor}/>
                    <StatsChart />
                </div>
            </>
        );
    }
}

export default Stats;