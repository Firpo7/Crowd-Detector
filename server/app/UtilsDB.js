const redis = require('redis');
const APIconstants = require('./Constants').APIConstants;
const ParamConstants = require('./Constants').ParamsConstants


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
  },
  pool: {
    afterCreate: (conn, done) => {
      //IMPORTANT: set the correct timezone before running the program
      conn.query('SET timezone="UTC-2";', err => {
        done(err, conn);
      });
    }
  }
});


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
      if (err) { reject(err) }
      
      //if no match found in redis
      if (public_id != null) {
        resolve(public_id)
      } else {
        knex.select('public_id').from('sensor').where('private_id', private_id).then((rows) => {
          if (!rows.length) { reject(`no sensors found in DB for private ID: ${private_id}`) ; return }
          let public_id = rows[0].public_id
          redis_client.setex(private_id, 3600, public_id);
          resolve(public_id)
        }).catch((err) => { reject({ code: APIconstants.API_CODE_GENERAL_ERROR, err: err }); console.log(err) })
      }
    });
  }
  return new Promise(toPromise)
}


function getNodesFromDB(building, ids=[], floors=[], types=[]) {
  let toPromise = function( resolve, reject ) {
    let query = knex.select([knex.ref('public_id').as('id'), 'name', 'floor', 'roomtype', 'maxpeople']).from('sensor')
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
    .from('sensor_data')
    .join(
      knex.select('sensor_id', knex.ref(knex.raw('MAX(time)')).as('lasttime')).from('sensor_data').groupBy('sensor_id').as('tmp').whereRaw('time BETWEEN (now() - interval \'30 minutes\') AND now()'),
      'sensor_data.sensor_id', '=', 'tmp.sensor_id'
    )
    .where(knex.raw('sensor_data.time=tmp.lasttime')).whereIn('sensor_data.sensor_id', listOfIdSensors)
    .then((rows) => {
      resolve(rows)
    }).catch((err) => reject({ code: APIconstants.API_CODE_GENERAL_ERROR, err: err }))
  }
  return new Promise(toPromise)
}

function getStatisticsFromDB(sensor_id, operation, option_range) {
  let toPromise = function( resolve, reject ) {
    let dayColumn = knex.raw("date_trunc('day', time)")
    let query = knex('sensor_data').where('sensor_id', sensor_id)
    let operation_column

    switch (operation) {
      case ParamConstants.OPERATIONS.AVG_NUMBER_OF_PEOPLE:
        operation_column = knex.raw('AVG(current_people)')
        break;
      
      case ParamConstants.OPERATIONS.MAX_NUMBER_OF_PEOPLE:
        operation_column = knex.raw('MAX(current_people)')
        break;
      
      case ParamConstants.OPERATIONS.NUMBER_OF_DISTICT_PEOPLE:
        operation_column = knex.raw('SUM(new_people)')
        break;

      case ParamConstants.OPERATIONS.ALL_STATISTICS:
        operation_column = 'current_people'
        break;
      
      default:
        reject(`no operation found for: ${operation}`);
        return;
    }

    /*let current_date = new Date()
    let today_date = new Date(Date.UTC(current_date.getUTCFullYear(), current_date.getUTCMonth(), current_date.getUTCDate()))*/

    switch (option_range) {
      case ParamConstants.OPTION_RANGES.TODAY:
        query.whereRaw('time BETWEEN current_date AND (current_date + interval \'1 days\')')
        break;
      
      case ParamConstants.OPTION_RANGES.YESTERDAY:
        query.whereRaw('time BETWEEN (current_date - interval \'1 days\') AND current_date')
        break;
      
      case ParamConstants.OPTION_RANGES.LAST_WEEK:
        query.whereRaw('time BETWEEN (current_date - interval \'7 days\') AND current_date')
        break;
      
      case ParamConstants.OPTION_RANGES.LAST_MONTH:
        query.whereRaw('time BETWEEN (current_date - interval \'30 days\') AND current_date')
        break;
      
      default:
        reject(`no operation found for: ${option_range}`);
        return;
    }

    query.select({
      ...( operation !== ParamConstants.OPERATIONS.ALL_STATISTICS && {'t': dayColumn}),
      ...( operation === ParamConstants.OPERATIONS.ALL_STATISTICS && {'t': 'time'}),
      'result': operation_column}
      )
    if ( operation !== ParamConstants.OPERATIONS.ALL_STATISTICS) query.groupBy('t')
    query.then((rows) => resolve(rows))
    .catch((err) => reject({ code: APIconstants.API_CODE_GENERAL_ERROR, err: err }))
  }
  return new Promise(toPromise)
}

function checkFloorBuilding(building, floor) {
  let toPromise = function( resolve, reject ) {
    getBuildingsFromDB(building)
    .then((rows) => {
      if (!rows.length) reject(`no building found: ${building}`)
      if (floor > rows[0].maxFloor) reject(`floor too high for building: ${building}`)
      resolve()
    })
    .catch((err) => reject({ code: APIconstants.API_CODE_GENERAL_ERROR, err: err }))
  }
  return new Promise(toPromise)
}

function checkValidityToken(token) {
  let toPromise = function( resolve, reject ) {
    redis_client.get(token, (err, validity) => {
      if (err) { reject(err) }
        
      //if no match found in redis
      if (validity != null) {
        if (new Date(validity) < new Date()) {
          reject(`unauthorized access with token: ${token}`)
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
        reject(`unauthorized access with token: ${token}`)
      }).catch((err) => reject({ code: APIconstants.API_CODE_UNAUTHORIZED_ACCESS, err: err }))
    })
  }
  return new Promise(toPromise)
}


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
