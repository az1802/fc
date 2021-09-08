const fs = require("fs");

const { resolve } = require("path");
const path = require("path");
const request = require('request')
const { requestUrl,genImgs,genExcel,formatFileName,delDirSync,mkdirSync,addPropsGroupArr,genExcelAll,genSpecificationsWord,genFeieExcelAll} = require("../utils/index")
const defaultImgUrl = "https://shouqianba-customer.oss-cn-hangzhou.aliyuncs.com/jjz/processedPhoto5/ca06311f-796e-4889-8db4-dfb2f1a43ad1"


const exportMode = "keruyun"
// const exportMode = "feie"
const findJsonLen = 8
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
  }
}

let merchantInfo = {
  name: "霸碗盖码饭(支付宝大楼店)",
  
}
const categoryInfo = require("./categoryData.json");
let categories = categoryInfo.categories
let categoryObj = {}
let shopName = merchantInfo.name;

async function handleCategories() {
  categories.forEach(item => { 
    categoryObj[item.CategoryId] = item.DisplayName
  })
}


//读取dataJson下的所有文件取出 food菜品
async function genMenuFoods() { 
  let allFoods = [];
  for (let i = 0; i < findJsonLen; i++) { 
    let filePath = path.join(__dirname, "dataJson", "ListMulti" + (i==0 ? "" : i));
    let goods = JSON.parse(fs.readFileSync(filePath, "utf-8")).data;

    goods.forEach(record => {
      let foodTemp = {
        name:record.name,
        imgUrl: record.defaultproductimage.imagepath || defaultImgUrl,
        categoryName: record.category.name,
        categoryId:record.category.id,
        foodDetail: record,
        price: record.sellPrice,
        unit:record.unitName,
      }
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
      unit: foodItem.unit,
      props:[],
    })
  })

  let categoryArr = []
 
  categories.forEach(categoryItem => {
    
    (categoryData[categoryItem.CategoryId])&&categoryArr.push(categoryData[categoryItem.CategoryId])
  })

  logInfo(categoryArr,"categoryArr")
  return categoryArr;

}



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
  
  if (exportMode == "keruyun") {
    genImgs(merchantInfo,outputDir);
    genExcel(merchantInfo, outputDir, menuSetting);
    genExcelAll(merchantInfo, outputDir, menuSetting);
    
  } else {
    genFeieExcelAll(merchantInfo, outputDir,menuSetting)
  }

}



genExcelAndWord();
