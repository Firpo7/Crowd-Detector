const redis = require('redis')

const redis_client = redis.createClient({
  port      : process.env.REDIS_PORT || 6379,
  host      : process.env.REDIS_HOST || 'localhost',
  password  : process.env.REDIS_PASSWORD,
});

var APIconstants = require('./APIConstants').constants;

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

function S4() {
  return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}

function generateRandomID() {
  return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
}


function insertDataIntoDB(table, data) {
  let toPromise = function(resolve, reject) {knex.insert(data).into(table).then(() => {
    resolve()
  }).catch((err) => {
    reject(err)
  })};
  return new Promise(toPromise)
}

function deleteFromDB(table, where) {
  let toPromise = function( resolve, reject ) {
    knex(table).where(where).del().then(() => {
      resolve()
    }).catch((err) => {
      reject(err)
    })
  }
  return new Promise(toPromise)
}

function deleteFromCache(key) {
  let toPromise = function( resolve, reject ) {
    redis_client.del(key)
    resolve()
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
          let public_id = rows[0].public_id
          redis_client.setex(private_id, 3600, public_id);
          resolve(public_id)
        }).catch((err) => { reject(err) })
      }
    });
  }
  return new Promise(toPromise)
}


function registerNewNodeController(req, res) {
  if( !( req.body.name && typeof(req.body.name)==='string' ) ||
      !( req.body.max_people && typeof(req.body.max_people)==='string' ) ||
      !( req.body.type && typeof(req.body.type)==='string' ) ||
      !( req.body.floor && typeof(req.body.floor)==='string' ) ||
      !( req.body.building && typeof(req.body.building)==='string' )) {
        res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
        return
  }

  let public_id = generateRandomID()
  let private_id = generateRandomID()
  insertDataIntoDB('sensor', {
    'public_id' : public_id,
    'private_id' : private_id,
    'name' : req.body.name,
    'maxpeople' : req.body.max_people,
    'floor' : req.body.floor,
    'roomtype' : req.body.type,
    'building' : req.body.building
  }).then(() => { res.send({code: APIconstants.API_CODE_SUCCESS, id: private_id}) })
  .catch((err) => { res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err) })
}

function registerNewBuildingController(req, res) {
  if( !( req.body.name && typeof(req.body.name)==='string' ) ||
      !( req.body.numFloors && typeof(req.body.numFloors)==='string' )) {
        res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
        return
  }
  insertDataIntoDB('building', {
    'name' : req.body.name,
    ...(typeof(req.body.address)==='string' && {address : req.body.address}),
    'numfloors' : req.body.numFloors
  }).then(() => {res.send({code: APIconstants.API_CODE_SUCCESS})})
  .catch((err) => {res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err)})
}

function deleteBuildingController(req, res) {
  if( !( req.body.name && typeof(req.body.name)==='string' ) ) {
    res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
    return
  }
  deleteFromDB('building', {'name': req.body.name})
  .then(() => {res.send({code: APIconstants.API_CODE_SUCCESS})})
  .catch((err) => {res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err)})
}

function deleteNodeController(req, res) {
  if( !( req.body.id && typeof(req.body.id)==='string' ) ) {
    res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
    return
  }
  deleteFromDB('sensor', {'private_id': req.body.id})
  .then(() => getPublicID(req.body.id))
  // need to remove before the publicID or it will be populate again after the getPublicID
  .then((public_id) => deleteFromCache(public_id))
  .then(() => deleteFromCache(req.body.id))
  .then(() => {res.send({code: APIconstants.API_CODE_SUCCESS})})
  .catch((err) => {res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err)})
}

function updateCrowdController(req, res) {
  if( !( req.body.id && typeof(req.body.id)==='string' ) ||
      !( req.body.current && typeof(req.body.current)==='string' ) ||
      !( req.body.new && typeof(req.body.new)==='string' )) {
        res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
        return
  }

  getPublicID(req.body.id)
  .then((public_id) => insertDataIntoDB('sensor_data', {
    'sensor_id': public_id,
    'time': new Date(),
    'current_people': req.body.current,
    'new_people': req.body.new
  })).then(() => { res.send({code: APIconstants.API_CODE_SUCCESS}) })
  .catch((err) => { res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err) })
}

function manageAdminRequests(req, res, callback) {
  let token = req.body.token
  if(!token) { res.send({ code: APIconstants.API_CODE_UNAUTHORIZED_ACCESS }); return}

  redis_client.get(token, (err, validity) => {
    if (err) { reject(err) }
      
    //if no match found in redis
    if (validity != null) {
      if (new Date(validity) < new Date()) { res.send({ code: APIconstants.API_CODE_UNAUTHORIZED_ACCESS }); return }
      callback(req,res) ; return
    }

    knex.select('validity').from('token').where('token', token).then((rows) =>{
      // save it in cache before a possible exit
      redis_client.setex(token, 3600, rows[0].validity);
      if(!rows.length || new Date(rows[0].validity) < new Date()) { res.send({ code: APIconstants.API_CODE_UNAUTHORIZED_ACCESS }); return }
      callback(req, res)
    }).catch((err) => { res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err) })

  })
}


exports.updateCrowd = updateCrowdController;
exports.deleteNode = deleteNodeController;
exports.deleteBuilding = deleteBuildingController;
exports.registerNewNode = registerNewNodeController;
exports.registerNewBuilding = registerNewBuildingController;
exports.manageAdminRequests = manageAdminRequests;