var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver').v1;

var app = express();


app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'public')));

var driver = neo4j.driver('bolt://localhost',neo4j.auth.basic("neo", "neo4j"))
var session = driver.session();

// Check again 

app.get('/', function (req, res) {
    
    session
        .run("CREATE CONSTRAINT ON (m:Specialty) ASSERT m.name IS UNIQUE;");
    session
        .run("CREATE CONSTRAINT ON (n:Subspecialty) ASSERT n.name IS UNIQUE;");
    session
        .run("CREATE CONSTRAINT ON (o:Diagnosis) ASSERT o.name IS UNIQUE;");
	session
        .run("CREATE CONSTRAINT ON (cat:Category) ASSERT cat.name IS UNIQUE;");
	session
        .run("CREATE CONSTRAINT ON (cf:Clinicalfocus) ASSERT cf.name IS UNIQUE;");
    session
        .run("CREATE CONSTRAINT ON (p:Symptom) ASSERT p.name IS UNIQUE;");
    session
        .run("CREATE CONSTRAINT ON (q:Test) ASSERT q.name IS UNIQUE;");
    session
        .run("CREATE CONSTRAINT ON (r:Treatment) ASSERT r.name IS UNIQUE;");

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
                    res.render('index', {
                        specialties: SpclArr,
                        subspecialities: SubspclArr,
                    })
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


// RELATIONSHIP NOMENCLATURE
// Specialty treats Disgnosis
// Disgnosis belongs_to Subspecialty
// Diagnosis showed symptoms
// Diagnosis conducted test
// Diagnosis performed treatment

app.post('/json/add', function (req, res) {
    var upload_file = req.body.json_file;
    console.log(upload_file)
    var upload = "file:///C:/Users/ssonal/Desktop/graph_app/".concat(upload_file)

    session
        .run('WITH {files} AS url CALL apoc.load.json(url) YIELD value as row '
            + ' UNWIND (CASE row.Specialty WHEN [] THEN [""] ELSE row.Specialty END)  as spec '
            + ' UNWIND (CASE spec.Diagnosis WHEN [] THEN [""] ELSE spec.Diagnosis END)  as diagnosis '
            + ' UNWIND (CASE diagnosis.Subspecialty WHEN [] THEN [{name:""}] ELSE diagnosis.Subspecialty END)  as subspec '
			+ ' UNWIND (CASE diagnosis.clinicalFocus WHEN [] THEN [""] ELSE diagnosis.clinicalFocus END)  as clnfcs '
			+ ' UNWIND (CASE diagnosis.Symptoms WHEN [] THEN [""] ELSE diagnosis.Symptoms END)  as symptom '
			+ ' UNWIND (CASE diagnosis.Tests WHEN [] THEN [""] ELSE diagnosis.Tests END)  as test '
			+ ' UNWIND (CASE diagnosis.Treatments WHEN [] THEN [""] ELSE diagnosis.Treatments END)  as treatment '
            + ' MERGE (:Specialty {name:spec.name})'
            + ' MERGE (:Diagnosis {name:diagnosis.name})'
            + ' MERGE (:Subspecialty {name:subspec.name})'
			+ ' MERGE (:Category {name:diagnosis.category})'
			+ ' MERGE (:Clinicalfocus {name:clnfcs})'
            + ' MERGE (:Symptom {name:symptom})'
            + ' MERGE (:Test {name:test})'
            + ' MERGE (:Treatment {name:treatment})'
            + ' WITH spec,diagnosis,subspec, clnfcs, symptom, test, treatment '
            + ' MATCH (s:Specialty) WHERE s.name = spec.name MATCH (d:Diagnosis) WHERE d.name = diagnosis.name MATCH (ss:Subspecialty) WHERE ss.name = subspec.name  '
			+ ' MATCH (cat:Category) WHERE cat.name = diagnosis.category MATCH (cf:Clinicalfocus) WHERE cf.name = clnfcs '
			+ ' MATCH (sy:Symptom) WHERE sy.name = symptom MATCH (t:Test) WHERE t.name = test MATCH (tt:Treatment) WHERE tt.name = treatment '
            + ' MERGE (s)-[:treats]->(d) '
            + ' MERGE (d)-[:has]->(ss) '
			+ ' MERGE (d)-[:also_has]->(cf) '
			+ ' MERGE (d)-[:belongs_to]->(cat) '
            + ' MERGE (d)-[:showed]->(sy) '
            + ' MERGE (d)-[:conducted]->(t) '
			+ ' MERGE (d)-[:performed]->(tt)', { files: upload })
        .then(function (result) {
            res.redirect('/');

            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
	session
		.run(' MATCH (n) WHERE n.name = "" detach delete n')
		.then(function (result) {
            res.redirect('/');

            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
    res.redirect('/');
});


app.get('/add/node', function (req, res) {
    var label = req.query.label;
    var value = req.query.value;

    session
        .run('MERGE (n:`' + label + '` {name : "'+value+'"})  RETURN n')
        .then(function (result) {
            res.redirect('/');

            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
    res.redirect('/');
});

app.post('/add/property', function (req, res) {
    var label = req.body.label;
    var property = req.body.property;

    session
        .run('MATCH (n:`' + label + '`) SET n.`' + property +'` = ""')
        .then(function (result) {
            res.redirect('/');

            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
    res.redirect('/');
});

app.post('/set/property', function (req, res) {
    var label = req.body.label;
    var name = req.body.name;
    var property = req.body.property;
    var value = req.body.value;

    session
        .run('MATCH (n:`' + label + '`) WHERE n.name = "'+ name +'" SET n.`' + property + '` = "'+value+'"')
        .then(function (result) {
            res.redirect('/');

            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
    res.redirect('/');
});


app.post('/add/rel', function (req, res) {
    var label1 = req.body.label1;
    var label2 = req.body.label2;
    var relation = req.body.relation;
    var value1 = req.body.value1;
    var value2 = req.body.value2;
    var property = req.body.property;

    session
        .run('MATCH (n:`' + label1 + '`),(m:`' + label2 + '`) WHERE n.`' + property + '` = "' + value1 + '" and m.`' + property + '` = "' + value2 + '" WITH n,m MERGE (n)-[:`'+ relation +'`]->(m)')
        .then(function (result) {
            res.redirect('/');

            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
    res.redirect('/');
});




app.post('/filter/specialty', function (req, res) {
    var value_diag = req.body.diag;
    var value_subspcl = req.body.subspcl;
    console.log(value_diag)
    console.log(value_subspcl)
    if (value_diag) {
        session
            .run('MATCH (s:Specialty)-[]->(d:Diagnosis) WHERE d.name="' + value_diag + '" RETURN s')
            .then(function (result) {

                var FSpecialty = [];
                result.records.forEach(function (record) {
                    FSpecialty.push({
                        id: record._fields[0].identity.low,
                        name: record._fields[0].properties.name,
                    });
                });
                console.log(FSpecialty)
                res.render('result', {
                    answers: FSpecialty,
                });
            })
            .catch(function (err) {
                console.log(err);
            });
    } else {
        session
            .run('MATCH (s:Specialty)-[]->()-[]->(ss:Subspecialty) WHERE ss.name="' + value_subspcl + '" RETURN s')
            .then(function (result) {

                var FSpecialty = [];
                result.records.forEach(function (record) {
                    FSpecialty.push({
                        id: record._fields[0].identity.low,
                        name: record._fields[0].properties.name,
                    });
                });
                console.log(FSpecialty)
                res.render('result', {
                    answers: FSpecialty,
                });
            })
            .catch(function (err) {
                console.log(err);
            });
    }
});




app.post('/filter/diagnosis', function (req, res) {
    var value_spcl = req.body.spcl;
    var value_subspcl = req.body.subspcl;
    console.log(value_subspcl)
    console.log(value_spcl)
    if (value_spcl) {
        session
            .run('MATCH (s:Specialty)-[:treats]->(d) WHERE s.name="' + value_spcl + '" RETURN d')
            .then(function (result) {

                var FDiagnosis = [];
                result.records.forEach(function (record) {
                    FDiagnosis.push({
                        id: record._fields[0].identity.low,
                        name: record._fields[0].properties.name,
                    });
                });
                console.log(FDiagnosis)
                res.render('result', {
                    answers: FDiagnosis,
                });
            })
            .catch(function (err) {
                console.log(err);
            });
    } else {
        session
            .run('MATCH (d:Diagnosis)-[]->(ss:Subspecialty) WHERE ss.name="' + value_subspcl + '" RETURN d')
            .then(function (result) {

                var FDiagnosis = [];
                result.records.forEach(function (record) {
                    FDiagnosis.push({
                        id: record._fields[0].identity.low,
                        name: record._fields[0].properties.name,
                    });
                });
                console.log(FDiagnosis)
                res.render('result', {
                    answers: FDiagnosis,
                });
            })
            .catch(function (err) {
                console.log(err);
            });
    }
});



app.post('/filter/subspeciality', function (req, res) {
    var value_diag = req.body.diag;
    var value_spcl = req.body.spcl;
    console.log(value_diag)
    console.log(value_spcl)
    if (value_diag) {
        session
            .run('MATCH (d:Diagnosis)-[:belongs_to]->(ss) WHERE d.name="' + value_diag + '" RETURN ss')
            .then(function (result) {
                var FSubSpclArr = [];
                result.records.forEach(function (record) {
                    FSubSpclArr.push({
                        id: record._fields[0].identity.low,
                        name: record._fields[0].properties.name,
                    });
                });
                console.log(FSubSpclArr)
                res.render('result', {
                    answers: FSubSpclArr,
                });
            })
            .catch(function (err) {
                console.log(err);
            });
    } else {
        session
            .run('MATCH (s:Specialty)-[]->()-[]->(ss:Subspecialty) WHERE s.name="' + value_spcl + '" RETURN ss')
            .then(function (result) {
                var FSubSpclArr = [];
                result.records.forEach(function (record) {
                    FSubSpclArr.push({
                        id: record._fields[0].identity.low,
                        name: record._fields[0].properties.name,
                    });
                });
                console.log(FSubSpclArr)
                res.render('result', {
                    answers: FSubSpclArr,
                });
            })
            .catch(function (err) {
                console.log(err);
            });}
});



app.post('/fetch', function (req, res) {
    var value = req.body.label;
    console.log(value)
    session
        .run('MATCH (n:`'+value+'`) RETURN n ORDER BY n.name ASC')
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


app.post('/update', function (req, res) {
    var label = req.body.label;
    var property = req.body.property;
    var old_val = req.body.old_val;
    var new_val = req.body.new_val;

    session
        .run('MATCH (n:`' + label + '`) WHERE n.`' + property + '` = "' + old_val + '" SET n.`' + property + '` = "' + new_val + '" RETURN n')
        .then(function (result) {
            res.redirect('/');

            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
    res.redirect('/');
});



app.post('/del/node', function (req, res) {
    var label = req.body.label;
    var property = req.body.property;
    var value = req.body.value;

    session
        .run('MATCH (n:`' + label + '`) WHERE n.`' + property + '` = "' + value + '" DETACH DELETE n')
        .then(function (result) {
            res.redirect('/');

            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
    res.redirect('/');
});

app.post('/del/rel', function (req, res) {
    var label1 = req.body.label1;
    var label2 = req.body.label2;
    var property = req.body.property;
    var value1 = req.body.value1;
    var value2 = req.body.value2;

    session
        .run('MATCH (n:`' + label1 + '`)-[r]->(m:`' + label2 + '`) WHERE n.`' + property + '` = "' + value1 + '" and m.`' + property + '` = "' + value2 + '" DELETE r')
        .then(function (result) {
            res.redirect('/');

            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
    res.redirect('/');
});


app.listen(7687);
console.log('Server started on Port 7687');

module.exports = app;









