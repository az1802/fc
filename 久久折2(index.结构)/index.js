const fs = require("fs");

const { resolve } = require("path");
const path = require("path");
const request = require('request')
const { requestUrl,genImgs,genExcel,genWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr,genExcelAll,genSpecificationsWord,genFeieExcelAll} = require("../utils/index")
const defaultImgUrl = ""


// const exportMode = "keruyun"
const exportMode = "feie"
const findJsonLen = 4
const outputDir = path.join(__dirname, "merchantInfos")

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[ "规格" ],//规格
  practice: [
  	"温度",
	"酱",
	"面",
	"鱼蛋/鱼豆腐"
  ],//做法
  feeding:[],//加料
  remarks: [],//备注
  propsGroupSort: [
    "温度",
    "酱",
    "面",
    "鱼蛋/鱼豆腐",
    "规格"
  ],
  propsSort: {
    // "口味":["不辣","微辣","中辣","特辣","麻辣"]
  }
}

let merchantInfo = require("./shopData.json")
merchantInfo = merchantInfo.data
const categories = merchantInfo.categories
let categoryObj = {}
let shopName = merchantInfo.name || merchantInfo.merchantName


async function handleCategories() {
  categories.forEach(item => { 
    categoryObj[item.id] = item.name
  })
}


// 处理规格属性部分
function handleFoodPropGroup(foodDetail) {
  let res = []
  let specs = foodDetail.specs || {};
  if (Object.keys(specs).length != 0) {
    let propGroup = {
      name: specs.title,
      values:[]
    }
  
    addPropsGroupArr(propsGroupArr,propGroup.name)
  
    propGroup.values = specs.options && specs.options.map(optionItem => {
      return {
        "value": optionItem.name,
        "price": parseFloat(optionItem.price)/100 || 0,
        "propName": propGroup.name,
        "isMul": false
      }
    })
  
    res.push(propGroup)
  }


  let attributes = foodDetail.attributes || [];

  attributes.forEach(attrGroup => {
    // console.log( foodDetail.item.name,attrGroup.title)
    addPropsGroupArr(propsGroupArr, attrGroup.title);
    let propGroupTemp = {
      name: attrGroup.title,
      values:[],
    }
    propGroupTemp.values = attrGroup.options && attrGroup.options.map(optionItem => {
      return {
        "value": optionItem.name,
        "propName": attrGroup.title,
        "isMul": !!attrGroup.multiple,
        "price":0
      }
    })
    res.push(propGroupTemp)
  })

  return res;

}


//读取dataJson下的所有文件取出 food菜品
async function genMenuFoods() { 
  let allFoods = [];
  for (let i = 0; i < findJsonLen; i++) { 
    let filePath = path.join(__dirname, "dataJson", "index" + (i==0 ? "" : i));
    let goods = JSON.parse(fs.readFileSync(filePath, "utf-8")).data.goods;

    // console.log(records)
    goods.forEach(goodItem => {
      goodItem.items.forEach(record => {
        let foodTemp = {
          id:record.item.id,
          name:record.item.name + (!!record.item.description ? `(${record.item.description})`: ""),
          imgUrl: record.item.photo_url&&record.item.photo_url.split(",")[0] || defaultImgUrl,
          categoryName: categoryObj[record.item.category_id],
          categoryId:record.item.category_id,
          foodDetail: record,
          specs: record.specs || [],
          attributes:record.attributes || []
        }
        foodTemp.name = foodTemp.name.slice(foodTemp.name.indexOf(".")+1)
        allFoods.push(foodTemp)
      })
     
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
    // console.log( foodDetail.item.name)
    foods.push({
      id: foodItem.id,
      name:foodItem.name,
      picUrl: foodItem.imgUrl,
      categoryName: categoryName,
      price: parseFloat(foodItem.price)/100 || 0,
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
