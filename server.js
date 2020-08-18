// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const app = express();
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)
// Set some defaults (required if your JSON file is empty)
db.defaults({ location: {} }).write()

var bodyParser = require('body-parser')
app.use(bodyParser.json({limit: '1mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '1mb', extended: true, parameterLimit: 1000000}));

const webpush = require('web-push');
// VAPID keys should only be generated only once. we've run the vapid.js file to do this.
var vapidPublicKey = "=";
var vapidPrivateKey = "="
webpush.setVapidDetails('mailto:example@example.com',vapidPublicKey,vapidPrivateKey);


// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});
app.get("/view", (request, response) => {
  response.sendFile(__dirname + "/views/view.html");
});

app.post('/location', function (req, res) {
	var lat = req.body.lat;
	var lng = req.body.lng;
	res.send("location: ["+lat+"]["+lng+"]");
  console.log("location: ["+lat+"]["+lng+"]");
  
  db.get('location').set('location.gps',{ lat: lat, lng: lng}).write()
})
app.get('/location', function (req, res) {
	res.send([db.get('location').value().location.gps]);  
})
app.post('/barcode', function (req, res) {
	var barcode = req.body.barcode;
	res.send("barcode: ["+barcode+"]");
  console.log("barcode: ["+barcode+"]");
})

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});


var tokenlist = [];

app.post('/newbrowser',function(req,res){
    var token = req.body.token;
    var isSafari = (req.headers['user-agent'].indexOf("Safari") > 0);
    var auth = req.body.auth;
    var endpoint = req.body.endpoint;
    tokenlist.push({token:token,auth:auth,isSafari:isSafari,endpoint:endpoint});
    console.log("adding token: "+ token + " with auth: " + auth + " and notification url:" + endpoint);
    res.end("ok");
});

app.get('/notify',function(req,res) { 
// Let ALL browsers pop up a message
  // console.log(" We've been notified. Now send notification to all browsers");
   
   var options = {
       TTL: 24 * 60 * 60,
       vapidDetails: {
         subject: 'mailto:example@example.com',
         publicKey: vapidPublicKey,
         privateKey: vapidPrivateKey
       }
   };
   var message = "Web Notification";
       
   // Hit each browser that registered with us.
   for (var i=0;i < tokenlist.length;i++) {
       // Code here.
       let pushSubscription = {
        "endpoint":tokenlist[i].endpoint,
        "keys": {
            "p256dh":tokenlist[i].token,
            "auth": tokenlist[i].auth
            } // end keys
       }; // end pushSubscription 
       
       // MAGIC!
       webpush.sendNotification(pushSubscription,message,options).catch(err => console.log(err));
   }
   
   console.log(tokenlist.length + " notification sent");
   
   res.end( tokenlist.length + " notification sent");
   
});