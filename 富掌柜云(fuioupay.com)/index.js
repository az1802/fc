const fs = require("fs");
const { resolve } = require("path");
const path = require("path");
const request = require('request')
const { requestUrl,genImgs,genExcel,genWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr,genExcelAll,genSpecificationsWord,genFeieExcelAll,genShilaiExcelAll} = require("../utils/index")
// const defaultImgUrl = "https://shouqianba-customer.oss-cn-hangzhou.aliyuncs.com/jjz/processedPhoto5/ca06311f-796e-4889-8db4-dfb2f1a43ad1"
const defaultImgUrl = ""

// const exportMode = "keruyun"
// const exportMode = "feie"
const exportMode = "shilai"
const findJsonLen = 7
const outputDir = path.join(__dirname, "merchantInfos")

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[ ],//规格
  practice: [
   
  ],//做法
  feeding:[],//加料
  remarks: [],//备注
  propsGroupSort: [
   
  ],
  propsSort: {
    // "口味":["不辣","微辣","中辣","特辣","麻辣"]
  }
}

let shopName = "阿添沙县小吃店"

let categories = require('./categoryData.json').data;
let categoryObj = {}

async function handleCategories() {
  categories.forEach(item => {
    categoryObj[item.typeId] = item.typeName
  });
}


// 处理规格属性部分
function handleFoodPropGroup(foodDetail) {
  let res = []

  return res;

}


//读取dataJson下的所有文件取出 food菜品
async function genMenuFoods() { 
  let allFoods = [];
  for (let i = 0; i < findJsonLen; i++) { 
    let filePath = path.join(__dirname, "dataJson", "getGoodsInfoList" + (i==0 ? "" : i) + ".action");
    let records = JSON.parse(fs.readFileSync(filePath, "utf-8")).data;

    // console.log(records)
    records.forEach(record => {
      let foodTemp = {
        name:record.goodsName,
        imgUrl: record.goodsPicture || defaultImgUrl,
        categoryName: categoryObj[record.typeId],
        categoryId:record.typeId,
        foodDetail: record,
      }
      allFoods.push(foodTemp)
    })
  }

  logInfo(allFoods,"allFoods")


  let categoryData = {}

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
      id: foodDetail.goodsId,
      name:foodItem.name,
      picUrl: foodItem.imgUrl,
      categoryName: categoryName,
      price: parseFloat(foodDetail.discountPrice)/100 || 0,
      unit: "份",
      props:handleFoodPropGroup(foodDetail),
    })
  })


  let categoryArr = []
 
  categories.forEach(categoryItem => {
    (categoryData[categoryItem.typeId])&&categoryArr.push(categoryData[categoryItem.typeId])
  })

  logInfo(categoryArr,"categoryArr")
  return categoryArr;

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
    genImgs(merchantInfo, outputDir);
    genExcel(merchantInfo, outputDir, menuSetting);
    genExcelAll(merchantInfo, outputDir, menuSetting);
    
  } else if (exportMode == "shilai") {
    genShilaiExcelAll(merchantInfo, outputDir,menuSetting)

  }else{
    // genWord(merchantInfo, outputDir, menuSetting)
    // genSpecificationsWord(merchantInfo, outputDir, menuSetting)
    genFeieExcelAll(merchantInfo, outputDir,menuSetting)
  }

}



genExcelAndWord();
