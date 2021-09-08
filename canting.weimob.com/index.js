
const fs = require("fs");
const path = require("path");
const { requestUrl,genImgs,genExcel,genExcelAll,genSpecificationsWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr} = require("../utils/index")


const outputDir = path.join(__dirname, "merchantInfos")
const requestMenuJson = require("./merchantInfo.json");

let merchantMenuInfo = requestMenuJson.data;
let shopeInfo = {
  shopName: "湘食湘聚",
  shop_pic:""
}
let categoryList = merchantMenuInfo.list

const exportMode = "keruyun"
// const exportMode = "feie"

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[],//规格
  practice: [
   
  ],//做法
  feeding:[],//加料
  remarks: [],//备注
  propsGroupSort: [
    
  ],
  propsSort: {
  }
}

// 打印日志到test.json 文件夹
async function logInfo(info,fileName="test") { 
  fs.writeFileSync("./"+fileName+".json",JSON.stringify(info,null,'\t'))
}

// 获取原始数据
async function getMerchantInfo() { 
  // let requestMenuData = await requestUrl(menuRequestUrl);
  let merchantInfo = await handleRequestData(merchantMenuInfo)
  return merchantInfo;
}

let propsGroupArr=[];

function formatFoodProps(foodItem) {
  return [];
  
}
// 爬取的数据中进行信息提取
async function  handleRequestData(requestMenuData) {

  
  try {
    // 商户信息
    let merchantInfo = {
      shopName: shopeInfo.shopName,
      shop_pic: shopeInfo.shop_pic,
      categories:[]
    }

    // 菜品目录
    let categories = [], categoriesObjTemp = {}

    categories = requestMenuData.list.map(categoryItem => { 
      let categoryData = {
        name: "",
        foods:[]
      };
      categoryData.name = categoryItem.sellGroupTitle;
      categoryData.foods =  categoryItem.dishesList.reduce((res,goodItem) => { 
        if (goodItem && goodItem.dishesInfo) {
          let foodData = {
            name:goodItem.dishesInfo.goodsName || "",
            picUrl: goodItem.dishesInfo.picUrl || "",
            price:goodItem.dishesInfo.salePrice || "",
            unit: goodItem.dishesInfo.unit || "份",
            categoryName: categoryData.name,
            props:[],
          };
          if (foodData.picUrl=="https://image-c.weimobwmc.com/gateway/9814f02ac368480abd38ae3c2bb8ff7a.jpg?o2oApiId=10000") {
            foodData.picUrl=""
          }


          foodData.categoryName = categoryData.name
          foodData.props = formatFoodProps(goodItem)
          res.push(foodData)
        }
        return res;
      },[]) || []
      return categoryData
    })

    merchantInfo.categories = categories
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
  await logInfo(merchantInfo, "merchantRes")
  await logInfo(propsGroupArr, "propsGroupArr")
  
  // return;
  let { shopName} = merchantInfo
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)



  // // mkShopDir(merchantInfo)
  if (exportMode == "keruyun") {
    genImgs(merchantInfo,outputDir);
    genExcel(merchantInfo, outputDir);
    genExcelAll(merchantInfo,outputDir,menuSetting)
  } else {
    genSpecificationsWord(merchantInfo, outputDir,menuSetting)
  }
}


genImgsAndExcel();
