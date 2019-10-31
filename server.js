// Built-in Node.js modules
var fs = require('fs')
var path = require('path')

// NPM modules
var express = require('express')
var sqlite3 = require('sqlite3')


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
    }
});

app.use(express.static(public_dir));


// GET request handler for '/'
app.get('/', (req, res) => {
    ReadFile(path.join(template_dir, 'index.html')).then((template) => {
        console.log("HANDLING " + req.url);
        let response = template;
        let RenewableSum = 0;
        let CoalSum = 0;
        let NaturalGasSum = 0;
        let NuclearSum = 0;
        let PetroleumSum = 0;
        let year = 2017;

        // modify `response` here
        var query = `SELECT Consumption.year as Year,
                    Consumption.state_abbreviation as State,
                    Consumption.renewable as Renewable,
                    Consumption.coal as Coal,
                    Consumption.natural_gas as NaturalGas,
                    Consumption.nuclear as Nuclear,
                    Consumption.petroleum as Petroleum
                    From Consumption
                    Inner Join States on States.state_abbreviation = Consumption.state_abbreviation
                    Where Consumption.year = ?`;
      
        db.each(query, 2017, (err, row) => {
            RenewableSum += row.Renewable;
            CoalSum += row.Coal;
            NaturalGasSum += row.NaturalGas;
            NuclearSum += row.Nuclear;
            PetroleumSum += row.Petroleum;
            var total = row.Renewable + row.Coal + row.NaturalGas + row.Nuclear + row.Petroleum;
            var tableData =
                    `<tr>
						<td>` + row.State + `</td>
						<td>` + row.Coal + `</td>
						<td>` + row.NaturalGas + `</td>
						<td>` + row.Nuclear + `</td>
						<td>` + row.Petroleum + `</td>
						<td> ` + row.Renewable + ` </td>
                        <td> ` + total + ` </td>
					</tr>
                    <!-- End of Data -->`;
            response = response.replace("<!-- End of Data -->", tableData);

            // put totals into pie chart when queried all states
            if (row.State == "WY") {

                response = response.replace("var year", "var year = " + year);
                response = response.replace("var renewable_count", "var renewable_count = " + RenewableSum);
                response = response.replace("var coal_count", "var coal_count = " + CoalSum);
                response = response.replace("var natural_count", "var natural_count = " + NaturalGasSum);
                response = response.replace("var nuclear_count", "var nuclear_count = " + NuclearSum);
                response = response.replace("var petroleum_count", "var petroleum_count = " + PetroleumSum);

                WriteHtml(res, response);
            }
        });

    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/year/*'
app.get('/year/:selected_year', (req, res) => {
    ReadFile(path.join(template_dir, 'year.html')).then((template) => {
        let response = template;
        let year = parseInt(req.url.substring(6), 10);
        let RenewableSum = 0;
        let CoalSum = 0;
        let NaturalGasSum = 0;
        let NuclearSum = 0;
        let PetroleumSum = 0;
        console.log("HANDLING " + req.url);
        console.log(year);
        // modify `response` here
        var query = `SELECT Consumption.year as Year,
                    Consumption.state_abbreviation as State,
                    Consumption.renewable as Renewable,
                    Consumption.coal as Coal,
                    Consumption.natural_gas as NaturalGas,
                    Consumption.nuclear as Nuclear,
                    Consumption.petroleum as Petroleum
                    From Consumption
                    Inner Join States on States.state_abbreviation = Consumption.state_abbreviation
                    Where Consumption.year = ?`;
      
        db.each(query, year, (err, row) => {
            RenewableSum += row.Renewable;
            CoalSum += row.Coal;
            NaturalGasSum += row.NaturalGas;
            NuclearSum += row.Nuclear;
            PetroleumSum += row.Petroleum;
            var total = row.Renewable + row.Coal + row.NaturalGas + row.Nuclear + row.Petroleum;
            var tableData =
                    `<tr>
						<td>` + row.State + `</td>
						<td>` + row.Coal + `</td>
						<td>` + row.NaturalGas + `</td>
						<td>` + row.Nuclear + `</td>
						<td>` + row.Petroleum + `</td>
						<td>` + row.Renewable + ` </td>
                        <td>` + total + `</td>
					</tr>
                    <!-- End of Data -->`;
            response = response.replace("<!-- End of Data -->", tableData);

            // put totals into pie chart when queried all states
            if (row.State == "WY") {

                response = response.replace("var year", "var year = " + year);
                response = response.replace("var renewable_count", "var renewable_count = " + RenewableSum);
                response = response.replace("var coal_count", "var coal_count = " + CoalSum);
                response = response.replace("var natural_count", "var natural_count = " + NaturalGasSum);
                response = response.replace("var nuclear_count", "var nuclear_count = " + NuclearSum);
                response = response.replace("var petroleum_count", "var petroleum_count = " + PetroleumSum);

                WriteHtml(res, response);
            }
        });

    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
    ReadFile(path.join(template_dir, 'state.html')).then((template) => {
        let response = template;
        let state = req.url.substring(7);
        let renewable_count = [];
        let coal_count = [];
        let natural_count = [];
        let nuclear_count = [];
        let petroleum_count = [];
        console.log("HANDLING " + req.url);
        // modify `response` here
        var query = `SELECT Consumption.year as Year,
                        Consumption.renewable as Renewable,
                        Consumption.coal as Coal,
                        Consumption.natural_gas as NaturalGas,
                        Consumption.nuclear as Nuclear,
                        Consumption.petroleum as Petroleum
                    From Consumption
                    Inner Join States on States.state_abbreviation = Consumption.state_abbreviation
                    Where Consumption.state_abbreviation = ?`;

        db.each(query, state, (err, row) => {
            renewable_count.push(row.Renewable);
            coal_count.push(row.Coal);
            natural_count.push(row.NaturalGas);
            nuclear_count.push(row.Nuclear);
            petroleum_count.push(row.Petroleum);
            var total = row.Renewable + row.Coal + row.NaturalGas + row.Nuclear + row.Petroleum;
            var tableData =
                   `<tr>
						<td>` + row.Year + `</td>
						<td>` + row.Coal + `</td>
						<td>` + row.NaturalGas + `</td>
						<td>` + row.Nuclear + `</td>
						<td>` + row.Petroleum + `</td>
						<td>` + row.Renewable + ` </td>
                        <td>` + total + `</td>
					</tr>
                    <!-- End of Data -->`;
            response = response.replace("<!-- End of Data -->", tableData);

            if (row.Year == 2017) {

                response = response.replace("var state", "var state = '" + row.Name + "'");
                response = response.replace("var coal_counts", "var coal_counts = [" + coal_count + "]");
                response = response.replace("var natural_counts", "var natural_counts = [" + natural_count + "]");
                response = response.replace("var nuclear_counts", "var nuclear_counts = [" + nuclear_count + "]");
                response = response.replace("var petroleum_counts", "var petroleum_counts = [" + petroleum_count + "]");
                response = response.replace("var renewable_counts", "var renewable_counts = [" + renewable_count + "]");

                WriteHtml(res, response);
            }
        });
        
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
