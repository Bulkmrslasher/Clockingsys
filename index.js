var ws = require("nodejs-websocket")
var fs = require("fs")
var http = require("http"),
    url = require("url"),
    path = require("path")
var bwipjs = require("bwip-js")

var serverIP = require('ip').address()

console.log("Starting server on " + serverIP + ":8000")

const httpServer = http.createServer(function(req, res) {
  var uri = url.parse(req.url).pathname
  if (uri == "/") {
    if (databaseData.kioskType == "barcode") {
      res.writeHead(200)
      res.write('<script>let serverip = \"' + serverIP + '\"</script>')
      res.end(fs.readFileSync('front/barcode-kiosk.html'))
    } else if (databaseData.kioskType == "buttons") {
      res.writeHead(200)
      res.write('<script>let serverip = \"' + serverIP + '\"</script>')
      res.end(fs.readFileSync('front/buttons-kiosk.html'))
    } else {
      res.writeHead(500)
      res.end("Error 500 Internal Server Error: Kiosk Type has not been configured.")
    }
  } else if (uri == "/css/index.css") {
    res.writeHead(200)
    res.end(fs.readFileSync('front/css/index.css'))
  } else if (uri == "/users") {
    res.writeHead(200)
    res.write('<script>let serverip = \"' + serverIP + '\"</script>')
    res.end(fs.readFileSync('front/users.html'))
  } else if (uri == "/settings") {
    res.writeHead(200)
    res.write('<script>let serverip = \"' + serverIP + '\"</script>')
    res.end(fs.readFileSync('front/settings.html'))
  } else if (uri == "/users/new") {
    res.writeHead(200)
    res.write('<script>let serverip = \"' + serverIP + '\"</script>')
    res.end(fs.readFileSync('front/newuser.html'))
  } else if (uri.match(/\/users\/(.*)/gi)) {
    let userID = uri.replace(/\/users\/(.*)/gi,"$1")
    if (doesUserExist(userID)) {
      res.writeHead(200)
      res.write('<script>let serverip = \"' + serverIP + '\"</script>')
      res.write("<script>let user_id = \"" + userID + "\"</script>")
      res.end(fs.readFileSync('front/viewUser.html'))
    } else {
      res.writeHead(404)
      res.write("No user exists with the user id: " + userID)
      res.end()
    }
  } else if (uri == "/css/users.css") {
    res.writeHead(200)
    res.end(fs.readFileSync('front/css/users.css'))
  } else if (uri == "/css/sky.css") {
    res.writeHead(200)
    res.end(fs.readFileSync('front/css/sky.css'))
  } else if (uri == "/signature_pad.js") {
    res.writeHead(200)
    res.end(fs.readFileSync('front/signature_pad.js'))
  } else if (uri == "/barcode") {
    bwipjs(req, res)
  } else {
    res.writeHead(404)
    res.write('404 Not Found')
    res.end()
  }
}).listen(8000)

var databaseData = {}
var currentTimers = []

function isUserCurrentlyClocked(user_id) {
  for (var i = 0; i < currentTimers.length; i++) {
    if (currentTimers[i].user_id == user_id) {
      return true
      break
    }
  }
  return false
}

function doesUserExist(user_id) {
  for (var i = 0; i < databaseData.users.length; i++) {
    if (user_id == databaseData.users[i].user_id) {
      return true
      break
    }
  }
  return false
}

function getUser(user_id) {
  for (var i = 0; i < databaseData.users.length; i++) {
    if (databaseData.users[i].user_id == user_id) {
      var userData = databaseData.users[i]
      let totalTime = 0;
      for (var j = 0; j < userData.timeEvents.length; j++) {
        totalTime += userData.timeEvents[j].time
      }
      userData.totalTime = totalTime
      return userData
    }
  }
}

fs.readFile("database.json", 'utf8', function(err, data) {
  if (err) throw err;
  databaseData = JSON.parse(data)
})

function refreshDatabaseData() {
  fs.readFile("database.json", 'utf8', function(err, data) {
    if (err) throw err;
    databaseData = JSON.parse(data)
  })
}

function updateDatabaseData(data) {
  fs.writeFile("database.json", JSON.stringify(data), function(err) {
    if (err) {
      console.log(err)
    } else {
      fs.readFile("database.json", 'utf8', function(err, data) {
        if (err) throw err;
        databaseData = JSON.parse(data)
      })
    }
  })
}

setInterval(function() {
  for (var i = 0; i < currentTimers.length; i++) {
    currentTimers[i].time++
  }
  sendDataToAllConnections({
    "job": "updateDisplay",
    "data": currentTimers
  })
}, 60000)

var connections = []
var userDataConnections = []

var wsServer = ws.createServer(function(conn) {
  conn.on("text", function(str) {
    var data = JSON.parse(str)
    if (data.job == "codeScanned") {
      var barcodeData = data.data.barcodeData
      if (barcodeData == "LOGOUTALL") {
        console.log("CLOCKING OUT ALL USERS")
        let timers = currentTimers
        currentTimers = []
        sendDataToAllConnections({
          "job": "updateDisplay",
          "data": currentTimers
        })
        for (var i = 0; i < timers.length; i++) {
          for (var j = 0; j < databaseData.users.length; j++) {
            if (timers[i].user_id == databaseData.users[j].user_id) {
              if (timers[i].time >= 5) {
                databaseData.users[j].timeEvents.push({
                  "startTime": timers[i].startTime,
                  "time": timers[i].time
                })
              }
              break
            }
          }
        }
        updateDatabaseData(databaseData)
      } else {
        if (isUserCurrentlyClocked(barcodeData)) {
          for (var i = 0; i < currentTimers.length; i++) {
            if (barcodeData == currentTimers[i].user_id) {
              let timerData = currentTimers[i]
              currentTimers.splice(i,1)
              sendDataToAllConnections({
                "job": "updateDisplay",
                "data": currentTimers
              })
              for (var j = 0; j < databaseData.users.length; j++) {
                if (databaseData.users[j].user_id == timerData.user_id) {
                  console.log("CLOCKING OUT " + databaseData.users[j].name.toUpperCase())
                  if (timerData.time >= 5) {
                    databaseData.users[j].timeEvents.push({
                      "startTime": timerData.startTime,
                      "time": timerData.time
                    })
                    updateDatabaseData(databaseData)
                  }
                }
              }
              break
            }
          }
        } else {
          for (var i = 0; i < databaseData.users.length; i++) {
            if (databaseData.users[i].user_id == barcodeData) {
              var userData = databaseData.users[i]
              console.log("CLOCKING IN " + userData.name.toUpperCase())
              if ((databaseData.waiverConfig.requireWaiver && userData.hasSignedWaiver) || (!databaseData.waiverConfig.requireWaiver)) {
                currentTimers.push({
                  "user_id": userData.user_id,
                  "name": userData.name,
                  "time": 0,
                  "startTime": Math.floor(Date.now() / 1000)
                })
                sendDataToAllConnections({
                  "job": "updateDisplay",
                  "data": currentTimers
                })
              } else {
                if (databaseData.kioskType == "barcode") {
                  currentTimers.push({
                    "user_id": userData.user_id,
                    "name": userData.name,
                    "time": 0,
                    "startTime": Math.floor(Date.now() / 1000)
                  })
                  sendDataToAllConnections({
                    "job": "updateDisplay",
                    "data": currentTimers
                  })
                } else if (databaseData.kioskType == "buttons") {
                  conn.sendText(JSON.stringify({
                    "job": "promptForWaiver",
                    "data": {
                      "user": userData,
                      "waiverText": databaseData.waiverConfig.waiverText
                    }
                  }))
                }
              }
              break
            }
          }
        }
      }
    } else if (data.job == "getAllUsers") {
      if (data.data.subscribe == false) {
        let allUserData = []
        for (var i = 0; i < databaseData.users.length; i++) {
          allUserData.push(getUser(databaseData.users[i].user_id))
        }
        conn.sendText(JSON.stringify({
          "job": "allUsers",
          "data": allUserData.sort(dynamicSort("-totalTime"))
        }))
      } else {
        userDataConnections.push(conn)
        let allUserData = []
        for (var i = 0; i < databaseData.users.length; i++) {
          allUserData.push(getUser(databaseData.users[i].user_id))
        }
        sendDataToAllUserDataConnections({
          "job": "allUsers",
          "data": allUserData.sort(dynamicSort("-totalTime"))
        })
      }
    } else if (data.job == "subscribeToClock") {
      connections.push(conn)
      sendDataToAllConnections({
        "job": "updateDisplay",
        "data": currentTimers
      })
    } else if (data.job == "newUser") {
      let user_id = Math.random().toString(36).substring(2).toUpperCase()
      let name = data.data.name
      databaseData.users.push({
        "name": name,
        "timeEvents": [],
        "user_id": user_id
      })
      updateDatabaseData(databaseData)
      conn.sendText(JSON.stringify({
        "job": "newUserResponse"
      }))
      let allUserData = []
      for (var i = 0; i < databaseData.users.length; i++) {
        allUserData.push(getUser(databaseData.users[i].user_id))
      }
      sendDataToAllUserDataConnections({
        "job": "allUsers",
        "data": allUserData.sort(dynamicSort("-totalTime"))
      })
    } else if (data.job == "getUserInfo") {
      conn.sendText(JSON.stringify({
        "job": "userData",
        "data": getUser(data.data.user_id)
      }))
    } else if (data.job == "deleteUser") {
      for (var i = 0; i < databaseData.users.length; i++) {
        if (data.data.user_id == databaseData.users[i].user_id) {
          databaseData.users.splice(i,1)
          updateDatabaseData(databaseData)
          conn.sendText(JSON.stringify({
            "job": "deleteUserResponse"
          }))
          let allUserData = []
          for (var i = 0; i < databaseData.users.length; i++) {
            allUserData.push(getUser(databaseData.users[i].user_id))
          }
          sendDataToAllUserDataConnections({
            "job": "allUsers",
            "data": allUserData.sort(dynamicSort("-totalTime"))
          })
          break
        }
      }
    } else if (data.job == "submitWaiver") {
      for (var i = 0; i < databaseData.users.length; i++) {
        if (data.data.user.user_id == databaseData.users[i].user_id) {
          databaseData.users[i].hasSignedWaiver = true
          databaseData.users[i].waiverData = {
            "signatureImage": data.data.signatureImage,
            "date": data.data.date
          }
          updateDatabaseData(databaseData)
        }
      }
    } else if (data.job == "getCurrentSettings") {
      conn.sendText(JSON.stringify({
        "job": "currentSettings",
        "data": {
          "kioskType": databaseData.kioskType,
          "requireWaiver": databaseData.waiverConfig.requireWaiver,
          "waiverText": databaseData.waiverConfig.waiverText
        }
      }))
    } else if (data.job == "updateSettings") {
      databaseData.kioskType = data.data.kioskType
      databaseData.waiverConfig.requireWaiver = data.data.requireWaiver
      databaseData.waiverConfig.waiverText = data.data.waiverText
      updateDatabaseData(databaseData)
    }
  })

  conn.on("close", function(str) {
    for (var i = 0; i < connections.length; i++) {
      if (conn == connections[i]) {
        connections.splice(i,1)
        break
      }
    }
    for (var i = 0; i < userDataConnections.length; i++) {
      if (conn == userDataConnections[i]) {
        userDataConnections.splice(i,1)
        break
      }
    }
  })

	conn.on("error", () => console.log("errored"))
}).listen(8001)



function sendDataToAllConnections(data) {
  for (var i = 0; i < connections.length; i++) {
    connections[i].sendText(JSON.stringify(data))
  }
}

function sendDataToAllUserDataConnections(data) {
  for (var i = 0; i < userDataConnections.length; i++) {
    userDataConnections[i].sendText(JSON.stringify(data))
  }
}

function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}
