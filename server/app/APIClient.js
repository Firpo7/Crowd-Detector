const { Client } = require('pg');
var APIconstants = require('./APIConstants').constants;

var knex = require('knex')({
  client: 'pg',
  connection: {
    host : process.env.DBHOST,
    user : process.env.DBUSER,
    password : process.env.DBPASSWORD,
    database : process.env.DBNAME
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

function getNodesFromDB(res, building, floors, types) {
  let query = knex.select([knex.ref('public_id').as('id'), 'name', 'floor', 'roomtype']).from('sensor').where('building', building)
  if (floors.length) query.whereIn('floor', floors)
  if (types.length) query.whereIn('roomtype', types)

  query.then((rows) => {
    res.send({code: APIconstants.API_CODE_SUCCESS, listOfNodes: rows})
  }).catch((err) => { res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err) })
}

function getBuildingsFromDB(res, name) {
  let query = knex.select().from('building')
  if (name) query.where('name', name)
  
  query.then((rows) => {
    res.send({code: APIconstants.API_CODE_SUCCESS, listOfNodes: rows})
  }).catch((err) => { res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }) })
}



function getNodesController(req, res) {
  if (!checkIsPresent(req.query.building)) { res.send({code: APIconstants.API_CODE_INVALID_DATA}); return; }
  let floors = getListOf(req.query.floor)
  let types = getListOf(req.query.type)

  getNodesFromDB(res, req.query.building, floors, types)
}

function getBuildingController(req, res) {
  getBuildingsFromDB(res, req.query.name)
}

exports.getNodes = getNodesController;
exports.getBuildings = getBuildingController;