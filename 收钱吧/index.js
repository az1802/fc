const fs = require("fs");

const { resolve } = require("path");
const path = require("path");
const request = require('request')
const { requestUrl,genImgs,genExcel,genWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr,genExcelAll,genSpecificationsWord,genFeieExcelAll,genShilaiExcelAll} = require("../utils/index")
const defaultImgUrl = ""


// const exportMode = "keruyun"
const exportMode = "feie"
// const exportMode = "shilai"
const findJsonLen = 1
const outputDir = path.join(__dirname, "merchantInfos")

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[ "规格" ],//规格
  practice: [
    "辣度",
    "口味"
  ],//做法
  feeding:["加料"],//加料
  remarks: [],//备注
  propsGroupSort: [
  	"辣度",
	"口味",
  "加料"
  ],
  propsSort: {
    // "口味":["不辣","微辣","中辣","特辣","麻辣"]
  }
}

let merchantInfo = require("./menuData.json");
merchantInfo = merchantInfo.data
const categories = merchantInfo.category
let categoryObj = {}
handleCategory();
let shopName = merchantInfo.store.merchantName;


function handleCategory() {
  categories.forEach(categoryItem => {
    categoryObj[categoryItem.name] = true;
  })

}


// 处理规格属性部分
function formatFoodProps(foodDetail) {
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
        "price": parseFloat(optionItem.price/100),
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

  let materials = foodDetail.materials || [];
  if (materials.length > 0) {
    let feeds = {
      name: "加料",
      values: materials.map(item => {
        return {
          "value": item.name,
          "propName": "加料",
          "isMul": true,
          "price":parseFloat(item.price/100),
        }
      })
    }

    res.push(feeds)
  }

  return res;

}


//读取dataJson下的所有文件取出 food菜品
async function genMenuFoods() { 
  let allFoods = [];

  for (let i = 0; i < merchantInfo.goods.pages[0].length; i++) {
    let categoryTemp = merchantInfo.goods.pages[0][i];
      allFoods.push(...categoryTemp.items)
  }

  // for (let i = 0; i < findJsonLen; i++) { 
  //   let filePath = path.join(__dirname, "dataJson", "index" + (i==0 ? "" : i));
  //   let categories= JSON.parse(fs.readFileSync(filePath, "utf-8")).data.goods
  //   categories.forEach((categoryItem) => {
  //     allFoods.push(...categoryItem.items)
  //   })
  // }
  let foodMapObj = {};
  allFoods = allFoods.filter(foodInfo => {
    if (foodMapObj[foodInfo.item.id]) {
      return false
    } else {
      foodMapObj[foodInfo.item.id] = true;
      return true;
    }
  })

  let categoryMap = {}
  allFoods.forEach(foodDetail => {
    let foodInfo = foodDetail.item;
    let categoryName = foodDetail.item.category_name;
    if (!categoryMap[categoryName]) {
      categoryMap[categoryName] = {
        name: categoryName,
        foods: []
      }
    }
    
    let categoryFoods = categoryMap[categoryName].foods;
    categoryFoods.push({
      name:foodInfo.name.trim().replace(/\//ig, '-') || "",
      picUrl:foodInfo.photo_url || defaultImgUrl,
      price:foodInfo.price/100,
      unit: foodInfo.unit || "份",
      categoryName:categoryName,
      props:formatFoodProps(foodDetail),
    })
  })
  return Object.values(categoryMap);
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
  } else if(exportMode == "feie"){
    genFeieExcelAll(merchantInfo, outputDir,menuSetting)
  }else if (exportMode == 'shilai') {
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting)
  }

}



genExcelAndWord();
