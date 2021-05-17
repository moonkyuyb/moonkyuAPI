const express = require('express');
const mysql = require('mysql2');
const {beforeLogin, afterLogin, verifyToken} = require('./middlewares');

const router = express.Router();

router.get('/', (req, res, next) => {
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});
	conn.connect()

	const queryString = `
		SELECT
			sales.*,
			ts.codeNm as location1,
			ts2.codeNm as location2,
			ts3.codeNm as location3,
			sales.st_title,
			sales.sf_original_nm

		FROM (
			SELECT 
				ts.s_id, ts.s_deposit, ts.s_monthly_rent, ts.s_trading_price,
				ts.s_building_type, ts.s_sale_type, ts.s_price_type, ts.s_maintenance_cost,
				ts.s_supply_area_m, ts.s_floor, ts.s_loan, ts.m_id,
				tc.string AS building_type,
				tc2.string AS sale_type,
				tc3.string AS price_type,
				tc4.string AS loan,
				tsf.sf_original_nm,
				tags.st_title,


				tsl.sl_building_name, tsl.sl_location1, tsl.sl_location2, tsl.sl_location3, tsl.sl_location4, tsl.sl_lat, tsl.sl_lng
			FROM zipanda.tbl_sales ts
			
			LEFT JOIN tbl_code tc
			ON ts.s_building_type = tc.code
			
			LEFT JOIN tbl_code tc2
			ON ts.s_sale_type = tc2.code
			
			LEFT JOIN tbl_code tc3
			ON ts.s_price_type = tc3.code
			
			LEFT JOIN tbl_code tc4
			ON ts.s_loan = tc4.code

			LEFT JOIN (
				SELECT rtst.s_id,   GROUP_CONCAT( (SELECT st_title FROM tbl_sales_tags tst WHERE st_id=rtst.st_id) SEPARATOR  ',' )  as st_title
				FROM r_tbl_sales_tags rtst GROUP BY rtst.s_id
			) tags
			ON ts.s_id = tags.s_id
			
			LEFT JOIN (
				SELECT s_id, GROUP_CONCAT( sf_original_nm SEPARATOR ',') AS sf_original_nm
				FROM tbl_sales_file 
				WHERE status=1 GROUP BY s_id
			) tsf
			ON tsf.s_id=ts.s_id

			LEFT JOIN zipanda.tbl_sales_location tsl
			ON ts.s_id = tsl.s_id
			WHERE ts.status != 0
		) sales
		

		LEFT JOIN tbl_sigungu ts
		ON sales.sl_location1 = ts.code
		
		LEFT JOIN tbl_sigungu ts2
		ON concat(sales.sl_location1,sales.sl_location2) =  ts2.code
		
		LEFT JOIN tbl_sigungu ts3
		ON concat(sales.sl_location1,sales.sl_location2,sales.sl_location3) = ts3.code
	`


	conn.query(queryString, (err,results,fields)=>{
		return res.status(200).json({results: results, msg: 'success'})
	})
	conn.end()
});

router.post('/', (req, res, next) => {

	console.log(req.body);
	const body = req.body;
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});
	conn.connect()

	const s_price_type 	= body.priceListSelected;
	const s_sale_type  	= body.saleTypeSelected;
	const living_opt   	= body.livingItemSelected;
	const heating_opt  	= body.heatingItemSelected;
	const security_opt 	= body.securityItemSelected;
	const etc_opt      	= body.etcItemSelected;
	const tags_st_ids  	= body.tagsItemSelected;
	const room_cnt     	= body.roomCnt;
	const bath_cnt     	= body.bathCnt;
	const built_year   	= body.builtYear;
	const parking_cnt  	= body.parkingCnt;
	const deposit_range	= body.depositAmtRange;
	const month_range	= body.monthAmtRange;
	const sale_range	= body.saleAmtRange;
	const area_range 	= body.areaSizeRange;
	const maint_range 	= body.maintenanceAmtRange;
	const floor_range	= body.floorRange;

	console.log(month_range[0]);

	var priceWhere =``;

	var depositAmt = ``;
	var monthDepositAmt='';
	if (deposit_range[0]<=0 && deposit_range[1]>=10000) {
		depositAmt = ``;	
	}else {
		depositAmt = `(`;
		if (deposit_range[0]>0 && deposit_range[1]>=10000) {
			depositAmt += `
			ts.s_deposit >= ${deposit_range[0]*100000}  `;		
		}else {
			depositAmt += `
			ts.s_deposit BETWEEN ${deposit_range[0]*100000} AND ${deposit_range[1]*100000}   `;		
		}
		monthDepositAmt = `(${depositAmt}) AND `;;
		depositAmt += `) OR `
	}
	//console.log(depositAmt);

	var monthlyAmt = ``;
	if (month_range[0]<=0 && month_range[1]>=100) {
		monthlyAmt = ``;	
	}else {
		monthlyAmt = `(`;
		if (month_range[0]>0 && month_range[1]>=100) {
			monthlyAmt += `
			${monthDepositAmt}
			ts.s_monthly_rent >= ${month_range[0]*10000}  `;		
		}else {
			monthlyAmt += `
			${monthDepositAmt}
			ts.s_monthly_rent BETWEEN ${month_range[0]*1000}0 AND ${month_range[1]*10000}   `;		
		}
		monthlyAmt +=`) OR`;
	}

	var tradingAmt = ``;
	if (sale_range[0]<=0 && sale_range[1]>=10000) {
		tradingAmt = ``;	
	}else {
		tradingAmt = `(`
		if (sale_range[0]>0 && sale_range[1]>=10000) {
			tradingAmt = `
			ts.s_trading_price >= ${sale_range[0]*10000}  `;		
		}else {
			tradingAmt = `
			ts.s_trading_price BETWEEN ${sale_range[0]*10000} AND ${sale_range[1]*10000}   `;		
		}
		tradingAmt +=`) OR`
	}

	priceWhere = `${depositAmt}${monthlyAmt}${tradingAmt}`;
	
	if (priceWhere != ``) {
		priceWhere = `AND ( ${priceWhere.slice(0,-2)} ) )`;
	}
	//console.log(priceWhere);


	var priceTypeWhere=``;
	if (s_price_type.length > 0) {
		var inner=``;
		s_price_type.forEach((el, index) =>{
			inner +=`'${el}' ${index< (s_price_type.length-1) ? ',':'' } `;
		})
		priceTypeWhere = `AND (ts.s_price_type IN (${inner}) )`;
	}
	
	/*ㅁㅐ물유형 */
	var saleTypeWhere = ``;
	if (s_sale_type.length > 0) {
	 	var str = "";
		s_sale_type.forEach(element => {
			str += "'"+element+"',";
		});
		str = str.slice(0,-1);
		saleTypeWhere = `
			AND ( ts.s_sale_type IN (${str}) )
			`;
	}

	
	/*면적 */
	const areaWhere =``;
	
	if (area_range.length > 0) {
		if (area_range[0]>0 && area_range[1]<20) {
			areaWhere =  `
				AND ( ts.s_use_area_p BETWEEN ${area_range[0]} AND ${area_range[1]})
				`;
		}
	}
	

	/*층수 */
	const floorWhere = ``;
	
	if (floor_range.length > 0) {
		if (floor_range[0] >0 && floor_range[1] <14) {
			floorWhere = `
				AND ( ts.s_floor BETWEEN ${floor_range[0]} AND  ${floor_range[1]}  )
				`;
		}
	}
	
	/*방 개수  */
	var roomCntWhere = ``;
	
	if (room_cnt.length > 0) {

		roomCntWhere = `AND (`;

		
		room_cnt.forEach((el, index)=>{

			roomCntWhere += `
			(ts.s_rooms_cnt ${el<4?"=":">="} ${el}) ${ index < (room_cnt.length-1) ? "OR":"" }
			`;
			
		})
		roomCntWhere += `)`;
	
	}
	
	/*욕실 개수  */
	var bathRoomWhere =``;
	
	if (bath_cnt.length > 0) {
		
		bathRoomWhere = `AND (`;
		bath_cnt.forEach((el, index)=>{

			bathRoomWhere += `
			(ts.s_bathrooms_cnt ${el<4?"=":">="} ${el}) ${ index < (bath_cnt.length-1) ? "OR":"" }
			`;
			
		})
		bathRoomWhere += `)`;
	}
	

	/*준공 연차 */
	var builtYearWhere = ``;
	var currentDate = new Date();
	
	if (built_year.length > 0) {
		
		builtYearWhere = `AND (`;
		built_year.forEach((el, index)=>{
			if (el < 16) {
				builtYearWhere += `
				( ts.s_build_year BETWEEN (${currentDate.getFullYear()}-${el}) AND ${currentDate.getFullYear()} ) ${ index < (built_year.length-1) ? "OR":"" }
				`;
			}else {
				builtYearWhere += `
				( ts.s_build_year < (${currentDate.getFullYear()}-15)  ) ${ index < (built_year.length-1) ? "OR":"" }
				`;
			}
		})

		builtYearWhere += `)`;

	}
	
	
	/*관리비  */
	var costAmtWhere = ``;
	
	if (maint_range[0] <=0 && maint_range[1] >= 32) {
		costAmtWhere = ``;
	}else {
		costAmtWhere = `
			AND (
				ts.s_admin_cost_amt BETWEEN ${maint_range[0]} AND ${maint_range[1]}
			)
		`;
	}

	/*주차*/
	var parkingWhere = ``;
	if (parking_cnt.length > 0) {
		parkingWhere = `AND (`;
		parking_cnt.forEach((el, index)=>{
			parkingWhere += `
			(ts.s_parking ${el<2?">":">="} ${el-1}) ${ index < (parking_cnt.length-1) ? "OR":"" }
			`;
		})
		parkingWhere += `)`;
	}

			/*옵션*/
	var optionWhere = ``;
	
	var optionInner = "";

	if (living_opt.length > 0) {
		living_opt.forEach((el, index) => {
			optionInner += `'${el}' ${index<(living_opt.length-1)?',':''}`;
	   	});	
   	}

	if (heating_opt.length > 0) {
		heating_opt.forEach((el, index) => {
			optionInner += `'${el}' ${index<(heating_opt.length-1)?',':''}`;
	   	});	
   	}

	if (security_opt.length > 0) {
		security_opt.forEach((el, index) => {
			optionInner += `'${el}' ${index<(security_opt.length-1)?',':''}`;
	   	});	
   	}

	if (etc_opt.length > 0) {
		etc_opt.forEach((el, index) => {
			optionInner += `'${el}' ${index<(etc_opt.length-1)?',':''}`;
	   	});	
   	}
	if (optionInner != ''){
   		optionWhere += `
   			AND ( rtso.code IN (${optionInner}) )
   			`;
	}

	/*태그*/
	var tagWhere = ``;
	
	if (tags_st_ids.length > 0) {
		var tagInner = ``;
		tags_st_ids.forEach((el, index) => {
			tagInner += `'${el}' ${index<(tags_st_ids.length-1)?',':''}`;
	   	});	
		tagWhere = `
			AND (
				rtst.st_id IN (${tagInner})
			)`;
	}
	

	
	var queryString = `
	SELECT
			sales.*,
			tsi.codeNm as location1,
			tsi2.codeNm as location2,
			tsi3.codeNm as location3,
			sales.st_title,
			sales.sf_original_nm
 
	 FROM (
		(
			SELECT ts.s_id AS sales_s_id,
						ts.s_id, ts.s_deposit, ts.s_monthly_rent, ts.s_trading_price,
						ts.s_building_type, ts.s_sale_type, ts.s_price_type, ts.s_maintenance_cost,
						ts.s_supply_area_m, ts.s_floor, ts.s_loan, ts.m_id,
						tc.string AS building_type,
						tc2.string AS sale_type,
						tc3.string AS price_type,
						tc4.string AS loan,
						tsf.sf_original_nm,
						tags.st_title,
		
						tsl.sl_building_name, tsl.sl_location1, tsl.sl_location2, tsl.sl_location3, tsl.sl_location4, tsl.sl_lat, tsl.sl_lng
			
			FROM tbl_sales ts 
			
			LEFT JOIN tbl_code tc
				ON ts.s_building_type = tc.code
					
			LEFT JOIN tbl_code tc2
				ON ts.s_sale_type = tc2.code
					
			LEFT JOIN tbl_code tc3
				ON ts.s_price_type = tc3.code
					
			LEFT JOIN tbl_code tc4
				ON ts.s_loan = tc4.code
		
			LEFT JOIN (
				SELECT rtst.s_id,   GROUP_CONCAT( (SELECT st_title FROM tbl_sales_tags tst WHERE st_id=rtst.st_id) SEPARATOR  ',' )  as st_title
					FROM r_tbl_sales_tags rtst GROUP BY rtst.s_id
				) tags
				ON ts.s_id = tags.s_id
					
			LEFT JOIN (
				SELECT s_id, GROUP_CONCAT( sf_original_nm SEPARATOR ',') AS sf_original_nm
					FROM tbl_sales_file 
					WHERE status=1 GROUP BY s_id
				) tsf
				ON tsf.s_id=ts.s_id
		
			LEFT JOIN zipanda.tbl_sales_location tsl
				ON ts.s_id = tsl.s_id
		
				
		
			
			WHERE  ts.status =1
			
			/*금액 필터*/
			${priceWhere}
			
			/*거래유형 */
			${priceTypeWhere}

			/*면적 */
			${areaWhere}
			
			/*층수 */
			${floorWhere}
			
			/*방 개수  */
			${roomCntWhere}
			
			/*욕실 개수  */
			${bathRoomWhere}
			
			/*준공 연차 */
			${builtYearWhere}
			
			/*관리비  */
			${costAmtWhere}
			
			/*주차*/
			${parkingWhere}
			
			/*건물 유형*/
			${saleTypeWhere}
				
			GROUP BY s_id
				
		
		) sales, 
		 
		
		(
			SELECT rtso.s_id AS opt_s_id  FROM r_tbl_sales_options rtso 
			
			WHERE 1=1 	
			
			/*옵션*/
			${optionWhere}
			
			GROUP BY s_id
		) opts,
		 
		
		
		
		(
			SELECT s_id AS tag_s_id
			
			FROM r_tbl_sales_tags rtst 
			
			WHERE 1=1
			/*태그*/
			${tagWhere}

			GROUP BY s_id
		) tags
		)
		
		LEFT JOIN tbl_sigungu tsi
			ON sl_location1 = tsi.code
				
		LEFT JOIN tbl_sigungu tsi2
			ON concat(sl_location1,sl_location2) =  tsi2.code
				
		LEFT JOIN tbl_sigungu tsi3
			ON concat(sl_location1,sl_location2,sl_location3) = tsi3.code
					
		
		
		WHERE sales.sales_s_id = opts.opt_s_id AND sales.sales_s_id=tags.tag_s_id AND opts.opt_s_id=tags.tag_s_id;
					
	`;


	console.log(queryString);


	conn.query(queryString, (err,results,fields)=>{
		return res.status(200).json({results: results, msg: 'success'})
	})
	conn.end()
});

router.get('/:s_id', (req, res, next) => {
	const s_id = req.params.s_id

	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});
	const queryString = `
			SELECT
				sales.*,
				ts.codeNm as location1,
				ts2.codeNm as location2,
				ts3.codeNm as location3
			FROM (
				SELECT 
					ts.s_id, CEIL (ts.s_deposit/10000) AS s_deposit, (ts.s_monthly_rent/10000) AS s_monthly_rent,  (ts.s_trading_price/10000) AS s_trading_price,
					ts.s_building_type, ts.s_sale_type, ts.s_price_type, ts.s_maintenance_cost,
					ts.s_supply_area_m, ts.s_floor, ts.s_loan, ts.m_id, CEIL ((ts.s_maintenance_cost+ts.s_monthly_rent)/10000) AS monthly_cost,
					tc.string AS building_type,
					tc2.string AS sale_type,
					tc3.string AS price_type,
					tc4.string AS loan,

					tsf.sf_original_nm,
			
					tags.st_title,

					opt.optCode,
			
					tsl.sl_building_name, tsl.sl_location1, tsl.sl_location2, tsl.sl_location3, tsl.sl_location4
				FROM zipanda.tbl_sales ts
				LEFT JOIN tbl_code tc
				ON ts.s_building_type = tc.code
				LEFT JOIN tbl_code tc2
				ON ts.s_sale_type = tc2.code
				LEFT JOIN tbl_code tc3
				ON ts.s_price_type = tc3.code
				LEFT JOIN tbl_code tc4
				ON ts.s_loan = tc4.code
			
			
				LEFT JOIN (
					SELECT rtst.s_id,   GROUP_CONCAT( (SELECT st_title FROM tbl_sales_tags tst WHERE st_id=rtst.st_id) SEPARATOR  ',' )  as st_title
					FROM r_tbl_sales_tags rtst GROUP BY rtst.s_id
				) tags
				ON ts.s_id = tags.s_id
				
				LEFT JOIN (
					SELECT s_id, GROUP_CONCAT( sf_original_nm SEPARATOR ',') AS sf_original_nm
					FROM tbl_sales_file 
					WHERE status=1 GROUP BY s_id
				) tsf
				ON tsf.s_id=ts.s_id
				
				LEFT JOIN (
					SELECT GROUP_CONCAT( (SELECT code FROM tbl_code WHERE code=tso.code) SEPARATOR ',' ) AS optCode, tso.s_id AS s_id FROM r_tbl_sales_options tso GROUP BY tso.s_id
				) opt
				ON opt.s_id=ts.s_id
				
		LEFT JOIN zipanda.tbl_sales_location tsl
		ON ts.s_id = tsl.s_id
		WHERE ts.status != 0
			AND ts.s_id = ${s_id}
		) sales
		LEFT JOIN tbl_sigungu ts
		ON sales.sl_location1 = ts.code
		LEFT JOIN tbl_sigungu ts2
		ON concat(sales.sl_location1,sales.sl_location2) =  ts2.code
		LEFT JOIN tbl_sigungu ts3
		ON concat(sales.sl_location1,sales.sl_location2,sales.sl_location3) = ts3.code
	`;
	

	conn.query(queryString, (err,results,fields)=>{
		if(err){
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
		}
		if (results.length !== 1) {
			return res.status(404).json({msg:'Unknown item'})
		}
		return res.status(200).json({results: results, msg: 'success'})
	})
	conn.end()
});

// 상세
router.get('/detail/:s_id', (req, res, next) => {
	const s_id = req.params.s_id
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	//( SELECT GROUP_CONCAT( sf_original_nm SEPARATOR ',' ) as s_files FROM r_tbl_sales_options  WHERE s_id=${s_id}  ) AS opts

	const salesQuery = `SELECT 
	
	sales.*,
	CEIL(sales.s_deposit/10000) AS deposit,
	CEIL(sales.s_trading_price/10000) AS trading_price,
	CEIL(sales.s_monthly_rent/10000) AS monthly_rent,
	CEIL(sales.s_maintenance_cost/10000) AS m_cost,
	CASE 
		WHEN (sales.s_individual_cost_yn = 'Y') THEN '있음'
		WHEN (sales.s_individual_cost_yn = 'N') THEN '없음'
		ELSE '없음'
	END AS indi_cost_yn,
	(SELECT code.string FROM tbl_code code WHERE code.code = sales.s_loan) AS loan_amt,
	(SELECT GROUP_CONCAT(code.string SEPARATOR '/' ) AS optCode  FROM r_tbl_sales_options opt, tbl_code code WHERE opt.code=code.code AND opt.s_id=sales.s_id AND code.division='admin_cost') AS admin_cost,
	(SELECT string from tbl_code WHERE code=sales.s_price_type ) as price_type_str,
	CASE
		WHEN (sales.s_price_type = 'lease') THEN '전세가'
		WHEN (sales.s_price_type = 'monthly') THEN '보증금/월세'
		WHEN (sales.s_price_type = 'sales') THEN '매매가'
		WHEN (sales.s_price_type = 'short') THEN '임대료'
		ELSE ''
	END AS price_tbl_str,
	CEIL((sales.s_monthly_rent + sales.s_maintenance_cost)/10000) AS monthly_cost,
	(SELECT sl_building_name FROM tbl_sales_location WHERE s_id=sales.s_id) AS building_name,

	(SELECT code.string FROM tbl_code code WHERE code.code = sales.s_building_type) as building_type,
	(SELECT code.string FROM tbl_code code WHERE code.code = sales.s_sale_type) as sale_type,

	CASE
		WHEN (sales.s_room_type = 0) THEN '오픈형'
		WHEN (sales.s_room_type = 1) THEN '분리형'
		ELSE ''
	END AS room_type,

	
	CASE
		WHEN (sales.s_room_direction_from = 0) THEN '안방'
		WHEN (sales.s_room_direction_from = 1) THEN '거실'
		ELSE ''
	END AS room_direction_from,

	CASE
		WHEN (sales.s_room_direction = 1) THEN '동'
		WHEN (sales.s_room_direction = 2) THEN '서'
		WHEN (sales.s_room_direction = 3) THEN '남'
		WHEN (sales.s_room_direction = 4) THEN '북'
		WHEN (sales.s_room_direction = 5) THEN '남동'
		WHEN (sales.s_room_direction = 6) THEN '남서'
		WHEN (sales.s_room_direction = 7) THEN '북서'
		WHEN (sales.s_room_direction = 8) THEN '북동'
		ELSE ''
	END AS room_direction,

	CASE
		WHEN (sales.s_door_type = 1) THEN '계단식'
		WHEN (sales.s_door_type = 2) THEN '복도식'
		WHEN (sales.s_door_type = 3) THEN '복합식'
	END AS door_type,

	(SELECT sl_address1 FROM tbl_sales_location WHERE s_id=sales.s_id) AS address1,
	(SELECT sl_address2 FROM tbl_sales_location WHERE s_id=sales.s_id) AS address2,

	app.*,
	app_detail.*,

	member.m_name,
	member_contact.*

	FROM 
		tbl_sales sales, 
		tbl_sales_appointment app, 
		tbl_sales_appointment_details app_detail, 
		tbl_member member, 
		tbl_member_contact member_contact
	WHERE
	 sales.s_id =${s_id} AND 
	 app.s_id=sales.s_id AND 
	 app.sa_id=app_detail.sa_id AND 
	 member.m_id=sales.m_id AND
	 member.m_id=member_contact.m_id `;

	
	conn.query(salesQuery, (err,results,fields)=>{
		
		if(err){
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
		}
		if (results.length <= 0) {

			const fileQuery = `SELECT sf_original_nm SEPARATOR as s_files FROM tbl_sales_file  WHERE s_id=${s_id}`;
			conn.query(fileQuery, (err,fileResult,fields)=>{
				
				if(err){
					return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
				}
				else {
					if (fileResult.length <= 0) {
						return res.status(404).json({message:'데이터가 없습니다.'})
					}else {
						results["files"] = fileResult;
						return res.status(200).json({sales: results, msg: 'success'})
					}
						
				}
			
			})

			return res.status(404).json({message:'데이터가 없습니다.'})
		}else {
			return res.status(200).json({data: results, msg: 'success'})
		}
		
	})
});




// 이미지 파일 받기
router.get('/imgs/:s_id', (req, res, next) => {
	console.log("imgs");

	
	const s_id = req.params.s_id

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()

	const query =`SELECT * FROM tbl_sales_file WHERE s_id=${s_id}`;
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}


	conn.query(query, (err,results,fields)=>{
		console.log(results);
			//console.log(results[index]);
		if(err){
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
		}
		else {
			console.log(results);
			if (results.length <= 0) {
				return res.status(404).json({message:'데이터가 없습니다.'})
			}else {
				return res.status(200).json({data: results, msg: 'success'})
			}
					
		}
		
	})
		
	
	
})

// 옵션 받기
router.get('/opt/:s_id', (req, res, next) => {
	const s_id = req.params.s_id

	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}
	
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()

	const query =`SELECT code.string AS string, code.icon_url AS icon_url, rtso.* FROM r_tbl_sales_options rtso, tbl_code code WHERE rtso.s_id=${s_id} AND rtso.code=code.string`;
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	conn.query(query, (err,results,fields)=>{
		//console.log(results);
			//console.log(results[index]);
			if(err){
				return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
			}
			else {
				if (results.length <= 0) {
					return res.status(404).json({message:'데이터가 없습니다.'})
				}else {
					return res.status(200).json({data: results, msg: 'success'})
				}
					
			}
		
		})
		
})

// 태그 받기
router.get('/tags/:s_id', (req, res, next) => {
	const s_id = req.params.s_id

	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()

	const query =`SELECT tags.st_title AS string, r_tags.st_id FROM r_tbl_sales_tags r_tags, tbl_sales_tags tags WHERE r_tags.s_id=${s_id} AND r_tags.st_id=tags.st_id;`;
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	conn.query(query, (err,results,fields)=>{
		//console.log(results);
			//console.log(results[index]);
			if(err){
				return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
			}
			else {
				if (results.length <= 0) {
					return res.status(404).json({message:'데이터가 없습니다.'})
				}else {
					return res.status(200).json({data: results, msg: 'success'})
				}
					
			}
		
		
		
	})
})

// 가능시간 받기
router.get('/avl_time/:s_id', (req, res, next) => {
	const s_id = req.params.s_id

	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}
	

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()

	const query =`SELECT tags.st_title AS string, r_tags.st_id FROM r_tb._sales_tags r_tags, tbl_sales_tags tags WHERE r_tag.s_id=${s_id} AND r_tags.st_id=tags.st_id`;
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	conn.query(query, (err,results,fields)=>{
		//console.log(results);
			//console.log(results[index]);
			if(err){
				return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
			}
			else {
				if (results.length <= 0) {
					return res.status(404).json({message:'데이터가 없습니다.'})
				}else {
					return res.status(200).json({data: results, msg: 'success'})
				}
					
			}
		
		
		
	})


})
/*
// 편의시설 받기
router.get('/convi/:s_id', (req, res, next) => {
	const s_id = req.params.s_id

	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}
})

// 안전시설 받기
router.get('/security/:s_id', (req, res, next) => {
	const s_id = req.params.s_id

	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}
})

// 학군정보 받기
router.get('/school/:s_id', (req, res, next) => {
	const s_id = req.params.s_id

	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}
})
*/

// 좋아요 받기
router.get('/like/:s_id/:m_id', (req, res, next) => {
	const s_id = req.params.s_id
	const m_id = req.params.m_id

	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	const query =`SELECT COUNT(*) cnt FROM tbl_member_like_sale WHERE s_id=${s_id} AND m_id=${m_id} `;
	conn.query(query, (err,results,fields)=>{
		//console.log(results);
			//console.log(results[index]);
			if(err){
				return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
			}
			else {
				if (results.length <= 0) {
					return res.status(404).json({message:'데이터가 없습니다.'})
				}else {
					console.log(results);
					return res.status(200).json({data: results, msg: 'success'})
				}
					
			}
	})	
});

// 좋아요 클릭 
router.post('/like', (req, res, next) => {
	const s_id = req.body.s_id
	const m_id = req.body.m_id
	console.log(req.body);

	
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()

	const query =`INSERT INTO tbl_member_like_sale SET m_id=${m_id}, s_id=${s_id}, mod_date=now() `;
		console.log(query);
	conn.query(query, (err,results,fields)=>{
		//console.log(results);
			//console.log(results[index]);
			if(err){
				return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
			}
			else {
				if (results.length <= 0) {
					return res.status(404).json({message:'데이터가 없습니다.'})
				}else {
					
					return res.status(200).json({data: results, msg: 'success'})
				}
					
			}
	})	
	
});

// 좋아요 취소 
router.delete('/like', (req, res, next) => {
	const s_id = req.body.s_id
	const m_id = req.body.m_id
	console.log("좋아요 삭제=============================================");
	console.log(req.body);

	
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()

	const query =`DELETE FROM tbl_member_like_sale WHERE m_id=${m_id} AND s_id=${s_id} `;
	conn.query(query, (err,results,fields)=>{
		//console.log(results);
			//console.log(results[index]);
			if(err){
				return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
			}
			else {
				if (results.length <= 0) {

					return res.status(404).json({message:'데이터가 없습니다.'})
				}else {
					
					return res.status(200).json({data: results, msg: 'success'})
				}
					
			}
	})	
	
});

router.post('/filter',afterLogin, (req,res, next)=>{

	console.log(req.body);
	
	const params = req.body;

	if (params.token == "") {
		return res.status(404).json({message:'로그인 후 이용할 수 있습니다.'})
	}


	var priceListSelected 		= params.priceListSelected 	; 
	var saleTypeSelected		= params.saleTypeSelected	;
	var livingItemSelected		= params.livingItemSelected	;	
	var heatingItemSelected		= params.heatingItemSelected	;	
	var securityItemSelected	= params.securityItemSelected;	
	var etcItemSelected			= params.etcItemSelected		;	
	var tagsItemSelected		= params.tagsItemSelected	;	

	var roomCnt					= params.roomCnt				;		
	var bathCnt					= params.bathCnt				;	
	var builtYear				= params.builtYear			;	
	var parkingCnt				= params.parkingCnt			;	
	
	var depositAmtRange			= params.depositAmtRange		;		
	var monthAmtRange			= params.monthAmtRange		;		
	var saleAmtRange			= params.saleAmtRange		;		
	var areaSizeRange			= params.areaSizeRange		;		
	var maintenanceAmtRange		= params.maintenanceAmtRange	;		
	var floorRange				= params.floorRange			;	

	var mID 					= params.mID;
				
	
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()

	const query =`INSERT INTO tbl_sales_filter 
					SET 
						f_deposit_min = ${depositAmtRange[0]},
						f_deposit_max = ${depositAmtRange[1]},

						f_monthly_rent_min = ${monthAmtRange[0]},
						f_monthly_rent_max = ${monthAmtRange[1]},

						f_trading_price_min = ${saleAmtRange[0]},
						f_trading_price_max = ${saleAmtRange[1]},

						f_supply_area_min = ${areaSizeRange[0]},
						f_supply_area_max = ${areaSizeRange[1]},

						f_mantanence_min = ${maintenanceAmtRange[0]},
						f_mantanence_max = ${maintenanceAmtRange[1]},

						f_total_floor_min = ${floorRange[0]},
						f_total_floor_max = ${floorRange[1]},

						m_id				= ${mID},
						reg_date			= now()
	`;

	conn.query(query, (err,results,fields)=>{
			if(err){
				return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
			}
			else {
				if (results.length <= 0) {

					return res.status(404).json({message:'데이터가 없습니다.'})
				}else {
				
					var f_id = results.insertId;

					const optQuery = `
						INSERT INTO tbl_sales_filter_options(f_id, f_option, division)
							VALUES
					`;

					var insertValues = "";
					if (priceListSelected.length > 0){
						priceListSelected.forEach(el => {
							insertValues += `(${f_id}, ${el}, 'contract' )`;
						});
					}
					if (saleTypeSelected.length > 0	){
						saleTypeSelected.forEach(el => {
							insertValues += `(${f_id}, ${el}, 'sale_type' )`;
						});
					}
					if (livingItemSelected.length > 0)	{
						livingItemSelected.forEach(el => {
							insertValues += `(${f_id}, ${el}, 'living' )`;
						});
					}
					if (heatingItemSelected.length > 0)	{
						heatingItemSelected.forEach(el => {
							insertValues += `(${f_id}, ${el}, 'heating' )`;
						});
					}
					if (securityItemSelected.length > 0) {
						securityItemSelected.forEach(el => {
							insertValues += `(${f_id}, ${el}, 'security' )`;
						});
					}
					if (etcItemSelected.length > 0) {
						etcItemSelected.forEach(el => {
							insertValues += `(${f_id}, ${el}, 'etc' )`;
						});
					}
					if (tagsItemSelected.length > 0) {
						tagsItemSelected.forEach(el => {
							insertValues += `(${f_id}, ${el}, 'tag' )`;
						});
					}	
					if (roomCnt.length > 0) {
						roomCnt.forEach(el => {
							insertValues += `(${f_id}, ${el}, 'room_cnt' )`;
						});
					}	
					if (bathCnt.length > 0) {
						bathCnt.forEach(el => {
							insertValues += `(${f_id}, ${el}, 'bath_cnt' )`;
						});
					}				
					if (builtYear.length > 0) {
						builtYear.forEach(el => {
							insertValues += `(${f_id}, ${el}, 'built_year' )`;
						});
					}							
					if (parkingCnt.length > 0) {
						parkingCnt.forEach(el => {
							insertValues += `(${f_id}, ${el}, 'parking_cnt' )`;
						});
					}									
					
					optQuery += insertValues;
					conn.query(optQuery, (err,results,fields)=>{
						if(err){
							return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
						}
						else {
							if (results.length <= 0) {

								return res.status(404).json({message:'데이터가 없습니다.'})
							}else {
							
								return res.status(200).json({data: results, msg: 'success'})
							
							}
						
						}
					})
					




				}
					
			}
	})	
	



})





router.delete('/:s_id', (req, res, next) => {
	const s_id = req.params.s_id
	
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	conn.query(`DELETE FROM tbl_sales WHERE s_id = ${s_id}`, (err,results,fields)=>{
		if(err){
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
		}
		if(results.affectedRows == 0){
			return res.status(200).json({msg: 'success, no rows deleted'})
		}else{
			return res.status(200).json({msg: 'success'})
		}
	})
	conn.end()

});



router.post('/', (req, res, next) => {

	const req_params = ['m_id', 's_reg_type']
	// const req_params = [ 'm_id', 's_reg_type', 's_structure_type', 's_price_type', 's_maintenance_cost', 's_area', 's_floor', 's_rooms', 's_bathrooms', 's_build_year', 's_parking', 's_approval_status', 's_delete_request_date', 's_approval_date', 'reg_date', 'mod_date', 'status']

	const least_params = [ 's_deposit', 's_monthly_rent', 's_trading_price', 's_maintenance_cost' ]

	const m_id = req.body.m_id

	if(!m_id){
		return res.status(400).json({msg:'missing required parameter(s)'})
	}

	// const query = `
	// 	INSERT tbl_sales
	// 	SET
	// 		m_id = 1,
	// 		reg_date = now(),
	// 		status = 1
	// `

	return res.status(200).json({msg:'success'})
});

module.exports = router;