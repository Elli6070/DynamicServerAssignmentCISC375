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

var states = ['AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL',
    'GA', 'HI', 'IA', 'ID', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 'ME',
    'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV',
    'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA',
    'VT', 'WA', 'WI', 'WV', 'WY'];
	
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
		if(year > 2017 || year < 1960){
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.write("can't find any data for the year " + year);
			res.end();
		}
        console.log("HANDLING " + req.url);
        // modify `response` here

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

        var query = `SELECT Consumption.year as Year,
                    Consumption.state_abbreviation as State,
                    Consumption.renewable as Renewable,
                    Consumption.coal as Coal,
                    Consumption.natural_gas as NaturalGas,
                    Consumption.nuclear as Nuclear,
                    Consumption.petroleum as Petroleum
                    From Consumption
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
		if(!states.includes(state)){
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.write("Can't find any data for the state " + state);
			res.end();
		}
        console.log("HANDLING " + req.url);
		response = response.replace("US_States", states.indexOf(state) + 1);
		response = response.replace("Alphabetical_Index", states.indexOf(state) + 1);
        // modify `response` here
        var query = `SELECT Consumption.year as Year,
						States.state_name as State,
						Consumption.state_abbreviation as Abbreviation,
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

                response = response.replace("var state", "var state = '" + row.State + "'");
                response = response.replace("var coal_counts", "var coal_counts = [" + coal_count + "]");
                response = response.replace("var natural_counts", "var natural_counts = [" + natural_count + "]");
                response = response.replace("var nuclear_counts", "var nuclear_counts = [" + nuclear_count + "]");
                response = response.replace("var petroleum_counts", "var petroleum_counts = [" + petroleum_count + "]");
                response = response.replace("var renewable_counts", "var renewable_counts = [" + renewable_count + "]");
				
				var prevState = GetPrevState(row.Abbreviation);
				var nextState = GetNextState(row.Abbreviation);
				response = response.replace('href="">prev_url', 'href="/state/' + prevState + '">' + prevState);
				response = response.replace('href="">next_url', 'href="/state/' + nextState + '">' + nextState);

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
        let energy_type = req.url.substring(13);
        var energy_counts = {};
        var year;
        var total;
        var table = "";
        var energy = ["coal", "natural_gas", "nuclear", "petroleum", "renewable"];
        if(!energy.includes(energy_type)){
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.write("Can't find any data for energy type " + energy_type);
            res.end();
        }
        // modify `response` here
        response = response.replace("<title>US ", "<title>US " + energy_type.substring(0,1).toUpperCase() + energy_type.substring(1) + " ");
        response = response.replace("<h2>Consumption Snapshot</h2>", "<h2>" + energy_type.substring(0,1).toUpperCase() + energy_type.substring(1) + " Consumption Snapshot</h2>");
        response = response.replace("noimage",energy_type);
        if (energy_type == "coal") {
            response = response.replace("href=\x22\x22>YY</a>", "href=\x22/energy-type/natural_gas\x22>Natural Gas</a>");
            response = response.replace("href=\x22\x22>XX</a>", "href=\x22/energy-type/renewable\x22>Renewable</a>"); //change to path.join?
        } else if (energy_type == "natural_gas") {
            response = response.replace("href=\x22\x22>XX</a>", "href=\x22/energy-type/coal\x22>Coal</a>");
            response = response.replace("href=\x22\x22>YY</a>", "href=\x22/energy-type/nuclear\x22>Nuclear</a>");
            response = response.replace("<title>US ", "<title>US Natural Gas ");
            response = response.replace("<h2>Consumption Snapshot</h2>", "<h2>Natural Gas Consumption Snapshot</h2>");
        } else if (energy_type == "nuclear") {
            response = response.replace("href=\x22\x22>XX</a>", "href=\x22/energy-type/natural_gas\x22>Natural Gas</a>");
            response = response.replace("href=\x22\x22>YY</a>", "href=\x22/energy-type/petroleum\x22>Petroleum</a>");
        } else if (energy_type == "petroleum") {
            response = response.replace("href=\x22\x22>XX</a>", "href=\x22/energy-type/nuclear\x22>Nuclear</a>");
            response = response.replace("href=\x22\x22>YY</a>", "href=\x22/energy-type/renewable\x22>Renewable</a>");
        } else if (energy_type == "renewable") {
            response = response.replace("href=\x22\x22>XX</a>", "href=\x22/energy-type/petroleum\x22>Petroleum</a>");
            response = response.replace("href=\x22\x22>YY</a>", "href=\x22/energy-type/coal\x22>Coal</a>");
        }

        for (var i = 0; i <= 50; i++) {
            energy_counts[states[i]] = [];
        }

        var count = 0;
        db.all('SELECT * FROM Consumption ORDER BY state_abbreviation,year', (err, rows) => {
            for (var m = 0; m < rows.length; m++) {
                if (energy_type == "coal") {
                    energy_counts[rows[m].state_abbreviation].push(rows[m].coal);
                } else if (energy_type == "natural_gas") {
                    energy_counts[rows[m].state_abbreviation].push(rows[m].natural_gas);
                } else if (energy_type == "nuclear") {
                    energy_counts[rows[m].state_abbreviation].push(rows[m].nuclear);
                } else if (energy_type == "petroleum") {
                    energy_counts[rows[m].state_abbreviation].push(rows[m].petroleum);
                } else if (energy_type == "renewable") {
                    energy_counts[rows[m].state_abbreviation].push(rows[m].renewable);
                }
                count++;
            }
            if (count >= rows.length) {
                response = response.replace("energy_type", "energy_type = " + energy_type);
                response = response.replace("energy_counts", "energy_counts = " + JSON.stringify(energy_counts));

                for (var l = 0; l <= (2017-1960); l++) {
                    table = table + "<td>" + (1960 + l) + "</td>";
                    total = 0;
                    for (var i = 0; i <= 50; i++) {
                        table = table + "<td>" + energy_counts[states[i]][l] + "</td>";
                        total = total + energy_counts[states[i]][l];
                    }
                    table = table + "<td>" + total + "</td>";
                    table = "<tr>" + table + "</tr>";
                }

                response = response.replace("<!-- Data to be inserted here -->",table);
                response = response.replace("var energy_counts;", "var energy_counts = " + energy_counts.toString());
                WriteHtml(res, response);
            }
        });
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

function GetPrevState(state){
	var index = states.indexOf(state);
	if( index == 0){
		return states[states.length - 1];
	}
	else{
		return states[index - 1];
	}
}

function GetNextState(state){
	var index = states.indexOf(state);
	if( index == (states.length - 1)){
		return states[0];
	}
	else{
		return states[index + 1];
	}
}

var server = app.listen(port);
