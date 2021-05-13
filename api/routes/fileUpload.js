
var bodyParser = require("body-parser")
//var fileupload = require("express-fileupload");
var fs = require("fs");

const express = require('express');
var app = express();


var parser = bodyParser.urlencoded({extended:false});

app.use(bodyParser.json( { type: 'application/*+json' } ));
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(express.json());



const { sign } = require('jsonwebtoken');
const mysql = require('mysql');

const router = express.Router();

router.post('/', parser,  (req, res, next) => {
    //var mId = req.body.params.mId;
    
    let fileNames = new Array();
    //console.log(req.body.formData._parts[0]);
    if (req.body.formData._parts != undefined) {
    
        req.body.formData._parts.map((el) => {
            fileNames.push( saveImage(el[0]) );
        })
    
    }

    return res.status(200).json({fileNames: (fileNames) , msg: 'success'})

});
function saveImage(baseImage) {
    //const uploadPath = "/Users/munkyuhwan/WorkSpace/api/zipanda/api";
    //const uploadPath = "/Users/munkyuhwan/WorkSpace/api/zipanda/api/";
    const uploadPath = "/workspace/docker/zipanda/api/public/";
    //path of folder where you want to save the image.
    const localPath = `${uploadPath}/images/sales/${baseImage.mId}/`;

    if (!fs.existsSync(localPath)) {
        fs.mkdirSync(localPath)
    }
    console.log(baseImage.name);
    //1.227.192.243/workspace/docker/zipanda/api/public/images/sales/2

    //Find extension of file
    //const ext = baseImage.substring(baseImage.indexOf("/")+1, baseImage.indexOf(";base64"));
    const fileNameOrg = baseImage['name'].split(".")[0];
    const ext = baseImage['name'].split(".")[1];

    const fileType = baseImage['type'];
    //Forming regex to extract base64 data of file.
    const regex = new RegExp(`^data:${fileType}\/${ext};base64,`, 'gi');
    //Extract base64 data.
    const base64Data = baseImage['base64'];
    const timestamp = new Date().getTime();

    const filename = fileNameOrg+"_"+timestamp+"."+ext;
    //Check that if directory is present or not.
 

    fs.writeFileSync(localPath+filename, base64Data, 'base64');
    
    const callUrl = "/data/images/sales/"+baseImage.mId+"/"+filename;
    
    return callUrl;
}

router.get('/', (req, res, next) => {
		
    //console.log(req.body._parts)
    /*
    fs.writeFile('./out.png', req.body.imgsource, 'base64', (err) => {
		if (err) throw err
	})
    */
   
    return res.status(200).json({sales: "results", msg: 'success'})

});
module.exports = router;

