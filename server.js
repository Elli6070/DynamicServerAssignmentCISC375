// Built-in Node.js modules
var fs = require('fs')
var path = require('path')

// NPM modules
var express = require('express')
var sqlite3 = require('sqlite3')
//helpful code vvvvv
/*
var state = "MN" get this from url, do not keep hard coded
db.all("SELECT * FROM Consumption WHERE state_abbreviation =  " + state)
use      this       instead             state_abbreviation = ? " , ["MN"], (err, rows) => {

});
*/
var public_dir = path.join(__dirname, 'public');
var template_dir = path.join(__dirname, 'templates');
var db_filename = path.join(__dirname, 'db', 'usenergy.sqlite3');

var app = express();
var port = 8000;

// open usenergy.sqlite3 database
var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
        //TestSql();
        var year = "2015"
        //GetYearData(year);
    }
});

function TestSql() {
    var state = "MN" //get this from url, do not keep hard coded
    db.all("SELECT * FROM Consumption WHERE state_abbreviation = ? " , [state], (err, rows) => {
        console.log("This is my latest print.1");
        console.log(rows);
    });

}

function GetYearData(year) {
    //var year = theyear //get this from url, do not keep hard coded
    db.each("SELECT * FROM Consumption WHERE year = ? " , [year], (err, rows) => {
        console.log("TEST PRINT YEAR 2014");
        console.log(rows);
    });

}

function GetEnergyData(year) {
    //var year = theyear //get this from url, do not keep hard coded
    db.all("SELECT * FROM Consumption WHERE year = ? " , [year], (err, rows) => {
        console.log("TEST PRINT YEAR 2014");
        console.log(rows);
    });

}

app.use(express.static(public_dir));


// GET request handler for '/'
app.get('/', (req, res) => {
    ReadFile(path.join(template_dir, 'index.html')).then((template) => {
        let response = template;
        // modify `response` here
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/year/*'
app.get('/year/:selected_year', (req, res) => {
    ReadFile(path.join(template_dir, 'year.html')).then((template) => {
        let response = template;
        // modify `response` here
        reponse = response.toString(); //might have to do this??
 
        var year = req.url.substring(6);
        var coal_count = 2;
        var natural_count = 4;
        var nuclear_count = 6;
        var petroleum_count = 8;
        var renewable_count = 10;
        response = response.replace("var coal_count;", "var coal_count = " + coal_count + ";");
        response = response.replace("var natural_count;", "var natural_count = " + natural_count + ";");
        response = response.replace("var nuclear_count;", "var nuclear_count = " + nuclear_count + ";");
        response = response.replace("var petroleum_count;", "var petroleum_count = " + petroleum_count + ";");
        response = response.replace("var renewable_count;", "var renewable_count = " + renewable_count + ";");
        
        //https://www.w3schools.com/js/js_loop_for.asp //could store in array to make it cleaner

        //console.log(year);
        response = response.replace("<h2>National", "<h2>" + year + " National");

        if (year == 1960) {
            response = response.replace("href=\x22\x22>Next</a>", "href=\x22/year/1961\x22>Next</a>");
            response = response.replace("href=\x22\x22>Prev</a>", "href=\x22/year/1960\x22>Prev</a>"); //change to path.join?
        } else if (year == 2017) {
            response = response.replace("href=\x22\x22>Prev</a>", "href=\x22/year/2016\x22>Prev</a>");
            response = response.replace("href=\x22\x22>Next</a>", "href=\x22/year/2017\x22>Next</a>");

        } else {
            response = response.replace("href=\x22\x22>Prev</a>", "href=\x22/year/" + (parseInt(year)-1) +"\x22>Prev</a>");
            response = response.replace("href=\x22\x22>Next</a>", "href=\x22/year/" + (parseInt(year)+1) +"\x22>Next</a>");
        }
        
        db.each("SELECT * FROM Consumption WHERE year = ? ORDER BY state_abbreviation" , [year], (err, row) => {

            console.log("TEST PRINT YEAR " + year + " STATE: " + row.state_abbreviation);
            console.log(row);
            //console.log(rows[2]);
            coal_count = coal_count + row.coal;
            natural_count = natural_count + row.natural_gas;
            nuclear_count = nuclear_count + row.nuclear;
            petroleum_count = petroleum_count + row.petroleum;
            renewable_count = renewable_count + row.renewable;
            var total = row.coal + row.natural_gas + row.nuclear + row.petroleum + row.renewable;
            var currentrow = "<th>" + row.state_abbreviation + "</th>" + "<th>" + row.coal + "</th>" + "<th>" + row.natural_gas + "</th>" + "<th>" + row.nuclear + "</th>" + "<th>" + row.petroleum + "</th>" + "<th>" + row.renewable + "</th>" + "<th>" + total + "</th>";
            response = response.replace("</tbody>", "<tr>" + currentrow + "</tr></tbody>");
            
        });
        console.log("This is the coal count: " + coal_count);
        response = response.replace("var year;", "var year = " + year + ";");
        response = response.replace("var coal_count;", "var coal_count = " + coal_count + ";");
        response = response.replace("var natural_count;", "var natural_count = " + natural_count + ";");
        response = response.replace("var nuclear_count;", "var nuclear_count = " + nuclear_count + ";");
        response = response.replace("var petroleum_count;", "var petroleum_count = " + petroleum_count + ";");
        response = response.replace("var renewable_count;", "var renewable_count = " + renewable_count + ";");
        
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
    ReadFile(path.join(template_dir, 'state.html')).then((template) => {
        let response = template;
        // modify `response` here
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/energy-type/*'
app.get('/energy-type/:selected_energy_type', (req, res) => {
    ReadFile(path.join(template_dir, 'energy.html')).then((template) => {
        let response = template;
        // modify `response` here
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

function ReadFile(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.toString());
            }
        });
    });
}

function Write404Error(res) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('Error: file not found');
    res.end();
}

function WriteHtml(res, html) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(html);
    res.end();
}


var server = app.listen(port);
