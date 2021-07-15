
const fs = require("fs");
const path = require("path");
const requestMenuJson = require("./foodArr.json")

let merchantMenuInfo = requestMenuJson.data.unlinkedPlatformSkuList;
console.log(Object.keys(requestMenuJson.data))

let shopInfo = {
  name:"捞厨好面(粉面汤夜宵店)",
  logo:""
}
let allFoods =  merchantMenuInfo

const { requestUrl,genImgs,genExcel,genExcelAll,genFeieExcelAll,genWord,genSpecificationsWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr} = require("../../utils/index")


const exportMode = "keruyun"

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[],//默认存在规格属性
  practice: [
  
  ],//做法
  feeding:[],//加料
  remarks: [],//备注
  propsGroupSort: [
   
  ],
  propsSort: {
  }
}



const outputDir = path.join(__dirname, "merchantInfos")


// 打印日志到test.json 文件夹
async function logInfo(info,fileName="test") { 
  fs.writeFileSync("./"+fileName+".json",JSON.stringify(info,null,'\t'))
}

// 获取原始数据
async function getMerchantInfo() { 
  // let requestMenuData = await requestUrl(menuRequestUrl);
  let merchantInfo = await handleRequestData(allFoods)
  return merchantInfo;
}

let propsGroupArr=[];

function formatFoodProps(foodItem) { 
  let propsRes = [];
  return propsRes;
  
}
// 爬取的数据中进行信息提取
async function  handleRequestData(allFoods) {
  try {
    // 商户信息
    let merchantInfo = {
      shopName: shopInfo.name,
      shop_pic: shopInfo.logo,
      categories:[]
    }
    let categories = [], categoryObj = {}, foodObj = {};
    for(let i = 0; i < allFoods.length ; i++){
      let foodItem = allFoods[i];
      let {platformFoodID,platformCategoryName,platformFoodName,price=0,platformCategoryID,pictureInfo=""}  = foodItem;
      let foodTemp = {
          name:platformFoodName || "",
          picUrl: pictureInfo || "",
          price:price,
          unit: "份",
          categoryName: platformCategoryName,
          props:[]
      };
      if (foodObj[platformFoodID]) {
        continue;
      }else{
        foodObj[platformFoodID]=true;
      }
      if(platformCategoryID&&categoryObj[platformCategoryID]){
        categoryObj[platformCategoryID].foods.push(foodTemp)
      }else{
        categoryObj[platformCategoryID] = {
          name:platformCategoryName,
          foods:[foodTemp]
        }
      }
    }
    
    merchantInfo.categories = Object.values(categoryObj);
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
    // genWord(merchantInfo, outputDir)
    // genSpecificationsWord(merchantInfo, outputDir, menuSetting)
    genFeieExcelAll(merchantInfo, outputDir, menuSetting)
  }
}


genImgsAndExcel();
