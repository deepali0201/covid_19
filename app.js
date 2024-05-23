const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'covid19India.db')

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const convertStateDbObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertDistrictDbObjectToResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

//API 1
app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      state;`
  const statesArray = await database.all(getStatesQuery)
  response.send(
    statesArray.map(eachState =>
      convertStateDbObjectToResponseObject(eachState),
    ),
  )
})

//API 2
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
    SELECT 
      *
    FROM 
      state 
    WHERE 
      state_id = '${stateId}';`
  const state = await database.get(getStateQuery)
  response.send(convertStateDbObjectToResponseObject(state))
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictsQuery = `
    SELECT
      *
    FROM
     district
    WHERE
      district_id = ${districtId};`
  const district = await database.get(getDistrictsQuery)
  response.send(convertDistrictDbObjectToResponseObject(district))
})

app.post('/districts/', async (request, response) => {
  const {stateId, districtName, cases, cured, active, deaths} = request.body
  const postDistrictQuery = `
  INSERT INTO
    district (state_id, district_name, cases, cured, active, deaths)
  VALUES
    (${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths});`
  await database.run(postDistrictQuery)
  response.send('District Successfully Added')
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId} 
  `
  await database.run(deleteDistrictQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateDistrictQuery = `
  UPDATE
    district
  SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active}, 
    deaths = ${deaths}
  WHERE
    district_id = ${districtId};
  `

  await database.run(updateDistrictQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`
  const stats = await database.get(getStateStatsQuery)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`
  const state = await database.get(getStateNameQuery)
  response.send({stateName: state.state_name})
})

module.exports = app

// const express = require('express')
// const path = require('path')

// const {open} = require('sqlite')
// const sqlite3 = require('sqlite3')
// const app = express()
// app.use(express.json())

// const dbPath = path.join(__dirname, 'covid19India.db')

// let db = null

// const intialize = async () => {
//   try {
//     db = await open({
//       filename: dbPath,
//       driver: sqlite3.Database,
//     })
//     app.listen(3000, () =>
//       console.log('Server is Running at http://localhost:3000/'),
//     )
//   } catch (e) {
//     console.log(`db error ${e.message}`)
//     process.exit(1)
//   }
// }
// intialize()

// const convertStateDbObjectToResponseObject = dbObject => {
//   return {
//     stateId: dbObject.state_id,
//     stateName: dbObject.state_name,
//     population: dbObject.population,
//   }
// }

// const convertDistrictDbObjectToResponseObject = dbObject => {
//   return {
//     districtId: dbObject.district_id,
//     districtName: dbObject.district_name,
//     stateId: dbObject.state_id,
//     cases: dbObject.cases,
//     cured: dbObject.cured,
//     active: dbObject.active,
//     deaths: dbObject.deaths,
//   }
// }

// //API 1
// app.get('/states/', async (request, response) => {
//   const a = `
//     SELECT
//       *
//     FROM
//      state
//     `
//   const b = await db.all(a)
//   response.send(
//     b.map(eachObject => convertStateDbObjectToResponseObject(eachObject)),
//   )
// })

// //API 2
// app.get('/states/:stateId/', async (request, response) => {
//   const {stateId} = request.params
//   const api2 = `
//     SELECT
//       *
//     FROM
//       state
//     WHERE
//       state_id ='${stateId}';`
//   const db2 = await db.get(api2)
//   response.send(convertStateDbObjectToResponseObject(db2))
// })

// //API 3
// app.post('/districts/', async (request, response) => {
//   const details = request.body
//   const {districtName, stateId, cases, cured, active, deaths} = details
//   const api3 = `
//     INSERT INTO
//       district (district_name,state_id,cases,cured,active,deaths)
//     VALUES(
//         '${districtName}',
//         '${stateId}',
//         '${cases}',
//         '${cured}',
//         '${active}',
//         '${deaths}'
//       );`

//   const db1 = await db.run(api3)
//   const newDistrictDetails = db1.lastID
//   response.send('District Successfully Added')
// })

// //API 4
// app.get('/districts/:districtId/', async (request, response) => {
//   const {districtId} = request.params
//   const api4 = `
//     SELECT
//       *
//     FROM
//       district
//     WHERE
//       district_id ='${districtId}';`
//   const db3 = await db.get(api4)
//   response.send(convertDbObjectToResponseObject(db3))
// })

// //API 5
// app.delete('/districts/:districtId/', async (request, response) => {
//   const {districtId} = request.params
//   const api5 = `
//     DELETE FROM
//       district
//     WHERE
//       district_id ='${districtId}';`
//   await db.run(api5)
//   response.send('District Removed')
// })

// //API 6
// app.put('/districts/:districtId/', async (request, response) => {
//   const {districtId} = request.params
//   const details = request.body
//   const {districtName, stateId, cases, cured, active, deaths} = details
//   const api6 = `
//     UPDATE
//         district
//     SET
//       district_name='${districtName}',
//       state_id='${stateId}',
//       cases='${cases}',
//       cured='${cured}',
//       active='${active}',
//       deaths='${deaths}'

//     WHERE
//       district_id ='${districtId}';`
//   await db.run(api6)
//   response.send('District Details Updated')
// })

// //API 7
// app.get('/states/:stateId/stats/', async (request, response) => {
//   const api7 = `
//     SELECT
//     SUM(cases),
//     SUM(cured),
//     SUM(active),
//     SUM(deaths)

//     FROM
//      district
//      WHERE
//      state_id=${stateId}
//     `
//   const stateDetails = await db.all(api7)
//   response.send({
//     totalCases: stateDetails['SUM(cases)'],
//     totalCured: stateDetails['SUM(cured)'],
//     totalActive: stateDetails['SUM(active)'],
//     totalDeaths: stateDetails['SUM(deaths)'],
//   })
// })

// //API 8
// app.get('/districts/:districtId/details/', async (request, response) => {
//   const {districtId} = request.params
//   const responseQuery = `
//     SELECT
//     state_name
//     FROM
//      state NATURAL JOIN district
//      where district_id='${districtId}';
//     `
//   const result = await db.all(responseQuery)
//   response.send(convertDbObjectToResponseObject(result))
// })
// module.exports = app
