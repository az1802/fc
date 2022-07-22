
const fs = require("fs");
const path = require("path");


const { requestUrl, genImgs, genExcel, genExcelAll, genWord, genSpecificationsWord, formatFileName, delDirSync, mkdirSync, genFeieExcelAll, genShilaiExcelAll } = require("../utils/index")

// const exportMode = "keruyun"
const exportMode = "feie"


let requestShopData = require("./shopData.json");
requestShopData=requestShopData.data
let requestMenuData = require("./menuData.json");
requestMenuData=requestMenuData.data
const { isRegExp } = require("util");




const outputDir = path.join(__dirname, "merchantInfos")

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[],//规格
  practice:[
    "口味"
  ],//做法
  feeding:[],//加料
  remarks: [],//备注
  propsGroupSort: [
    "口味"

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

  let res = []
  foodItem.prop_item_list.forEach(groupItem=>{
      res.push({
        name: groupItem.prop_name,
        values:groupItem.prop_value_item_list.map(item=>{
          return {
            "value": item.prop_value_name,
            "price": item.price || 0,
            "propName": groupItem.prop_name,
            "isMul": false
          }
        })
      })

  })
  console.log(res)
  return res
}





// 爬取的数据中进行信息提取
async function  handleRequestData(requestShopData,requestMenuData) {
  // await logInfo(requestMenuData)

  try {
    // 商户信息
    let merchantInfo = {
      shopName: requestShopData.mch_store_name,
      shop_pic: requestShopData.mch_shop_photo,
      categories:[]
    }

    // 菜品目录
    let categories = []

    categories = requestMenuData.union_categorys.map(categoryItem => {
      let categoryData = {
        name: categoryItem.category_name,
        foods:[]
      };
      categoryData.name = categoryItem.category_name;
      categoryData.foods = categoryItem.goods_list.reduce((res,foodItem) => {
        if (foodItem) {
          let foodData = {
            name:foodItem.name || "",
            picUrl: foodItem.image_full_url || foodItem.image_url || "",
            price:parseFloat(foodItem.price)/100 || "",
            unit: foodItem.unit || "份",
            categoryName: categoryItem.itemname,
            props:[],
          };
          foodData.props = formatFoodProps(foodItem)
          res.push(foodData)
        }
        return res;
      },[])

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


async function genImgsAndExcel() {
  let merchantInfo = await getMerchantInfo();
  console.log('%cmerchantInfo: ', 'color: MidnightBlue; background: Aquamarine; font-size: 20px;', merchantInfo);
  let { shopName } = merchantInfo
  console.log('%cshopName: ', 'color: MidnightBlue; background: Aquamarine; font-size: 20px;', shopName);
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)

  // // // mkShopDir(merchantInfo)
  if (exportMode == "keruyun") {
    genImgs(merchantInfo, outputDir);
    genExcel(merchantInfo, outputDir);
    genExcelAll(merchantInfo, outputDir, menuSetting)
  } else if (exportMode == 'shilai') {
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting, false)
  } else {
    // genWord(merchantInfo, outputDir)
    // genSpecificationsWord(merchantInfo, outputDir, menuSetting)
    genFeieExcelAll(merchantInfo, outputDir, menuSetting)
  }

}



genImgsAndExcel();