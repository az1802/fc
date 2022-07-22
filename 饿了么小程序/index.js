
const fs = require("fs");
const path = require("path");


const { requestUrl, genImgs, genExcel, genExcelAll, genWord, genSpecificationsWord, formatFileName, delDirSync, mkdirSync, genFeieExcelAll, genShilaiExcelAll } = require("../utils/index")





// const exportMode = "keruyun"
  const exportMode = "feie"



let merchantAllData =  require("./merchantInfo.json");


merchantAllData = merchantAllData.data.resultMap.menu.itemGroups;
let requestShopData = {
  shopName: "西域风烧烤主题餐厅",
  logoUrl:""
}
let requestMenuData = merchantAllData
const { isRegExp } = require("util");


const outputDir = path.join(__dirname, "merchantInfos")

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[],//规格
  practice: [

  ],//做法
  feeding:[],//加料
  remarks: [],//备注
  propsGroupSort: [

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
  let res = [];

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
        name: categoryItem.name,
        foods:[]
      };

      categoryData.foods = categoryItem.items.reduce((res, foodItem) => {

        if (foodItem.groupId == -1) {
          return res;
        }
        if (foodItem) {
          let foodHash = foodItem.imageHash;
          picUrl = foodHash ? `https://cube.elemecdn.com/${foodHash.slice(0, 1)}/${foodHash.slice(1, 3)}/${foodHash.slice(3)}.jpeg?x-oss-process=image/resize,m_fill,h_1500,w_1500/format,png/quality,q_75` : "";
          foodItem.name = foodItem.name.replace('/',"-")
          let foodData = {
            name: foodItem.name.trim() || "",
            picUrl: picUrl || "",
            price: foodItem.price || "",
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
