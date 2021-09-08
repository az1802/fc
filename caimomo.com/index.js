
const fs = require("fs");
const path = require("path");
const requestMenuJson = require("./merchantInfo.json");
let merchantMenuInfo = requestMenuJson.Data;

let shopInfo = {
  name: "厨心",
  logo:""
}
let categoryList =  merchantMenuInfo.DishTypeList
let foodList = merchantMenuInfo.DishList

const { requestUrl,genImgs,genExcel,genExcelAll,genSpecificationsWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr} = require("../utils/index")


const exportMode = "keruyun"
// const exportMode = "feie"

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[],//规格
  practice: [
    "猪头牛油",
    "饮品例汤",
    "煎蛋"
  ],//做法
  feeding:[],//加料
  remarks: [],//备注
  propsGroupSort: [
    "猪头牛油",
    "饮品例汤",
    "煎蛋"
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
  let merchantInfo = await handleRequestData(merchantMenuInfo)
  return merchantInfo;
}

let propsGroupArr=[];

function formatFoodProps(foodItem) { 
  let ZuoFa = foodItem.ZuoFa || [];
  let propsRes = [];
  



  // 处理做法
  let zuofaTemp = {},zuofaProps=[]
  ZuoFa.forEach(groupItem => {

    if (zuofaTemp[groupItem.TypeName]) {
      zuofaTemp[groupItem.TypeName].push(groupItem)
    } else {
      zuofaTemp[groupItem.TypeName]=[groupItem]
    }
  })

  for (let name in zuofaTemp) {
    let groupTemp = {}
    groupTemp.name = name;
    addPropsGroupArr(propsGroupArr, name)
    groupTemp.values = zuofaTemp[name].map( propItem=> { 
      return {
        value: propItem.Name,
        price: propItem.Price,
        propName:groupTemp.name,
        isMul:true
      }
    })
    zuofaProps.push(groupTemp)
  }

  propsRes.push(...zuofaProps)

  return propsRes;
  
}
// 爬取的数据中进行信息提取
async function  handleRequestData(requestMenuData) {

  
  try {
    // 商户信息
    let merchantInfo = {
      shopName: shopInfo.name,
      shop_pic: shopInfo.logo,
      categories:[]
    }

    // 菜品目录
    let categories = [], categoriesObjTemp = {}

    foodList.forEach((foodItem) => { 
      let categoryId = foodItem.DishTypeUID;
      if (categoriesObjTemp[categoryId]) {
        categoriesObjTemp[categoryId].push(JSON.parse(JSON.stringify(foodItem)))
      } else { 
        categoriesObjTemp[categoryId] = [JSON.parse(JSON.stringify(foodItem))]
      } 
    })

    categories =categoryList.map(categoryItem => { 
      let categoryData = {
        name: "",
        foods:[]
      };
      categoryData.name = categoryItem.TypeName;
      let categoryId = categoryItem.TypeUID;
      categoryData.foods = categoriesObjTemp[categoryId] && categoriesObjTemp[categoryId].reduce((res, goodItem) => {
        if (goodItem) { 
          let foodData = {
            name:goodItem.DishName || "",
            picUrl: goodItem.DishImg ? `http://image.caimomo.com/${goodItem.DishImg}`  : "",
            price:goodItem.DishPrice || "",
            unit: goodItem.DishUnitName || "份",
            categoryName: categoryData.name,
            props:[],
          };
          goodItem.categoryName = categoryData.name;
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
