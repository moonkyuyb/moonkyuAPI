const express = require('express');
const mysql = require('mysql2');

const router = express.Router();

router.get('/commonFee', (req, res, next) => {
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	conn.query(`
		SELECT code AS value, string AS label
		FROM zipanda.tbl_code
		WHERE division='admin_cost';
	`, (err,results,fields)=>{
		return res.status(200).json({results: results, msg: 'success'})
	})
	conn.end()
});

router.get('/indiFee', (req, res, next) => {
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	conn.query(`
		SELECT code AS value, string AS label
		FROM zipanda.tbl_code
		WHERE division='individual';
	`, (err,results,fields)=>{
		return res.status(200).json({results: results, msg: 'success'})
	})
	conn.end()
});

router.get('/bldgType', (req, res, next) => {
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	conn.query(`
		SELECT code AS value, string AS label
		FROM zipanda.tbl_code
		WHERE division='building_type';
	`, (err,results,fields)=>{
		return res.status(200).json({results: results, msg: 'success'})
	})
	conn.end()
});

router.get('/bldgStyle', (req, res, next) => {
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	conn.query(`
		SELECT code AS value, string AS label
		FROM zipanda.tbl_code
		WHERE division='sale_type';
	`, (err,results,fields)=>{
		return res.status(200).json({results: results, msg: 'success'})
	})
	conn.end()
});

router.get('/heating', (req, res, next) => {
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	conn.query(`
		SELECT code AS value, string AS label
		FROM zipanda.tbl_code
		WHERE division='heating';
	`, (err,results,fields)=>{
		return res.status(200).json({results: results, msg: 'success'})
	})
	conn.end()
});
router.get('/security', (req, res, next) => {
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	conn.query(`
		SELECT code AS value, string AS label
		FROM zipanda.tbl_code
		WHERE division='security';
	`, (err,results,fields)=>{
		return res.status(200).json({results: results, msg: 'success'})
	})
	conn.end()
});
router.get('/living', (req, res, next) => {
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	conn.query(`
		SELECT code AS value, string AS label
		FROM zipanda.tbl_code
		WHERE division='living';
	`, (err,results,fields)=>{
		return res.status(200).json({results: results, msg: 'success'})
	})
	conn.end()
});
router.get('/etc', (req, res, next) => {
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	conn.query(`
		SELECT code AS value, string AS label
		FROM zipanda.tbl_code
		WHERE division='etc';
	`, (err,results,fields)=>{
		return res.status(200).json({results: results, msg: 'success'})
	})
	conn.end()
});
module.exports = router;