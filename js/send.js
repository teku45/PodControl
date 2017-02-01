// Network interfaces
var ifaces = require('os').networkInterfaces();
var ProgressBar = require('progressbar.js');
var struct = require('python-struct');

// Iterate over interfaces ...
var address,
    ifaces = require('os').networkInterfaces();
for (var dev in ifaces) {
    ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false ? address = details.address : undefined);
}

var TeensyPort = 5000;
var TeensyIP = '192.168.0.9';

var ComputerPort = 6000;
var ComputerIP = '192.168.0.8';

var SpaceXPort = 3000;
var SpaceXIP = '192.168.0.1';

var dgram = require('dgram');
var client = dgram.createSocket('udp4');
var server = dgram.createSocket('udp4');
var spaceXclient = dgram.createSocket('udp4');

var spaceXteamID = 17;
var spaceXstatus = 0;
var spaceXacceleration = 0;
var spaceXvelocity = 0;
var spaceXposition = 0;
var spaceXbatvolt = 0;
var spaceXbatcurrent = 0;
var spaceXbattemp = 0;
var spaceXtemperature = 0;
var spaceXstripecount = 0;

spaceXclient.bind(function() {
    spaceXclient.setBroadcast(true);

    var refreshIntervalId2 = setInterval(sendSpaceX, 100);
});

function sendSpaceX() {
    var formatString = '!BBi7I';
    var sendmessage = struct.pack(formatString, spaceXteamID, spaceXstatus, spaceXposition, spaceXvelocity, spaceXacceleration, spaceXbatvolt, spaceXbatcurrent, spaceXbattemp, spaceXtemperature, spaceXstripecount);
    //console.log(sendmessage);
    var message = new Buffer(sendmessage);
    client.send(message, 0, message.length, SpaceXPort, SpaceXIP, function(err, bytes) {
        if (err) throw err;
        //console.log('UDP message sent to ' + SpaceXIP +':'+ SpaceXPort);
    });
}

//Broadcast to Pod
client.bind(function() {
    client.setBroadcast(true);
    var refreshIntervalId = setInterval(keepAlive, 50);
});

function keepAlive() {
    var message = new Buffer('a');
    client.send(message, 0, message.length, TeensyPort, TeensyIP, function(err, bytes) {
        if (err) throw err;
        //console.log('Alive sent to ' + TeensyIP +':'+ TeensyPort);
    });
}

function brake() {
    var message = new Buffer('b');
    client.send(message, 0, message.length, TeensyPort, TeensyIP, function(err, bytes) {
        if (err) throw err;
        console.log('Brake sent to ' + TeensyIP + ':' + TeensyPort);
    });
}

function ready() {
    var message = new Buffer('r');
    client.send(message, 0, message.length, TeensyPort, TeensyIP, function(err, bytes) {
        if (err) throw err;
        console.log('Ready sent to ' + TeensyIP + ':' + TeensyPort);
    });
}

function popupBrake() {
    if (confirm("Confirm Braking")) {
        testbrake();
    }
}

function popupRelease() {
    if (confirm("Confirm Release")) {
        testrelease();
    }
}

function testbrake() {
    var message = new Buffer('x');
    client.send(message, 0, message.length, TeensyPort, TeensyIP, function(err, bytes) {
        if (err) throw err;
        console.log('Test Brake sent to ' + TeensyIP + ':' + TeensyPort);
    });
}

function testrelease() {
    var message = new Buffer('y');
    client.send(message, 0, message.length, TeensyPort, TeensyIP, function(err, bytes) {
        if (err) throw err;
        console.log('Test Release sent to ' + TeensyIP + ':' + TeensyPort);
    });
}

function leave() {
    var message = new Buffer('z');
    client.send(message, 0, message.length, TeensyPort, TeensyIP, function(err, bytes) {
        if (err) throw err;
        console.log('Leave Debug Mode sent to ' + TeensyIP + ':' + TeensyPort);
    });
}
//Listen to Data from Pod
server.on('listening', function() {
    var address = server.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});
server.on('message', function(message, remote) {

    var myPotato = new Date();
    var myMessage = JSON.parse(message);
    myMessage.push(myPotato.getTime());
    var status = myMessage[0];
    var acceleration = myMessage[1]; //m/s^2
    var velocity = myMessage[2];
    var distance = myMessage[3];
    var distanceFromBottom = myMessage[4];
    var distanceFromPusher = myMessage[5];
    var temperature = myMessage[6];
    var pressure = myMessage[7];
    var pot1 = myMessage[8];
    var pot2 = myMessage[9];
    var pot3 = myMessage[10];
    var pot4 = myMessage[11];
    var pot5 = myMessage[12];
    var pot6 = myMessage[13];
    var pot7 = myMessage[14];
    var pot8 = myMessage[15];

    var myNewMessage = JSON.stringify(myMessage);
    myNewMessage = myNewMessage.slice(1, -1);
    //console.log(myNewMessage);
    var statusDisplay;

    if (status == -2 || status == -3) {
        statusDisplay = "Debug";
    } else if (status == -1) {
        statusDisplay = "Fault Brake"
    } else if (status == 0) {
        statusDisplay = "Fault"
    } else if (status == 1) {
        statusDisplay = "Idle"
    } else if (status == 2) {
        statusDisplay = "Ready"
    } else if (status == 3) {
        statusDisplay = "Pushing"
    } else if (status == 4) {
        statusDisplay = "Coasting"
    } else if (status == 5) {
        statusDisplay = "Braking"
    }
    document.getElementById("status").innerHTML = statusDisplay;
    document.getElementById("acceleration").innerHTML = acceleration;
    document.getElementById("velocity").innerHTML = velocity;
    document.getElementById("distance").innerHTML = (Math.round(distance * 1000)) / 1000;
    document.getElementById("distanceFromBottom").innerHTML = distanceFromBottom;
    document.getElementById("distanceFromPusher").innerHTML = distanceFromPusher;
    document.getElementById("temperature").innerHTML = temperature;
    document.getElementById("pressure").innerHTML = pressure;
    document.getElementById("pot1").innerHTML = pot1;
    document.getElementById("pot2").innerHTML = pot2;
    document.getElementById("pot3").innerHTML = pot3;
    document.getElementById("pot4").innerHTML = pot4;
    document.getElementById("pot5").innerHTML = pot5;
    document.getElementById("pot6").innerHTML = pot6;
    document.getElementById("pot7").innerHTML = pot7;
    document.getElementById("pot8").innerHTML = pot8;

    spaceXstatus = myMessage[0];
    spaceXacceleration = myMessage[1] * 100; //to centimeters
    spaceXvelocity = myMessage[2] * 100; //to centimeters
    spaceXposition = myMessage[3] * 100; //to centimeters
    spaceXtemperature = myMessage[6] * 100;




});
server.bind(ComputerPort, ComputerIP);