
const fs = require("fs");
const path = require("path");
const requestMenuJson = require("./merchantInfo.json");
let merchantMenuInfo = requestMenuJson.data;

let shopInfo = {
  name: "成都牛肉面",
  logo: ""
}
let categoryList = merchantMenuInfo.dishTypeList
let foodList = merchantMenuInfo.dishList
const {
  requestUrl,
  genImgs,
  genExcel,
  genExcelAll,
  genWord,
  genSpecificationsWord,
  formatFileName,
  delDirSync,
  mkdirSync,
  addPropsGroupArr,
  genFeieExcelAll,
  genExportData,
} = require('../utils/index');


// const exportMode = "keruyun"
const exportMode = "feie"

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications: [],//默认存在规格属性
  practice: [
  	"辣度",
	"粉",
	"加料",
	"规格"
  ],//做法
  feeding: [],//加料
  remarks: [],//备注
  propsGroupSort: [
    "辣度",
    "粉",
    "加料",
    "规格"
  ],
  propsSort: {
  }
}



const outputDir = path.join(__dirname, "merchantInfos")


// 打印日志到test.json 文件夹
async function logInfo(info, fileName = "test") {
  fs.writeFileSync("./" + fileName + ".json", JSON.stringify(info, null, '\t'))
}

// 获取原始数据
async function getMerchantInfo() {
  let merchantInfo = await handleRequestData()
  return merchantInfo;
}

let propsGroupArr = [];

function formatFoodProps(foodItem) {

  let propsRes = [];

  let dishIngredientInfos = foodItem.dishIngredientInfos || [];
  if (dishIngredientInfos.length > 0) {
    addPropsGroupArr(propsGroupArr, "配料")
    propsRes.push({
      name: "配料",
      values: dishIngredientInfos.map(propValItem => {
        return {
          value: propValItem.name,
          price: parseFloat(propValItem.reprice || 0),
          propName: "配料",
          type: "",
          isMul: true
        }
      })
    })
  }

  let dishPropertyTypeInfos = foodItem.dishPropertyTypeInfos || [];


  if (dishPropertyTypeInfos.length > 1) { //存在多种规格
    dishPropertyTypeInfos.forEach(item => {
      let attrGroupName = item.name;
      addPropsGroupArr(propsGroupArr, attrGroupName)
      let atttGroupTemp = {
        name: attrGroupName,
        values: item.properties.map(propItem => {
          return {
            value: propItem.name,
            price: parseFloat(propItem.reprice || 0),
            propName: attrGroupName,
            type: "",
            isMul: false
          }
        })
      }
      propsRes.push(atttGroupTemp);

    })
  }

  return propsRes;

}
// 爬取的数据中进行信息提取
async function handleRequestData() {

  try {
    // 商户信息
    let merchantInfo = {
      shopName: shopInfo.name,
      shop_pic: shopInfo.logo,
      categories: []
    }


    let dishMapId = {};
    foodList.forEach(item => {
      dishMapId[item.id] = item;
    })



    let categories = [], categoryObj = {};
    let categoryInfo = categoryList.map(categoryItem => {

      let categoryName = categoryItem.name
      return {
        name: categoryName,
        foods: categoryItem.dishIds.map(foodId => {
          let foodItem = dishMapId[foodId];
          return {
            name: foodItem.name || "",
            picUrl: foodItem.smallImgUrl || "",
            price: parseFloat(foodItem.marketPrice || ""),
            unit: foodItem.unitName || "份",
            categoryName: categoryName,
            props: formatFoodProps(foodItem),
          }
        })
      }
    })

    merchantInfo.categories = categoryInfo
    // await logInfo(merchantInfo)
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
  await logInfo(merchantInfo, 'merchantRes');
  await logInfo(propsGroupArr, 'propsGroupArr');

  // return;
  let { shopName } = merchantInfo;
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir);

  genExportData({
    merchantInfo,
    menuSetting,
    outputDir,
    exportMode,
  });
}

genImgsAndExcel();
