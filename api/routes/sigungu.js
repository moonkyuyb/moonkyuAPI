const express = require('express');
const mysql = require('mysql2');

const router = express.Router();

router.get('/si', (req, res, next) => {
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	conn.query(`
        SELECT code AS value, codeNm AS label
        FROM zipanda.tbl_sigungu
        WHERE sigugun='' AND dong='';    
    `, (err,results,fields)=>{
		return res.status(200).json({results: results, msg: 'success'})
	})
	conn.end()
});

router.get('/gu/:sido', (req, res, next) => {
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});
	conn.connect()
	conn.query(`
        SELECT sigugun AS value, codeNm AS label
        FROM zipanda.tbl_sigungu
        WHERE sido=${req.params.sido} AND sigugun != '' AND dong = '';    
    `, (err,results,fields)=>{
		return res.status(200).json({results: results, msg: 'success'})
	})
	conn.end()
});

router.get('/dong/:sigugun', (req, res, next) => {
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	conn.query(`
        SELECT dong AS value, codeNm AS label
        FROM zipanda.tbl_sigungu
        WHERE sigugun=${req.params.sigugun} AND sigugun != '' AND dong != '';    
    `, (err,results,fields)=>{
		return res.status(200).json({results: results, msg: 'success'})
	})
	conn.end()
});

module.exports = router;