const redis = require('redis');
const APIconstants = require('./APIConstants').constants;


const redis_client = redis.createClient({
  port      : process.env.REDIS_PORT || 6379,
  host      : process.env.REDIS_HOST || 'localhost',
  password  : process.env.REDIS_PASSWORD || undefined,
});

var knex = require('knex')({
  client: 'pg',
  connection: {
    host : process.env.DBHOST,
    user : process.env.DBUSER,
    password : process.env.DBPASSWORD,
    database : process.env.DBNAME,
    ...( process.env.DBSSL && {ssl: {
      rejectUnauthorized: false,
    }})
  }
});

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

function S4() {
  return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}

function generateRandomID() {
  return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
}

function getListOf(value) {
  let ret = (value || [])
  if (!(ret instanceof Array)) ret = [value]
  return ret
}


function deleteFromCache(key) {
  let toPromise = function( resolve, reject ) {
    redis_client.del(key)
    resolve()
  }
  return new Promise(toPromise)
}


function insertDataIntoDB(table, data) {
  let toPromise = function(resolve, reject) {knex.insert(data).into(table).then(() => {
    resolve()
  }).catch((err) => {
    reject({ code: APIconstants.API_CODE_GENERAL_ERROR, err: err })
  })};
  return new Promise(toPromise)
}

function deleteFromDB(table, where) {
  let toPromise = function( resolve, reject ) {
    knex(table).where(where).del().then(() => {
      resolve()
    }).catch((err) => {
      reject({ code: APIconstants.API_CODE_GENERAL_ERROR, err: err })
    })
  }
  return new Promise(toPromise)
}

function getPublicID(private_id) {
  let toPromise = function(resolve, reject) {
    redis_client.get(private_id, (err, public_id) => {
      if (err) { reject({ code: APIconstants.API_CODE_GENERAL_ERROR, err: err }) }
      
      //if no match found in redis
      if (public_id != null) {
        resolve(public_id)
      } else {
        knex.select('public_id').from('sensor').where('private_id', private_id).then((rows) => {
          if (!rows.length) { reject({code: APIconstants.API_CODE_INVALID_DATA, err:"no sensor found"}) ; return }
          let public_id = rows[0].public_id
          redis_client.setex(private_id, 3600, public_id);
          resolve(public_id)
        }).catch((err) => { reject({ code: (err.code || APIconstants.API_CODE_GENERAL_ERROR), err: (err.err || err) }) })
      }
    });
  }
  return new Promise(toPromise)
}


function getNodesFromDB(building, ids=[], floors=[], types=[]) {
  let toPromise = function( resolve, reject ) {
    let query = knex.select([knex.ref('public_id').as('id'), 'name', 'floor', 'roomtype', 'max_people']).from('sensor')
    if (building) query.where('building', building)
    if (ids.length) query.whereIn('public_id', ids)
    if (floors.length) query.whereIn('floor', floors)
    if (types.length) query.whereIn('roomtype', types)

    query.then((rows) => resolve(rows) )
    .catch((err) => reject({ code: APIconstants.API_CODE_GENERAL_ERROR, err: err }))
  }
  return new Promise(toPromise)
}

function getBuildingsFromDB(name) {
  let toPromise = function( resolve, reject ) {
    let query = knex.select().from('building')
    if (name) query.where('name', name)
    
    query.then((rows) => resolve(rows))
    .catch((err) => reject({ code: APIconstants.API_CODE_GENERAL_ERROR, err: err }))
  }
  return new Promise(toPromise)
}

function getSimpleStatisticsFromDB(listOfIdSensors=[]) {
  let toPromise = function( resolve, reject ) {
    knex.select('sensor_data.sensor_id', "sensor_data.current_people")
    .from('sensor_data').join(
      knex.select('sensor_id', knex.ref(knex.raw('MAX(time)')).as('lasttime') ).from('sensor_data').groupBy('sensor_id').as('tmp'),
      'sensor_data.sensor_id', '=', 'tmp.sensor_id'
    )
    .where(knex.raw('sensor_data.time=tmp.lasttime')).whereIn('sensor_data.sensor_id', listOfIdSensors)
    .then((rows) => {
      resolve(rows)
    }).catch((err) => reject({ code: APIconstants.API_CODE_GENERAL_ERROR, err: err }))
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
        reject({ code: APIconstants.API_CODE_INVALID_DATA, err: "invalid operation" });
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
        reject({ code: APIconstants.API_CODE_INVALID_DATA, err: "invalid option range" });
        return;
    }

    query.select('sensor_id',dayColumn, operation_column).groupBy('day').groupBy('sensor_id').then((rows) => resolve(rows))
    .catch((err) => reject({ code: (err.code || APIconstants.API_CODE_GENERAL_ERROR), err: (err.err || err) }))
  }
  return new Promise(toPromise)
}

function checkFloorBuilding(building, floor) {
  let toPromise = function( resolve, reject ) {
    getBuildingsFromDB(building)
    .then((rows) => {
      if (!rows.length || floor > rows[0].maxFloor) reject({ code: APIconstants.API_CODE_INVALID_DATA, err: `no data in DB: ${building}` })
      resolve()
    })
    .catch((err) => reject({ code: (err.code || APIconstants.API_CODE_GENERAL_ERROR), err: (err.err || err) }))
  }
  return new Promise(toPromise)
}

function checkValidityToken(token) {
  let toPromise = function( resolve, reject ) {
    redis_client.get(token, (err, validity) => {
      if (err) { reject({ code: APIconstants.API_CODE_GENERAL_ERROR, err: err }) }
        
      //if no match found in redis
      if (validity != null) {
        if (new Date(validity) < new Date()) {
          reject({ code: APIconstants.API_CODE_UNAUTHORIZED_ACCESS, err: `unauthorized access with token: ${token}` })
          return
        }
        resolve()
      }
      knex.select('validity').from('token').where('token', token).then((rows) =>{
        if (rows.length) {
          // save it in cache before a possible exit
          redis_client.setex(token, 3600, rows[0].validity);
          if(new Date(rows[0].validity) > new Date()) {
            resolve() ; return
          }
        }
        reject({ code: APIconstants.API_CODE_UNAUTHORIZED_ACCESS, err: `unauthorized access with token: ${token}` })
      }).catch((err) => reject({ code: (err.code || APIconstants.API_CODE_GENERAL_ERROR), err: (err.err || err) }))
    })
  }
  return new Promise(toPromise)
}


exports.getListOf = getListOf;
exports.generateRandomID = generateRandomID;
exports.insertDataIntoDB = insertDataIntoDB;
exports.deleteFromDB = deleteFromDB;
exports.deleteFromCache = deleteFromCache;
exports.getPublicID = getPublicID;
exports.getNodesFromDB = getNodesFromDB;
exports.getBuildingsFromDB = getBuildingsFromDB;
exports.getSimpleStatisticsFromDB = getSimpleStatisticsFromDB;
exports.getStatisticsFromDB = getStatisticsFromDB;
exports.checkValidityToken = checkValidityToken;
exports.checkFloorBuilding = checkFloorBuilding;