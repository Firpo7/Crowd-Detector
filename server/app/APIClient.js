const { Client } = require('pg');
var APIconstants = require('./APIConstants').constants;

const OPERATIONS = {
  MAX_NUMBER_OF_PEOPLE: "max",
  AVG_NUMBER_OF_PEOPLE: "avg",
  NUMBER_OF_DISTICT_PEOPLE: "distinct",
}

const OPTION_RANGE = {
  TODAY: "today",
  YESTERDAY: "yesterday",
  LAST_WEEK: "lastweek",
  LAST_MONTH: "lastmonth"
}

var knex = require('knex')({
  client: 'pg',
  connection: {
    host : process.env.DBHOST,
    user : process.env.DBUSER,
    password : process.env.DBPASSWORD,
    database : process.env.DBNAME,
    ...( process.env.DBHOST !== 'localhost' && {ssl: {
      rejectUnauthorized: false,
    }})
  }
});

function checkIsPresent(value) {
  return (value !== undefined && value !== null)
}

function getListOf(value) {
  let ret = (value || [])
  if (!(ret instanceof Array)) ret = [value]
  return ret
}

function getNodesFromDB(building, ids=[], floors=[], types=[]) {
  let toPromise = function( resolve, reject ) {
    let query = knex.select([knex.ref('public_id').as('id'), 'name', 'floor', 'roomtype']).from('sensor')
    if (building) query.where('building', building)
    if (ids.length) query.whereIn('public_id', ids)
    if (floors.length) query.whereIn('floor', floors)
    if (types.length) query.whereIn('roomtype', types)

    query.then((rows) => resolve(rows) )
    .catch((err) => reject(err))
  }
  return new Promise(toPromise)
}

function getBuildingsFromDB(name) {
  let toPromise = function( resolve, reject ) {
    let query = knex.select().from('building')
    if (name) query.where('name', name)
    
    query.then((rows) => resolve(rows))
    .catch((err) => reject(err))
  }
  return new Promise(toPromise)
}

function getSimpleStatisticsFromDB(listOfIdSensors=[]) {
  let toPromise = function( resolve, reject ) {
    knex.select('sensor_id','current_people').from('sensor_data').whereIn('sensor_id', listOfIdSensors).orderBy('time','desc').limit(1).then((rows) => {
      resolve(rows)
    }).catch((err) => reject(err))
  }
  return new Promise(toPromise)
}

function getStatisticsFromDB(listOfIdSensors, operation, option_range) {
  let toPromise = function( resolve, reject ) {
    let dayColumn = knex.ref(knex.raw('concat( EXTRACT(MONTH FROM time), \'-\', EXTRACT(DAY FROM time))')).as('day')
    let query = knex('sensor_data').whereIn('sensor_id', listOfIdSensors)
    let operation_column

    switch (operation) {
      case OPERATIONS.AVG_NUMBER_OF_PEOPLE:
        operation_column = knex.ref(knex.raw('AVG(current_people)')).as('result')
        break;
      
      case OPERATIONS.MAX_NUMBER_OF_PEOPLE:
        operation_column = knex.ref(knex.raw('MAX(current_people)')).as('result')
        break;
      
      case OPERATIONS.NUMBER_OF_DISTICT_PEOPLE:
        operation_column = knex.ref(knex.raw('SUM(new_people)')).as('result')
        break;
      
      default:
        reject({ code: APIconstants.API_CODE_INVALID_DATA });
        return;
    }

    let current_date = new Date()
    let today_date = new Date(Date.UTC(current_date.getUTCFullYear(), current_date.getUTCMonth(), current_date.getUTCDate()));

    switch (option_range) {
      case OPTION_RANGE.TODAY:
        query.where('time', '>', today_date)
        break;
      
      case OPTION_RANGE.YESTERDAY:
        let yesterday_date = new Date(today_date.getTime())
        yesterday_date.setDate(yesterday_date.getDate() - 1)
        query.whereBetween('time', [yesterday_date, today_date])
        break;
      
      case OPTION_RANGE.LAST_WEEK:
        let lastweek_date = new Date(today_date.getTime())
        lastweek_date.setDate(lastweek_date.getDate() - 7)
        query.whereBetween('time', [lastweek_date, today_date])
        break;
      
      case OPTION_RANGE.LAST_MONTH:
        let lastmonth_date = new Date(today_date.getTime())
        lastmonth_date.setDate(lastmonth_date.getDate() - 30)
        query.whereBetween('time', [lastmonth_date, today_date])
        break;
      
      default:
        reject({ code: APIconstants.API_CODE_INVALID_DATA });
        return;
    }

    query.select(dayColumn, operation_column).groupBy('day').then((rows) => resolve(rows))
    .catch((err) => reject(err))
  }
  return new Promise(toPromise)
}

function getNodesController(req, res) {
  if (!checkIsPresent(req.query.building)) { res.send({code: APIconstants.API_CODE_INVALID_DATA}); return; }
  let floors = getListOf(req.query.floor)
  let types = getListOf(req.query.type)

  getNodesFromDB(building=req.query.building, floors=floors, types=types)
  .then((rows) => res.send({code: APIconstants.API_CODE_SUCCESS, listOfNodes: rows}))
  .catch((err) => {res.send({code:APIconstants.API_CODE_GENERAL_ERROR}) ; console.log(err) })
}

function getBuildingController(req, res) {
  getBuildingsFromDB(req.query.name)
  .then((rows) => res.send({code: APIconstants.API_CODE_SUCCESS, buildings: rows}))
  .catch((err) => {res.send({code:APIconstants.API_CODE_GENERAL_ERROR}) ; console.log(err) })
}

function getStatisticsController(req, res) {
  if( !( req.query.op && typeof(req.query.op)==='string' ) ||
      !( req.query.optionRange && typeof(req.query.optionRange)==='string' ) ||
      !( req.query.id && (typeof(req.query.id)==='string' || req.query.id instanceof Array) )) {
        res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
        return
  }
  let ids = getListOf(req.query.id)
  getStatisticsFromDB(ids, req.query.op.toLowerCase(), req.query.optionRange.toLowerCase())
  .then((rows) => res.send({code: APIconstants.API_CODE_SUCCESS, datas: rows}))
  .catch((err) => {res.send({code: (err.code || APIconstants.API_CODE_GENERAL_ERROR)}) ; if (err.code) console.log(err) })
}

function getSimpleStatisticsController(req, res) {
  if ( !( req.query.id && (typeof(req.query.id)==='string' || req.query.id instanceof Array) )) {
    res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
    return
  }
  let ids = getListOf(req.query.id)
  getSimpleStatisticsFromDB(ids)
  .then((rows) => res.send({code: APIconstants.API_CODE_SUCCESS, datas: rows}))
  .catch((err) => {res.send({code:APIconstants.API_CODE_GENERAL_ERROR}) ; console.log(err) })
}

exports.getSimpleStatistics = getSimpleStatisticsController
exports.getNodes = getNodesController;
exports.getBuildings = getBuildingController;
exports.getStatistics = getStatisticsController;