/*
 * Config
 */
var mqtt = require('mqtt');
var mysql = require('mysql');
var iconv = require('iconv-lite');
var YQL = require('yql');

/*
 * MQTT Setup
 */
var mqttClient = mqtt.connect('mqtt://localhost')
mqttClient.on('connect', function () {
    mqttClient.subscribe("Master/+/Incoming/Message/#");
});
mqttClient.on('error', function (err) {
    console.log("MQTT FATAL ERROR");
});


/*
 * MySQL Setup
 */
var connection = mysql.createConnection({
    host: "localhost",
    user: "bmconfig",
    password: "bm@config",
    database: "bmconfig"
});
connection.connect(function (err) {
    if (err) {
        console.log("Error connecting to DB");
        return;
    }
    console.log("Database connection established!");
});


/*
 * Message parser
 */
mqttClient.on('message', function (source, payload) {
    var src = source.split("/")[4];
    var message = iconv.decode(payload, 'utf16le').toString().trim()
    var shortcode = message.split(" ")[0].toLowerCase();
    if (shortcode.match(/help/)) {
        sendServiceHelp(src);
    }
    else if (shortcode.match(/info/)) {
        sendRepeaterInfo(src, message.slice(5).trim());
    }
    else if (shortcode.match(/wx/)) {
        sendWeatherForecast(src, message.slice(3).trim());
    }
    else if (shortcode.match(/whois/)) {
        sendWhois(src, message.slice(6).trim());
    }
});

/*
 * sendServiceHelp
 */
function sendServiceHelp(id){
    console.log("Service help requested by " + id);
    log("Service help requested by " + id);
    var message = "BM206 Service Help\n";
    message += "Available commands:\n";
    message += "info <repeater>\n";
    message += "wx <location>\n";
    message += "whois <id / call>\n";
    message += "More info: ham-dmr.be/services";

    sendText(id, message);
}


/*
 * sendRepeaterInfo
 */
function sendRepeaterInfo(id, rep) {
    console.log("Repeater Info requested for '" + rep + "' by " + id);
    log("Repeater Info requested for '" + rep + "' by " + id);
    connection.query("SELECT repeaters.*, repeaterAllowReflector.allow as allowReflector, repeaterAllowOnDemand.allow as allowOnDemand FROM repeaters LEFT JOIN repeaterAllowReflector ON repeaters.repeaterId=repeaterAllowReflector.repeaterId LEFT JOIN repeaterAllowOnDemand ON repeaters.repeaterId=repeaterAllowOnDemand.repeaterId WHERE repeaters.callsign=?", rep, function (err, result) {
        if (err) return sendText(id,"Unexpected service error, please contact ON3YH!");
        if (result.length == 0) return sendText(id, "Error: unknown repeater '" + rep + "'!");

        result = result[0];

        var message = result.callsign;

        message += (result.location ? " (" + result.location + ")" : "") + "\n";
        message += "Frequency: " + (result.TXFrequency ? result.TXFrequency + " -7.6MHz" : "Unknown") + "\n";
        message += "ColorCode: " + (result.ColorCode ? result.ColorCode : "Unknown") + "\n";
        message += "Reflectors are " + (result.allowReflector ? "allowed" : "denied") + ".\n";
        message += "External OnDemand calls are " + (result.allowOnDemand ? "allowed" : "denied") + ".";

        return sendText(id, message);
    });
}

/*
 * SendWhois
 */
function sendWhois(id, whois){
    console.log("Whois requested for '" + whois + "' by " + id);
    log("Whois requested for '" + whois + "' by " + id);
    connection.query("SELECT * from callsigns WHERE radioId=? OR callsign=?", [whois,whois], function (err, result) {
        if (err) return sendText(id,"Unexpected service error, please contact ON3YH!");
        if (result.length == 0) return sendText(id, "Error: unknown user '" + whois + "'!");

        result = result[0];

        var message = "Whois Info\n";
        message += "ID: " + result.radioId + "\n";
        message += "Call: " + result.callsign + "\n";
        message += "Name: " + result.name;

        return sendText(id, message);
    });
}

/*
 * SendWeatherForecast
 */
function sendWeatherForecast(id, loc) {
    console.log("Weather forecast requested for '" + loc + "' by " + id);
    log("Weather forecast requested for '" + loc + "' by " + id);
    var query = new YQL('select * from weather.forecast where woeid in (select woeid from geo.places(1) where text="' + loc + '") and u="c"');
    query.exec(function (err, data) {
        if (err) return sendText(id, "Unexpected service error, please contact ON3YH!");

        if (data.query.results == undefined)
            return sendText(id, "Error: unknown location '" + loc + "'.");

        var location = data.query.results.channel.location;

        var condition = data.query.results.channel.item.condition;

        var description = data.query.results.channel.item.description;

        var regex = /(<([^>]+)>)/ig

        var result = description.replace(regex, "").trim().slice(0, -65);

        return sendText(id, result);
    })
}

/*
 * Send texts
 */
function sendText(id, message) {
    var buf = iconv.encode(message, 'utf16le');
    mqttClient.publish('Master/2062/Outgoing/Message/206990/' + id, buf);
}

/*
 * Log to Syslog
 */
function log(message){
    syslog.init("TextService", syslog.LOG_PID | syslog.LOGODELAY, syslog.LOG_LOCAL0);
    syslog.log(syslog.LOG_INFO, "[TextService] " + message);
    syslog.close();
}
