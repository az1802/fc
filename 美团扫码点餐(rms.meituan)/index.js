
const fs = require("fs");
const path = require("path");


const { requestUrl,genImgs,genExcel,genFeieExcelAll,genWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr,genExcelAll,genSpecificationsWord} = require("../utils/index")





const exportMode = "keruyun"
  // const exportMode = "feie"



let merchantAllData =  require("./merchantInfo.json");
merchantAllData = merchantAllData.data
let requestShopData =merchantAllData.shopInfo
let requestMenuData = merchantAllData.dishCategories
let allsSuIds = merchantAllData.spuDetail;
const { isRegExp } = require("util");




const outputDir = path.join(__dirname, "merchantInfos")

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[],//规格
  practice: [
    "辣度",
    "温度"
  ],//做法
  feeding:[],//加料
  remarks: [],//备注
  propsGroupSort: [
    "辣度",
    "温度"
  ],
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
  let propGroupName = methods.groupName;
  let originalPrice = foodItem.originalPrice
  let res = []

  let skuObj = {
    name: "规格",
    values:[]
  }
  
  // 处理规格菜
  if (skuMenuItems&&skuMenuItems.length>1) {
    skuMenuItems && skuMenuItems.forEach(propItem => {
      if (!propItem.specAttrs[0].value) {
        skuObj.values.push({
          "value": propItem.specAttrs[0].value,
          "price": propItem.originalPrice - originalPrice,
          "propName": "规格",
          "isMul": true
        })
      }
    })
    if (skuObj.values.length) {
      res.push(skuObj)
      console.log("规格菜----",foodItem.spuName)
      addPropsGroupArr(propsGroupArr,"规格")
    }
  }

  methods.forEach(propItem => {
    let tempObj = {
      name: propItem.groupName,
      values:[]
    }
    propItem.items.forEach(item => {
      tempObj.values.push({
        "value": item.name.trim(),
        "price": item.price,
        "propName": tempObj.name,
        "isMul": true
      })
    })
    res.push(tempObj)

    addPropsGroupArr(propsGroupArr,tempObj.name)
  })

  return res;
}

// 爬取的数据中进行信息提取
async function  handleRequestData(requestShopData,requestMenuData) {
  // await logInfo(requestMenuData)
  
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


          let picUrl = foodItem.detailPicUrls[0] || "";
          picUrl = picUrl.replace("%40640w_480h_1e_1c_1l%7Cwatermark%3D0", "")
          foodItem.spuName = foodItem.spuName.replace('/',"-")
          let foodData = {
            name: foodItem.spuName.trim() || "",
            picUrl: picUrl || "",
            price: foodItem.originalPrice || "",
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

  // // mkShopDir(merchantInfo)
  if (exportMode == "keruyun") {
    genImgs(merchantInfo,outputDir);
    genExcel(merchantInfo, outputDir);
    genExcelAll(merchantInfo,outputDir,menuSetting)
  } else {
    
    // genWord(merchantInfo, outputDir)
    // genSpecificationsWord(merchantInfo, outputDir,menuSetting)
    genFeieExcelAll(merchantInfo, outputDir,menuSetting)
  }

  

}



genImgsAndExcel();
