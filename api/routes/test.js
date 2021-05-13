const express = require('express');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
var device = require ('device'); 
var useragent = require('express-useragent');

const router = express.Router();

const idChecker = (req, res, next) => {
    if (!req.query.m_id || !req.query.m_password) {
        return res.status(400).json({
            msg:'BadRequest'
        })
    }

    return next()
}

const verifyToken = (req, res, next) => {
    console.log(req.headers.authorization);
    if(!req.headers.authorization){
        return res.status(401).json({
            msg:'unauthorization: token is missing'
        })
    }

    const token = req.headers.authorization.split('Bearer ')[1]
    console.log(token);
    if(!token){
        return res.status(401).json({
            msg:'unauthorization: token is invalid'
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.decoded = decoded
        return next();
    } catch (e) {
        if(e.name==='TokenExpiredError'){
            return res.status(419).json({
                msg: 'Token Expired' 
            })
        }
        return res.status(401).json({
            msg:'unauthorization: something goes wrong... '
        })
    }
}

router.get('/', function(req, res, next) {
	res.render('index', { title: 'Express' });
});

router.get('/device', function(req, res, next) {
	var source = req.headers['user-agent']
	var ua = useragent.parse(source)
	var mydevice = device (source)

	console.log(ua);
	console.log(mydevice);
	
	res.render('index', { title: 'Express' });
});

router.get('/sales', function(req, res, next) {
	res.setHeader('Content-Type', 'application/json');

	const connection = mysql.createConnection({
		host     : '1.227.192.243',
		user     : 'root',
		password : 'ybn2021',
		database : 'zipanda'
	});

	var result;
	connection.connect();
	connection.query('SELECT * from tbl_sales', (error, rows, fields) => {
		if (error) throw error;
		result = JSON.stringify(rows);
		res.end(result);
	});
	connection.end();
})

router.post('/login', idChecker, (req,res,next) => {
	try{
		const m_id = req.query.m_id, m_password = req.query.m_password

		if(m_password != 'word'){
			return res.status(403).json({
				msg:'wrong password'
			})
		}
	
		const token = jwt.sign({m_id: m_id}, process.env.JWT_SECRET, { expiresIn: '20m', issuer: 'ahnshi' })
	
		return res.status(200).json({
            token,
			msg:'login success'
		})

	}catch(e){
		console.error(e);
		return res.status(500).json({
			msg:'server fail'
		})
	}
})

router.get('/loginSales', verifyToken, (req,res,next)=>{
	res.setHeader('Content-Type', 'application/json');

	const connection = mysql.createConnection({
		host     : '1.227.192.243',
		user     : 'root',
		password : 'ybn2021',
		database : 'zipanda'
	});

	var result;
	connection.connect();
	connection.query('SELECT * from tbl_sales', (error, rows, fields) => {
		if (error) throw error;
		result = JSON.stringify(rows);
		res.end(result);
	});
	connection.end();
})
router.post('/loginSales', verifyToken, (req,res,next)=>{
	res.setHeader('Content-Type', 'application/json');

	const connection = mysql.createConnection({
		host     : '1.227.192.243',
		user     : 'root',
		password : 'ybn2021',
		database : 'zipanda'
	});

	var result;
	connection.connect();
	connection.query('SELECT * from tbl_sales', (error, rows, fields) => {
		if (error) throw error;
		result = JSON.stringify(rows);
		res.end(result);
	});
	connection.end();
})

module.exports = router;
