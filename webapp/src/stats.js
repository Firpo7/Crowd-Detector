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
            room: props.name,
            statsChartName: 'statsChart'
        };
    }

    processTimeLabels(timeLabel) {
        const date = new Date(timeLabel);
        const options = {year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric'};
        const dateTimeFormat = new Intl.DateTimeFormat('it-IT', options);
        return dateTimeFormat.format(date);
    }

    setChartsOptions() {
        const options = {};

        options['title'] = {
            display: true,
            text: `People in ${this.state.room} today`,
            fontSize: 24
        };

        options['scales'] = {
            xAxes: [{
                ticks: {
                    callback: (value, index, _) => {
                        if (index % 6)
                            return '';
                        return value;
                    }
                }
            }],
            yAxes: [{
                stacked: true
            }]
        };

        options['tooltips'] = {
            bodyFontSize: 20
        };

        options['legend'] = {
            display: false
        }

        return options;
    }

    setDataToPlot(statsObj) {
        const toPlot = {};
        const labels = [];
        const values = [];

        const datas = statsObj.datas.sort((o1, o2) => o1.t > o2.t);

        for (let stat of datas) {       
            labels.push(this.processTimeLabels(stat.t));
            values.push(stat.result);
        }
        
        toPlot['labels'] = labels;
        toPlot['datasets'] = [
            {
                data: values,
                label: 'People in the room',
                borderColor: '#e8c3b9',
                fill: false
            }
        ];

        return toPlot;
    }

    fetchStatistics() {
        fetch(API + '/getStatistics?optionRange=today&op=all&id=' + this.state.id)
            .then(response => response.json())
            .then(statsObj => {
                if (statsObj.code === 42) {
                    const context = document.getElementById(this.state.statsChartName);
                    const toPlot = this.setDataToPlot(statsObj);
                    const options = this.setChartsOptions();
                    
                    new Chart(context, {
                        type: 'line',
                        data: toPlot,
                        options: options
                    });
                }
            });
    }

    componentDidMount() {
        this.fetchStatistics();
    }

    render() {
        return (
            <canvas id={this.state.statsChartName} className='chart'/>
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
                    <>
                        <RoomData room={this.state.sensor}/>
                        {/* <OptionsCheckbox /> */}
                    </>
                    <StatsChart 
                        id={this.state.sensor.id}
                        name={this.state.sensor.name}
                    />
                </div>
            </>
        );
    }
}

export default Stats;