import React from 'react';
import { Container, Row, Col } from 'reactstrap';
import TitleBar, { API } from './common/common.js';
import Chart from 'chart.js';

import './css/stats.css';

// ===== AUX FUNCTIONS ===== \\
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


// ===== COMPONENTS ===== \\
function RoomData(props) {
    return (
        <Container className='roomDataWrapper mx-auto'>
            <Row>
                <Col xs='12' md='6'>
                    <div className='singleData row justify-content-between mx-1 mx-md-3'>
                        <div className='dataTitle px-1 col-5'>FLOOR</div>
                        <div className='dataValue px-1 col-5'>{props.room.floor}</div>
                    </div>
                    <div className='singleData row justify-content-between mx-1 mx-md-3'>
                        <div className='dataTitle px-1 col-5'>OCCUPANCY</div>
                        <div className='dataValue px-1 col-5'>{props.room.maxpeople} ppl</div>
                    </div>
                    <div className='singleData row justify-content-between mx-1 mx-md-3'>
                        <div className='dataTitle px-1 col-5'>TYPE</div>
                        <div className='dataValue px-1 col-5'>{props.room.roomtype}</div>
                    </div>
                </Col>
                <Col xs='12' md='6'>
                    <OptionCheckboxSelector onClick={props.onClick} />
                </Col>
            </Row>
        </Container>
    );
}


function OptionCheckboxSelector(props) {
    return (
        <Row>
            <Col xs='12' sm='10' xl='8' className='mx-auto mb-2'>
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
            </Col>
        </Row>
    );
}

function parseTimeOptions(timeOption) {
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

class StatsChart extends React.Component {
    constructor(props) {
        super(props);

        this.updateChartTitle = props.updateChartTitle

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
            {year: '2-digit', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric'} :
            {year: '2-digit', month: 'numeric', day: 'numeric'};
        const dateTimeFormat = new Intl.DateTimeFormat('it-IT', options);
        return dateTimeFormat.format(date);
    }

    setChartsOptions(lineBar) {
        const options = {};

        this.updateChartTitle((lineBar === 'line' ? '' : 'Different ') + `People in ${this.state.room} ${parseTimeOptions(this.state.timeOption)}`)

        options['title'] = {
            display: true,
            fontSize: 2
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
        
        let dataToPlot = {
            data: values,
            label: 'People in the room',
            borderColor: '#e8c3b9',
            fill: false
        };

        toPlot['labels'] = labels;
        toPlot['datasets'] = [
            lineBar === 'line' ? dataToPlot :  {...dataToPlot, backgroundColor: '#36f'}
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
            <div className='canvas-containter mx-auto'>
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
            timeOption: TIME_OPTIONS.TODAY,
            chartTitle: ''
        };

        this.updateTimeOption = this.updateTimeOption.bind(this);
        this.updateChartTitle = this.updateChartTitle.bind(this);
    }

    updateTimeOption(newTimeOption) {
        this.setState({timeOption: newTimeOption});
    }

    updateChartTitle(newTitle) {
        this.setState({chartTitle: newTitle})
    }

    render() {
        return (
            <>
                <TitleBar 
                    text={this.state.sensor.name}
                />
                <Container fluid={true}>
                    <Row className='mt-4 mb-1 mx-auto'>
                        <Col xs='12' className='text-center'>
                            <div className='roomDataWrapper px-3 py-1'>
                                <span className="p-0">{this.state.chartTitle}</span>
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs='12'>
                            <StatsChart
                                id={this.state.sensor.id}
                                name={this.state.sensor.name}
                                timeOption={this.state.timeOption}
                                updateChartTitle={this.updateChartTitle}
                                />
                        </Col>
                    </Row>
                    <Row>
                        <RoomData
                            room={this.state.sensor}
                            onClick={this.updateTimeOption}
                        />
                    </Row>
                </Container>
            </>
        );
    }
}

export default Stats;
