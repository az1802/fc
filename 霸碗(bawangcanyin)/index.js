
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
merchantAllData = merchantAllData.datas
let requestShopData = {
  shopName : "霸碗餐饮"
}
let requestMenuData = merchantAllData
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
  let res =[]

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
      categoryData.name = categoryItem.className;

      categoryData.foods = categoryItem.goodsList.reduce((res, foodItem) => {
        if (foodItem) {
          let picUrl =  foodItem.imageList[0]&&foodItem.imageList[0].imageUrl || "";
          foodItem.dispName = foodItem.dispName.replace('/', "-")
          let foodData = {
            name: foodItem.dispName.trim()|| "",
            picUrl: picUrl || "",
            price: foodItem.price|| "",
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
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting);
    genFeieExcelAll(merchantInfo, outputDir, menuSetting);
  } else if (exportMode == 'feie') {
    genFeieExcelAll(merchantInfo, outputDir, menuSetting);
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting);
  }else {
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting);
    genFeieExcelAll(merchantInfo, outputDir, menuSetting);
  }
}

genImgsAndExcel();
