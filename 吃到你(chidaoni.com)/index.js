const fs = require("fs");
const { resolve } = require("path");
const path = require("path");
const request = require('request')
const { requestUrl,genImgs,genExcel,genWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr,genExcelAll,genSpecificationsWord,genFeieExcelAll} = require("../utils/index")

let findJsonLen = 2;
let allFoods = [];
let getFoodImgs = async () => {
  for (let i = 1; i <=findJsonLen; i++) { 
    let filePath = path.join(__dirname,"dataJson", "dish"+i+".json");
    let records = JSON.parse(fs.readFileSync(filePath, "utf-8")).Data;
    records.forEach(record => {
      let foodTemp = {
        categoryId: record.CategoryId,
        name: record.Name.trim().replace(/\//ig,"-"),
        id: record.Id,
        imgUrl: record.Cover.indexOf("//")==0 ?  record.Cover.slice(2):  record.Cover,
      }
      allFoods.push(foodTemp)
    })
  }

  // console.log(allFoods)

  for (let i = 0; i < allFoods.length; i++) {
    let imgUrl = allFoods[i].imgUrl || "";
    if (!imgUrl) {
      continue;
    }
    try {

      let imgName = String(allFoods[i].name) + (imgUrl.indexOf("jpg") != -1 ? '.jpg' : ".JPEG");
      await request(imgUrl).pipe(fs.createWriteStream(path.join(__dirname, "imgs", imgName)));
    } catch (err) {
      console.log("保存图片错误", allFoods[i].name)
    }
  }
}


getFoodImgs()
