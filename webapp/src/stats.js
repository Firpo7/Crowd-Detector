import React from 'react';
import TitleBar, { API } from './common/common.js';
import Chart from 'chart.js';

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
    constructor(props) {
        super(props);

        this.state = {
            id: props.id,
            data: [],
            statsChartName: 'statsChart'
        };
    }

    fetchStatistics() {
        fetch(API + '/getStatistics?optionRange=today&op=all&id=' + this.state.id)
            .then(response => response.json())
            .then(statsObj => {
                if (statsObj.code === 42) {
                    let context = document.getElementById(this.state.statsChartName);
                    let toPlot = {};
                  
                    let labels = [];
                    let values = [];

                    const datas = statsObj.datas;
                    for (let stat of datas) {
                        labels.push(stat.t);    //TODO: refactor labels
                        values.push(stat.result);
                    }
                    
                    toPlot['labels'] = labels;
                    toPlot['datasets'] = [{
                        data: values,
                        label: 'People in the room',
                        fill: false
                    }]

                    let chart = new Chart(context, {
                        type: 'line',
                        data: toPlot
                    });
                }
            });
    }

    componentDidMount() {
        this.fetchStatistics();
    }

    render() {
        return (
            <canvas id={this.state.statsChartName} className='test' width='200' height='100'/>
        );
    }
}

class Stats extends React.Component {
    constructor(props) {
        super(props);

        let params = this.props.location.state.sensor;

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
                    <StatsChart id={this.state.sensor.id}/>
                </div>
            </>
        );
    }
}

export default Stats;