
const fs = require("fs");
const path = require("path");
// let merchantInfo = require('./merchantRes.json')

const { requestUrl,genImgs,genExcel,genFeieExcelAll,genWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr,genExcelAll,genSpecificationsWord, genShilaiExcelAll} = require("../utils/index")





// const exportMode = "keruyun"
const exportMode = "feie"
// const exportMode = "shilai"

// let priceKey = 'originalPrice' //原价
let priceKey = 'currentPrice' //现价(折扣价)



let merchantAllData =  require("./merchantInfo.json");
merchantAllData = merchantAllData.data
let requestShopData =merchantAllData.shopInfo
requestShopData.shopName = "乌鸡米线 南山店"
let requestMenuData = merchantAllData.categories
let allsSuIds = merchantAllData.spuDetail;
const { isRegExp } = require("util");




const outputDir = path.join(__dirname, "merchantInfos")
console.log('outputDir: ', outputDir);

let menuSetting = { //导出的菜品属性归为规格,备注,加料,做法
  specifications:['规格'],//规格
  practice: [
    '规格',
    "加料",
    "辣度"
  ],//做法
  feeding:['加料'],//加料
  remarks: [],//备注
  propsGroupSort: [
    '规格',
    "加料",
    "辣度"
  ],
  propsSort: {
    // "口味":["不辣","微辣","中辣","特辣","麻辣"]
  }
}

let propsGroupArr = [];

// 打印日志到test.json 文件夹
async function logInfo(info,fileName="test.json") {
  fs.writeFileSync(`./${fileName}.json`,JSON.stringify(info,null,'\t'))
}

// 获取原始数据
async function getMerchantInfo() {
  let merchantInfo = await handleRequestData(requestShopData, requestMenuData)
  return merchantInfo;
}


function formatFoodProps(foodItem) {
  let skuMenuItems = foodItem.skuMenuItems;
  let methods = foodItem.methods;//普通属性
  // let originalPrice = foodItem[priceKey]  //原价
  let tastes = foodItem.tastes
  let res = []

  let skuObj = {
    name: "规格",
    values:[]
  }

  let feedObj = {
    name: "加料",
    values:[]
  }

  // 处理规格菜
  if (skuMenuItems&&skuMenuItems.length>1) {
    skuMenuItems && skuMenuItems.forEach(propItem => {
      if(!propItem.specAttrs || !propItem.specAttrs[0]){
        return;
      }
      let skuName = propItem.specAttrs[0].specificationName;
      if (propItem.specAttrs[0].value) {
        skuObj.values.push({
          "value": propItem.specAttrs[0].value,
          "price": propItem[priceKey],
          "propName": "规格",
          "isMul": false
        })
      }
    })
    if (skuObj.values.length) {
      res.push(skuObj)
    }
  }

  // 处理加料菜
  if (tastes && tastes.length > 0) {
    tastes.forEach(tasteItem => {
      tasteItem.items&&tasteItem.items.forEach(propItem => {
         feedObj.values.push({
           "value": propItem.name,
           "price": propItem.price,
           "propName": "加料",
           "isMul": true
         })
       })
    })
    if (feedObj.values.length) {
      res.push(feedObj)
    }
  }

  if(methods && methods.length > 0) {
    methods.forEach(propItem => {
      let tempObj = {
        name: propItem.groupName,
        values:[]
      }
      if(propItem.items && propItem.items.length > 0) {
        propItem.items.forEach(item => {
          tempObj.values.push({
            "value": item.name.trim(),
            "price": item.price,
            "propName": tempObj.name,
            "isMul": true
          })
        })
        res.push(tempObj)
        if (menuSetting.practice.indexOf(tempObj.name)==-1) {
          menuSetting.practice.push(tempObj.name)
          menuSetting.propsGroupSort.splice(menuSetting.propsGroupSort.length-1,0,tempObj.name)
        }
      }
    })
  }
  return res;
}

// 爬取的数据中进行信息提取
async function  handleRequestData(requestShopData,requestMenuData) {
  try {
    // 商户信息
    let merchantInfo = {
      shopName: requestShopData.shopName,
      shop_pic: "",
      categories:[]
    }
    // 菜品目录
    let categories = []
    categories = requestMenuData.map(categoryItem => {
      let categoryData = {
        name: "",
        foods:[]
      };
      categoryData.name = categoryItem.categoryName;
      let categroySpuIds = []
      if (categoryItem.spuIds) {
        categroySpuIds = categoryItem.spuIds;
      } else {
        categoryItem.childDishCategories && categoryItem.childDishCategories.forEach(childCategoryItem => {
          categroySpuIds.push(...(childCategoryItem.spuIds || []));
        })
      }
      categoryData.foods =categroySpuIds.reduce((res, foodItem) => {
        foodItem = allsSuIds[foodItem]
        if (foodItem) {
          let picUrl = foodItem.dishPicUrls[0] || "";
          picUrl = picUrl.replace("%40640w_480h_1e_1c_1l%7Cwatermark%3D0", "");
          picUrl = picUrl.replace("%40180w_180h_1e_1c_1l%7Cwatermark%3D0", "");
          picUrl = picUrl.split("@")[0];

          foodItem.spuName = foodItem.spuName.replace('/', "-")
          let foodData = {
            name: foodItem.spuName.trim()|| "",
            picUrl: picUrl || "",
            price: foodItem[priceKey] || "",
            unit: foodItem.unit || "份",
            categoryName: categoryData.name,
            props: [],
          };
          foodData.props = formatFoodProps(foodItem)
          res.push(foodData)
        }
        return res;
      }, [])
      return categoryData
    })
    merchantInfo.categories = categories
    return merchantInfo;
  } catch (err) {
    console.log(err, `格式化转换菜品发生错误`)
  }
}

// 数据转换提取,写入相关文件
async function mkShopDir(shopDir) {
  delDirSync(shopDir);
  mkdirSync(shopDir)
}

// 生成图片文件夹以及excel文件
async function genImgsAndExcel() {
  let merchantInfo = await getMerchantInfo();
    await logInfo(merchantInfo, "merchantRes")

  let { shopName} = merchantInfo
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)
  logInfo(propsGroupArr,"propGroups")
  if (exportMode == "keruyun") {
    genImgs(merchantInfo,outputDir);
    genExcel(merchantInfo, outputDir);
    genExcelAll(merchantInfo,outputDir,menuSetting)
  } else if (exportMode == 'shilai') {
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting)
  } else if (exportMode == 'feie') {
    genFeieExcelAll(merchantInfo, outputDir, menuSetting)
  }else {
    genFeieExcelAll(merchantInfo, outputDir,menuSetting)
  }
}

genImgsAndExcel();
