import React from 'react';
import TitleBar, { API } from './common/common.js';
import Chart from 'chart.js';

import './css/stats.css';

function buildAllRequest(timeOption) {
    if (timeOption === TIME_OPTIONS.TODAY || timeOption === TIME_OPTIONS.YESTERDAY)
        return `/getStatistics?optionRange=${timeOption}&op=all&id=`;
    
    return `/getStatistics?optionRange=${timeOption}&op=avg&id=`;
}

function buildDistinctRequest(timeOption) {
    return `/getStatistics?optionRange=${timeOption}&op=distinct&id=`;
}

const TIME_OPTIONS = {
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    LASTWEEK: 'lastweek',
    LASTMONTH: 'lastmonth'
}

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
            <OptionCheckboxSelector onClick={props.onClick} />
        </div>
    );
}

function OptionCheckboxSelector(props) {
    return (
        <div className='form'>
            <h3>Select time window:</h3>

            <div className='inputGroup'>
                <input id={TIME_OPTIONS.TODAY} name='radio' type='radio' onClick={() => props.onClick(TIME_OPTIONS.TODAY)} defaultChecked />
                <label htmlFor={TIME_OPTIONS.TODAY}>Today</label>
            </div>

            <div className='inputGroup'>
                <input id={TIME_OPTIONS.YESTERDAY} name='radio' type='radio' onClick={() => props.onClick(TIME_OPTIONS.YESTERDAY)} />
                <label htmlFor={TIME_OPTIONS.YESTERDAY}>Yesterday</label>
            </div>

            <div className='inputGroup'>
                <input id={TIME_OPTIONS.LASTWEEK} name='radio' type='radio' onClick={() => props.onClick(TIME_OPTIONS.LASTWEEK)} />
                <label htmlFor={TIME_OPTIONS.LASTWEEK}>Last Week</label>
            </div>

            <div className='inputGroup'>
                <input id={TIME_OPTIONS.LASTMONTH} name='radio' type='radio' onClick={() => props.onClick(TIME_OPTIONS.LASTMONTH)} />
                <label htmlFor={TIME_OPTIONS.LASTMONTH}>Last Month</label>
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
            statsChartName: 'statsChart',
            timeOption: props.timeOption,
            chart: null,
        };
    }

    componentDidMount() {
        this.fetchStatistics(TIME_OPTIONS.TODAY);
    }

    componentDidUpdate() {
        if (this.state.timeOption !== this.props.timeOption) {
            this.setState({timeOption: this.props.timeOption});
            this.fetchStatistics(this.props.timeOption, 'line', true);
        }
    }

    processTimeLabels(timeLabel) {
        const date = new Date(timeLabel);
        date.setTime(date.getTime() + 2 * 60 * 60 * 1000);  //UTC+2, our timezone

        const options = 
            this.state.timeOption === TIME_OPTIONS.TODAY || this.state.timeOption === TIME_OPTIONS.YESTERDAY ?
            {year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric'} :
            {year: 'numeric', month: 'numeric', day: 'numeric'};
        const dateTimeFormat = new Intl.DateTimeFormat('en-GB', options);

        return dateTimeFormat.format(date);
    }

    parseTimeOptions(timeOption) {
        switch(timeOption) {
            case TIME_OPTIONS.TODAY:
                return 'Today';
            case TIME_OPTIONS.YESTERDAY:
                return 'Yesterday';
            case TIME_OPTIONS.LASTWEEK:
                return 'Last Week'
            case TIME_OPTIONS.LASTMONTH:
                return 'Last Month';
            default:
                return '';
        }
    }

    setChartsOptions(lineBar) {
        const options = {};

        options['title'] = {
            display: true,
            text: (lineBar === 'line' ? '' : 'Different ') + `People in ${this.state.room} ${this.parseTimeOptions(this.state.timeOption)}`,
            fontSize: 24
        };

        options['scales'] = {
            xAxes: [{
                ticks: {
                    callback: (value, index, _) => {
                        switch(this.state.timeOption) {
                            case TIME_OPTIONS.TODAY:
                            case TIME_OPTIONS.YESTERDAY:
                                if (index % 6)
                                    return '';
                                return value;

                            case TIME_OPTIONS.LASTWEEK:
                                return value;

                            case TIME_OPTIONS.LASTMONTH:
                                if (index % 3)
                                    return '';
                                return value;
                            
                            default:
                                return '';
                        }
                    }
                }
            }],
            yAxes: [{
                stacked: true
            }]
        };

        options['tooltips'] = {
            bodyFontSize: 20,
            callbacks: {
                label: (tooltipItem, data) => {
                    let label = data.datasets[tooltipItem.datasetIndex].label || '';
                    label += ': ' + Math.round(tooltipItem.yLabel * 100) / 100;
                    return label;
                }
            }
        };

        options['legend'] = {
            display: false
        }

        return options;
    }

    setDataToPlot(statsObj, lineBar) {
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
            lineBar === 'line' ?
            {
                data: values,
                label: 'People in the room',
                borderColor: '#e8c3b9',
                fill: false
            } :
            {
                data: values,
                label: 'People in the room',
                borderColor: '#e8c3b9',
                backgroundColor: '#36f',
                fill: false
            }
        ];

        return toPlot;
    }

    fetchStatistics(timeOption, lineBar='line', switched=false) {
        console.log('FETCHING:', timeOption, lineBar);

        const btn = document.getElementById('distinct-btn');

        if (switched || btn.innerHTML === 'CAPACITY')
            btn.innerHTML = 'DISTINCT';
        else 
            btn.innerHTML = 'CAPACITY';

        fetch(API 
            + (lineBar === 'line' ? buildAllRequest(timeOption) : buildDistinctRequest(timeOption))
            + this.state.id)
            .then(response => response.json())
            .then(statsObj => {
                if (statsObj.code === 42) {
                    const context = document.getElementById(this.state.statsChartName);
                    const toPlot = this.setDataToPlot(statsObj, lineBar);
                    const options = this.setChartsOptions(lineBar);
                    
                    if (this.state.chart)
                        this.state.chart.destroy();

                    this.setState({chart:
                        new Chart(context, {
                            type: (lineBar === 'line' ? 'line' : 'bar'),
                            data: toPlot,
                            options: options
                        })
                    });
                }
            });
    }

    distinctHandler() {
        this.fetchStatistics(this.state.timeOption, document.getElementById('distinct-btn').innerHTML === 'DISTINCT' ? 'bar' : 'line');
    }

    render() {
        return (
            <div className="canvas-containter mx-auto">
                <canvas id={this.state.statsChartName} className='chart'/>
                <button id='distinct-btn' className='btn-warning' style={
                    (this.state.timeOption === TIME_OPTIONS.LASTWEEK || this.state.timeOption === TIME_OPTIONS.LASTMONTH) ?
                    {'marginLeft': '35%', 'marginTop': '2%', 'width': '30%'} :
                    {'display': 'none'}
                } onClick={() => this.distinctHandler()}>DISTINCT</button>
            </div>
        );
    }
}

class Stats extends React.Component {
    constructor(props) {
        super(props);

        let params = this.props.location.state.sensor;

        this.state = {
            sensor: params,
            timeOption: TIME_OPTIONS.TODAY
        };

        this.updateTimeOption = this.updateTimeOption.bind(this);
    }

    updateTimeOption(newTimeOption) {
        this.setState({timeOption: newTimeOption});
    }

    render() {
        return (
            <>
                <TitleBar 
                    text={this.state.sensor.name}
                />
                <div className='container'>
                    <RoomData
                        room={this.state.sensor}
                        onClick={this.updateTimeOption}
                    />
                    <StatsChart
                        id={this.state.sensor.id}
                        name={this.state.sensor.name}
                        timeOption={this.state.timeOption}
                    />
                </div>
            </>
        );
    }
}

export default Stats;
