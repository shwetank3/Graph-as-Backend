var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver').v1;
var config = require('./test.json');

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
                movieArr.push({
                    id: record._fields[0].identity.low,
                    val: record._fields[0].properties.val
                   // year: record._fields[0].properties.year
                });
            });

            session
                .run('MATCH(n:Node3) Return n limit 25')
                .then(function(result2){
                    var actorArr = [];
                    result2.records.forEach(function(record){
                        actorArr.push({
                            id: record._fields[0].identity.low,
                            val: record._fields[0].properties.val
                        });
                    });
                    res.render('index',{
                        movies: movieArr,
                        actors: actorArr
                    });
                })
                .catch(function(err){
                    console.log(err);
                });       
        })
        .catch(function(err){
            console.log(err);
        });
    //res.send('It works');
});

app.post('/node1/add',function(req,res){
    var val = req.body.Node1_val;
    //var obj = JSON.parse(fs.readFileSync('trialdata.json', 'utf8'));
    
    session
        .run('CREATE (n:Node1 {val:{value}}) RETURN n.val',{value:val})
        .then(function(result){
            res.redirect('/');
    
            session.close();
        })
        .catch(function(err){
            console.log(err);
        });
    res.redirect('/');
});

app.post('/node3/add',function(req,res){
    var val23 = req.body.Node3_val;
    console.log(config.firstName + ' ' + config.lastName);
    var val23 = config.firstName;
    //console.log(val);
    session
        .run('CREATE (n:Node3 {val:{value2}}) RETURN n.val',{value2:val23})
        .then(function(result){
            res.redirect('/');
    
            session.close();
        })
        .catch(function(err){
            console.log(err);
        });
    res.redirect('/');
});

app.post('/node1/node3/add',function(req,res){
    var valin1 = req.body.Node1_val;
    var valin3 = req.body.Node3_val;

    //console.log(val);
    session
        .run('MATCH (n:Node1 {val:{value1}}),(m:Node3 {val:{value3}}) MERGE (m)-[:belong]->(n) RETURN n,m',{value1:valin1,value3:valin3})
        .then(function(result){
            res.redirect('/');
    
            session.close();
        })
        .catch(function(err){
            console.log(err);
        });
    res.redirect('/');
});


app.listen(7687);
console.log('Server started on Port 7687');

module.exports = app;









