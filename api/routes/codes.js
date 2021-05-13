const express = require('express');
const mysql = require('mysql');

const router = express.Router();

router.get('/', (req, res, next) => {
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	conn.query(`SELECT * FROM tbl_code`, (err,results,fields)=>{
		return res.status(200).json({codes: results, msg: 'success'})
	})
	conn.end()
});

router.get('/:division',(req, res, next)  =>{
    const division = req.params.division;
    const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	conn.query(`SELECT * FROM tbl_code WHERE division='${division}'`, (err,results,fields)=>{
		if (err) {
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
		}
		if (results.length > 0) {
			return res.status(200).json({results: results, resultCode:"0000", msg: 'success'})
		}else {
			return res.status(200).json({results: results,resultCode:"XXXX", msg: 'success'})
		}
	})
	conn.end()

})

module.exports = router;


