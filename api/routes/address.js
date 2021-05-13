const express = require('express');
const mysql = require('mysql');

const router = express.Router();

router.get('/',(req, res, next) => {
    console.log(req);
    const div = req.params.div;
    const code = req.params.code;
    const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

    const query = "SELECT codeNm as label, sido as value  FROM tbl_sigungu WHERE sigugun='' AND dong = '' ";

	conn.connect()
	conn.query(query, (err,results,fields)=>{
		return res.status(200).json({si: results, msg: 'si'})
	})
	conn.end()
    
})

router.get('/:si',(req, res, next) => {
    console.log(req);
    const si = req.params.si;
    const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

    const query = `SELECT  codeNm as label, sigugun as value FROM tbl_sigungu WHERE sido='${si}' AND sigugun != '' AND dong='' `
    console.log(query);
	conn.connect()
	conn.query(query, (err,results,fields)=>{
		return res.status(200).json({gu: results, msg: 'gu'})
	})
	conn.end()
    
})


router.get('/:si/:gu',(req, res, next) => {
    console.log(req);
    const si = req.params.si;
    const gu = req.params.gu;
    const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});
    const query = `SELECT codeNm as label, dong as value FROM tbl_sigungu WHERE sido='${si}' AND sigugun='${gu}' AND dong != '' `;
    
	conn.connect()
	conn.query(query, (err,results,fields)=>{
		return res.status(200).json({dong: results, msg: 'dong'})
	})
	conn.end()
    
})


module.exports = router;


