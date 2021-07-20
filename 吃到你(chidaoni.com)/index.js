const fs = require("fs");

const { resolve } = require("path");
const path = require("path");
const request = require('request')
const { requestUrl,genImgs,genExcel,genWord,formatFileName,delDirSync,mkdirSync,genExcelAll,genSpecificationsWord,genFeieExcelAll} = require("../utils/index")
const defaultImgUrl = ""


// const exportMode = "keruyun"
const exportMode = "feie"
const findJsonLen = 6
const outputDir = path.join(__dirname, "merchantInfos")

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[ "规格" ],//规格
  practice: [
  	"干锅汤锅",
	"辣度",
	"干活汤锅"
  ],//做法
  feeding:[],//加料
  remarks: [],//备注
  propsGroupSort: [
    "干锅汤锅",
    "辣度",
    "干活汤锅",
    "规格"
  ],
  propsSort: {
    // "口味":["不辣","微辣","中辣","特辣","麻辣"]
  }
}

let shopName = "重庆鸡公煲（川师大店）"
let categories = [];
let categoryObj = {}

let propsGroupArr = []
function addPropsGroupArr(name) {
  if (propsGroupArr.indexOf(name) == -1) {
    propsGroupArr.push(name)
  } 
}

async function handleCategories() {
  // categories.forEach(item => { 
  //   categoryObj[item.Id] = item.Name
  // })
  categoryObj = {
    132098:"米饭餐具必点",
    131909: "特色鸡公煲",
    131911: "2元区",
    132003: "3元区",
    132004: "4元区",
    133074: "5元区",
    132005: "6元区",
    132006: "8元区",
    132007: "酒水饮料区",
    132100:"打包/餐具",
  }
  for (let key in categoryObj) {
    categories.push({
      id: key,
      name:categoryObj[key]
    })
  }


}


// 处理规格属性部分
function handleFoodPropGroup(foodDetail) {
  let res = []

  let skus = foodDetail.Skus || [];
  if (skus.length>0) {
    res.push({
      name: "规格",
      values: skus.map(item => ({
        value: item.Name,
        price: parseFloat(item.Price/100),
        propName: "规格",
        isMul:false
      }))
    })
  }






  let attrs = foodDetail.SpecGroups || [];
  
  if (attrs.length > 0) {
   
    attrs.forEach(attrItem => {
      addPropsGroupArr(attrItem.Name);
      res.push({
        name: attrItem.Name,
        values: attrItem.Specs.map(item => ({
          value: item.Name,
          price: 0,
          propName:attrItem.Name,
          isMul:true
        }))
      })
    })
   
  }

  return res;

}


//读取dataJson下的所有文件取出 food菜品
async function genMenuFoods() { 
  let allFoods = [];
  for (let i = 0; i < findJsonLen; i++) { 
    let filePath = path.join(__dirname, "dataJson", `dish${i+1}.json`);
    let goods = JSON.parse(fs.readFileSync(filePath, "utf-8")).Data;

    // console.log(records)
    goods.forEach(record => {
      let foodTemp = {
        id:record.Id,
        name:record.Name,
        imgUrl: record.Cover || defaultImgUrl,
        price: parseFloat(record.Price)/100,
        categoryName: categoryObj[record.CategoryId],
        categoryId:record.CategoryId,
        foodDetail: record,
        skus: record.Skus || [],
        specs:record.SpecGroups || []
      }
      foodTemp.name = foodTemp.name.slice(foodTemp.name.indexOf(".")+1)
      allFoods.push(foodTemp)
    })
  }

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
    foods.push({
      id: foodItem.id,
      name:foodItem.name,
      picUrl: foodItem.imgUrl,
      categoryName: categoryName,
      price: foodItem.price,
      unit: "份",
      props:handleFoodPropGroup(foodDetail),
    })
  })

  let categoryArr = []
 
  categories.forEach(categoryItem => {
    
    (categoryData[categoryItem.id])&&categoryArr.push(categoryData[categoryItem.id])
  })

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




// 打印日志到test.json 文件夹
async function logInfo(info,fileName="test") { 
  fs.writeFileSync(`./${fileName}.json`,JSON.stringify(info,null,'\t'))
}


async function mkShopDir(shopDir) { 
  delDirSync(shopDir);
  mkdirSync(shopDir)
}

async function genExcelAndWord(){ 
  await handleCategories();
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
    genImgs(merchantInfo,outputDir);
    genExcel(merchantInfo, outputDir, menuSetting);
    genExcelAll(merchantInfo, outputDir, menuSetting);
    
  } else {
    // genWord(merchantInfo, outputDir, menuSetting)
    // genSpecificationsWord(merchantInfo, outputDir, menuSetting)
    genFeieExcelAll(merchantInfo, outputDir,menuSetting)
  }

}



genExcelAndWord();
