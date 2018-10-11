var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver').v1;

var app = express();


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic("neo", "neo4j"))
var session = driver.session();

app.get('/', function (req, res) {

    session
        .run("CREATE CONSTRAINT ON (m:Specialty) ASSERT m.id IS UNIQUE;");
    session
        .run("CREATE CONSTRAINT ON (n:Subspecialty) ASSERT n.id IS UNIQUE;");
    session
        .run("CREATE CONSTRAINT ON (o:Diagnosis) ASSERT o.id IS UNIQUE;");
    session
        .run("CREATE CONSTRAINT ON (p:Symptom) ASSERT p.id IS UNIQUE;");
    session
        .run("CREATE CONSTRAINT ON (q:Test) ASSERT q.id IS UNIQUE;");
    session
        .run("CREATE CONSTRAINT ON (r:Treatment) ASSERT r.id IS UNIQUE;");

    session
        .run('MATCH (n:Specialty) Return n limit 25')
        .then(function (result) {
            var SpclArr = [];
            result.records.forEach(function (record) {
                SpclArr.push({
                    id: record._fields[0].identity.low,
                    name: record._fields[0].properties.name,
                });
            });

            session
                .run('MATCH (n:Subspecialty) Return n limit 25')
                .then(function (result2) {
                    var SubspclArr = [];
                    result2.records.forEach(function (record) {
                        SubspclArr.push({
                            id: record._fields[0].identity.low,
                            name: record._fields[0].properties.name,
                        });
                    });
                    res.render('index', {
                        specialties: SpclArr,
                        subspecialities: SubspclArr,
                    })
                })
                .catch(function (err) {
                    console.log(err);
                });

        })
        .catch(function (err) {
            console.log(err);
        });
    //res.send('It works');
});


function add_node(param) {
    label = param[0];
    value = param[1];
    console.log("Inside add");
    session
        .run("MERGE (n:" + label + " {name : '" + value + "'})  RETURN n")
        .then(function (result) {
            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
    
};

function del_node(param) {
    label = param[0];
    property = param[1];
    value = param[2];
    console.log("Inside del");
    session
        .run("MATCH (n:" + label + ") WHERE n." + property + " = '" + value + "' DETACH DELETE n")
        .then(function (result) {
            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
    
};


app.get('/fetch', function (req, res) {
    var value = req.query.label;
    console.log(value)
    session
        .run("MATCH (n:" + value + ") RETURN n")
        .then(function (result) {

            var Fetchres = [];
            result.records.forEach(function (record) {
                Fetchres.push({
                    id: record._fields[0].identity.low,
                    name: record._fields[0].properties.name
                });
            });
            console.log(Fetchres)
            res.render('result', {
                answers: Fetchres,
            });
            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
});


let availableFucntions = {
    addNode: add_node,
    delNode: del_node,
   // fetch_all: app.post('/fetch', function (req, res) {}
}


let fileContentFromJson = {
    name: 'addNode',
    param: ['Specialty', 'asd']
}

let fileContentFromJson2 = {
    name: 'delNode',
    param: ['Specialty', 'name', 'asd']
}

let fileContentFromJson3 = {
    name: 'fetch_all',
    param: ['label']
}

function processFile(path) {
    //read content
    //let fileContent = readContent(path);
    let fileContent = fileContentFromJson2;

    let funName = fileContent.name;
    let param = fileContent.param;

    availableFucntions[funName](param);

}

processFile('dummy');













app.listen(7687);
console.log('Server started on Port 7687');

module.exports = app;