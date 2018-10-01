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

var driver = neo4j.driver('bolt://localhost',neo4j.auth.basic("neo", "neo4j"))
var session = driver.session();

app.get('/',function(req,res){
    session
        .run("CREATE CONSTRAINT ON (m:Specialty) ASSERT m.id IS UNIQUE;");
    session
        .run("CREATE CONSTRAINT ON (n:Subspecialty) ASSERT n.id IS UNIQUE;");
    session
        .run("CREATE CONSTRAINT ON (o:Diagnosis) ASSERT o.id IS UNIQUE;");

    session
        .run('MATCH (n:Specialty) Return n limit 25')
        .then(function(result){
            var SpclArr = [];
            result.records.forEach(function(record){
                SpclArr.push({
                    id: record._fields[0].identity.low,
                    name: record._fields[0].properties.name,
                });
            });

                
            session
                .run('MATCH (n:Subspecialty) Return n limit 25')
                .then(function(result2){
                    var SubspclArr = [];
                    result2.records.forEach(function(record){
                        SubspclArr.push({
                            id: record._fields[0].identity.low,
                            name: record._fields[0].properties.name,
                        });
                    });
                    res.render('index',{
                        specialties: SpclArr,
                        subspecialities: SubspclArr
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

app.post('/spcl/add',function(req,res){
    var upload_file = req.body.spcl_file;
    var upload = "file:///U:/myapp/".concat(upload_file)

    //"WITH {files} AS url CALL apoc.load.json(url) YIELD value as row CREATE (:Specialty {name:row.name})
    session
        .run("WITH {files} AS url CALL apoc.load.json(url) YIELD value as row "
        + " UNWIND row.Specialty as spec "
        + " MERGE (:Specialty {name:spec.name})",{files:upload})
        .then(function(result){
            res.redirect('/');
    
            session.close();
        })
        .catch(function(err){
            console.log(err);
        });
    res.redirect('/');
});

app.post('/subspcl/add',function(req,res){
    var upload_file = req.body.subspcl_file;
    var upload = "file:///U:/myapp/".concat(upload_file)

    session
        .run("WITH {files} AS url CALL apoc.load.json(url) YIELD value as row"
        + " UNWIND row.Specialty as spec "
        + " UNWIND spec.Subspecialty as subspec " 
        + " MERGE (:Subspecialty {name:subspec.name})",{files:upload})
        .then(function(result){
            res.redirect('/');
    
            session.close();
        })
        .catch(function(err){
            console.log(err);
        });
    res.redirect('/');
});

app.post('/diag/add',function(req,res){
    var upload_file = req.body.diag_file;
    var upload = "file:///U:/myapp/".concat(upload_file)

    session
        .run("WITH {files} AS url CALL apoc.load.json(url) YIELD value as row "
        + " UNWIND row.Specialty as spec "
        + " UNWIND spec.Subspecialty as subspec "
        //+ " UNWIND subspec.Diagnosis as diag "
        + " MERGE (:Diagnosis {name:subspec.Diagnosis})",{files:upload})
        .then(function(result){
            res.redirect('/');
    
            session.close();
        })
        .catch(function(err){
            console.log(err);
        });
    res.redirect('/');
});


app.post('/node/del',function(req,res){
    var label = req.body.Node_label;

    session
        .run("MATCH (n:"+label+") DETACH DELETE n")
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
    
    var relation = req.body.Node_rel;

    var upload_file = req.body.Node_file;
    var upload = "file:///U:/myapp/".concat(upload_file)

    //('MATCH (n:Node1 {val:{value1}}),(m:Node3 {val:{value3}}) MERGE (m:Node1)-[:belong]->(n:Node3) RETURN n,m',{value1:valin1,value3:valin3})
    session
        .run('WITH {files} AS url'+
        ' CALL apoc.load.json(url) YIELD value as row UNWIND row.topping as top'+
        ' WITH row,top MATCH (m:Topping) WHERE m.id = top.id MATCH (n:Cake) WHERE n.id = row.id MERGE (m)-[:'+relation+']->(n)',{files:upload})
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









