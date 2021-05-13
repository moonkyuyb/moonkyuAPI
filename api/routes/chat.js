const express	= require('express');
const mysql		= require('mysql2');
const _ 		= require('lodash')

const router = express.Router();

router.post('/send/', async (req, res, next) => {
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
        multipleStatements: true,
	});
	conn.connect()

    const body = {
        s_id: req.body.s_id,
        m_id_from : req.body.m_id_from,
        m_id_to : req.body.m_id_to,
        ct_message : req.body.ct_message,
    }

    let queryString = "INSERT INTO tbl_chat SET"
    _.each(body,(value,key)=>{
        if(_.isString(value))	{ queryString += `\n${key} = "${value}",` }
        else					{ queryString += `\n${key} = ${value},` }
    })
    queryString += `\nreg_date = now(),\nmod_date = now(),\nstatus = true`
    console.log("✔QUERY STRING: " + queryString);

    conn.query(queryString, (err,results,fields)=>{
        conn.end()
        if(err){
            console.log("❌ DB Error: " + err);
            return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
        }
        return res.status(200).json({msg:'OK'})
    })
    
})

router.post('/list/', async (req, res, next) => {
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
        multipleStatements: true,
	});
	conn.connect()

    const body = {
        s_id: req.body.s_id,
        m_id_from : req.body.m_id_from,
        m_id_to : req.body.m_id_to,
    }

	const queryString = `
        SELECT *,
            1 AS ct_successed,
            0 AS ct_failed
        FROM tbl_chat
        WHERE 1=1
            AND s_id        = ${body.s_id}
			AND m_id_from   IN (${body.m_id_from}, ${body.m_id_to})
			AND m_id_to     IN (${body.m_id_from}, ${body.m_id_to})
        ORDER BY ct_id ASC
	`
    console.log("✔QUERY STRING: " + queryString);
    
	conn.query(queryString, (err,results,fields)=>{
        console.log("✔MESSAGE LIST RESULTS");
        console.log(results);
        console.log(err);
		if(err){
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
		}
        return res.status(200).json({results, msg: 'success'})
	})
	conn.end()
})

module.exports = router;
