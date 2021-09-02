const fs = require("fs");

const { resolve } = require("path");
const path = require("path");
const request = require('request')
const { genImgs,genExcel,formatFileName,delDirSync,mkdirSync,addPropsGroupArr,genExcelAll,genFeieExcelAll,genShilaiExcelAll} = require("../utils/index")
const defaultImgUrl = ""


// const exportMode = "keruyun"
// const exportMode = "feie"
const exportMode = "shilai"
const findJsonLen = 1
const outputDir = path.join(__dirname, "merchantInfos")

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[ "规格" ],//规格
  practice: [
    '辣度'
  ],//做法
  feeding:['加料'],//加料
  remarks: [],//备注
  propsGroupSort: [
    "规格", '辣度', 'undefined'
  ],
  propsSort: {
    // "口味":["不辣","微辣","中辣","特辣","麻辣"]
  }
}

let menuData = require("./menuData.json");
let merchantInfo = menuData.data
const categories = merchantInfo.baseInfo.foodCategories
let categoryObj = {}
let shopName = merchantInfo.baseInfo.name

function formatFoodProps(foodItem) {
  let propsRes = [],
    props = foodItem.cdatList;
    if(props && props.length > 0){
      props.map(item =>{
        let propTemp = {}
        if(item.methodCategories && item.methodCategories.length > 0){
          propTemp = {
            name: item.methodCategories[0].categoryName || '默认',
            values: item.methodCategories.map(propValItem => {
              return {
                value: propValItem.name,
                price: propValItem.markupPrice,
                propName: item.categoryName || '默认',
                isMul: true
              }
            })
          }
        }
        propsRes.push(propTemp);
      })
    }
  return propsRes;
}

//读取dataJson下的所有文件取出 food菜品
async function genMenuFoods() { 
  let merchantInfo = {
    shopName: menuData.data.baseInfo.restaurant.restaurantName,
    shop_pic: '',
    categories: []
  }
  let allFoods = [];
  let goods = menuData.data.baseInfo.foodCategories;
  let foods = menuData.data.baseInfo.foodList;
  goods.forEach(record => { 
    let foodTemp = {
      name: record.dishesName,
      foods: []
    }
    foods.map(item =>{
      let obj = {
        name: item.dishesName,
        price: item.dishesPrice,
        picUrl: item.dishesIntroImage,
        categoryName: item.dishesType.dishesTypeName,
        unit: item.dishesUnit || "份",
        props: [],
      }
      foodTemp.foods.push(obj)
      obj.props = formatFoodProps(item)
    })
    allFoods.push(foodTemp)
  })
  merchantInfo.categories = allFoods
  return merchantInfo;
}




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
  // // 重建创建商铺目录
  let merchantInfo = await genMenuFoods();
  let {
    shopName
  } = merchantInfo
  logInfo(propsGroupArr, "allPropGroups")
  let shopDir = path.join(outputDir, formatFileName(shopName));
  await mkShopDir(shopDir)
  
  if (exportMode == "keruyun") {
    genImgs(merchantInfo,outputDir);
    genExcel(merchantInfo, outputDir, menuSetting);
    genExcelAll(merchantInfo, outputDir, menuSetting);
  } else if (exportMode == 'shilai') {
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting,)
  } else {
    genFeieExcelAll(merchantInfo, outputDir,menuSetting)
  }
}



genExcelAndWord();
