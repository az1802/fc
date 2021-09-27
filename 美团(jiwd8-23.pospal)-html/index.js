const fs = require("fs");
const { resolve } = require("path");
const path = require("path");
const request = require('request')
const { requestUrl,genImgs,genExcel,genWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr,genExcelAll,genSpecificationsWord,genFeieExcelAll,genShilaiExcelAll} = require("../utils/index")
const defaultImgUrl = "https://shouqianba-customer.oss-cn-hangzhou.aliyuncs.com/jjz/processedPhoto5/ca06311f-796e-4889-8db4-dfb2f1a43ad1"


// const exportMode = "keruyun"
// const exportMode = "feie"
const exportMode = "shilai"
const findJsonLen = 9
const outputDir = path.join(__dirname, "merchantInfos")

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[ "规格"],//规格
  practice: [
   
  ],//做法
  feeding:[],//加料
  remarks: [],//备注
  propsGroupSort: [
   
    "规格"
  ],
  propsSort: {
    // "口味":["不辣","微辣","中辣","特辣","麻辣"]
  }
}

let merchantInfo = {
  name : "唤牛（恒大总店）"
}
let categoryObj = {}
let shopName = merchantInfo.name

// 处理规格属性部分
function handleFoodPropGroup(foodDetail) {
  let res = []
  return res;

}


//读取dataJson下的所有文件取出 food菜品
async function genMenuFoods() { 
  let allFoods = [];
  for (let i = 0; i < findJsonLen; i++) { 
    let filePath = path.join(__dirname, "dataJson", (i+1)+".json");
    let records = JSON.parse(fs.readFileSync(filePath, "utf-8")).data;

    // console.log(records)
    records.forEach(record => {
      let foodTemp = {
        id:record.id,
        name:record.name,
        picUrl: record.defaultproductimage.imagepath || defaultImgUrl,
        categoryName: record.category.name,
        categoryId: record.category.id,
        price:record.sellPrice,
        foodDetail: record,
      }
      allFoods.push(foodTemp)
      console.log(record.name)
    })
   
  }
  logInfo(allFoods,"allFoods")
  let categoryData = {};
  allFoods.forEach(foodItem => {
    let { categoryId, categoryName } = foodItem;

    if (!categoryData[categoryId]) {
      categoryData[categoryId] = {
        id: categoryId,
        name: categoryName,
        foods:[]
      };
    }
    let foods = categoryData[categoryId].foods;

    let foodDetail = foodItem.foodDetail;
    // console.log( foodDetail.item.name)
    foods.push({
      id: foodItem.id,
      name:foodItem.name,
      picUrl: foodItem.picUrl,
      categoryName: foodItem.categoryName,
      price:foodItem.price,
      unit: "份",
      props:handleFoodPropGroup(foodDetail),
    })
  })

  let categoryArr = Object.values(categoryData)
  logInfo(categoryArr,"categoryArr")
  return categoryArr;

}

async function exists(pathStr) { 
  // return fs.existsSync(pathStr)
  // return new Promise((resolve, reject) => { 
  //   fs.exists(pathStr, function(exists) {
  //     console.log(exists ? resolve(true): resolve(false));
  //   })
  // })
}



let tempObj = {}



let propsGroupArr = [];

// 打印日志到test.json 文件夹
async function logInfo(info,fileName="test") { 
  fs.writeFileSync(`./${fileName}.json`,JSON.stringify(info,null,'\t'))
}


async function mkShopDir(shopDir) { 
  delDirSync(shopDir);
  mkdirSync(shopDir)
}

async function genExcelAndWord(){ 
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)

  let categoryArr = await genMenuFoods();

  let merchantInfo = {
    shopName: shopName,
    shop_pic: "",
    categories:categoryArr
  }
  logInfo(merchantInfo,"merchantRes")
  logInfo(propsGroupArr, "allPropGroups")

  if (exportMode == "keruyun") {
    genImgs(merchantInfo, outputDir);
    genExcel(merchantInfo, outputDir, menuSetting);
    genExcelAll(merchantInfo, outputDir, menuSetting);
    
  } else if (exportMode == "feie") {
    // genWord(merchantInfo, outputDir, menuSetting)
    // genSpecificationsWord(merchantInfo, outputDir, menuSetting)
    genFeieExcelAll(merchantInfo, outputDir, menuSetting)
  } else {
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting)
  }

}



genExcelAndWord();
