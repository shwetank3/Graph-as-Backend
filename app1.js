var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver').v1;

var app = express();

// View Engine
app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'public')));

var driver = neo4j.driver('bolt://localhost',neo4j.auth.basic("neo", "neo"))
var session = driver.session();

app.get('/',function(req,res){
    session
        .run('MATCH (n:Node1) Return n limit 25')
        .then(function(result){
            var movieArr = [];
            result.records.forEach(function(record){
                //console.log(record._fields[0].properties);
                movieArr.push({
                    id: record._fields[0].identity.low,
                    val: record._fields[0].properties.val
                });
            });           
            res.render('index',{
                movies: movieArr
            });
        })
        .catch(function(err){
            console.log(err);
        });
    //res.send('It works');
});

app.listen(7687);
console.log('Server started on Port 7687');

module.exports = app;









