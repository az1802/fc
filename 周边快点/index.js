
const fs = require("fs");
const path = require("path");
const requestMenuJson = require("./merchantInfo.json");
let merchantMenuInfo = requestMenuJson;

let shopeInfo = merchantMenuInfo.merchant
let foodList = merchantMenuInfo.goods
let subGroups = merchantMenuInfo.subGroups;
let specifications = merchantMenuInfo.specifications;

const { requestUrl,genImgs,genExcel,genExcelAll,genWord,genSpecificationsWord,formatFileName,delDirSync,mkdirSync} = require("../utils/index")


// const exportMode = "keruyun"
const exportMode = "feie"

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[],//规格
  practice:[ '就餐类型', '整只或切块', '规格','做法'],//做法
  feeding:[],//加料
  remarks: [],//备注
  propsGroupSort: [
    '就餐类型', '整只或切块', '规格','做法'
  ],
  propsSort: {
  }
}



const outputDir = path.join(__dirname, "merchantInfos")


// 打印日志到test.json 文件夹
async function logInfo(info) { 
  fs.writeFileSync("./logInfo.json",JSON.stringify(info,null,'\t'))
}

// 获取原始数据
async function getMerchantInfo() { 
  // let requestMenuData = await requestUrl(menuRequestUrl);
  let merchantInfo = await handleRequestData(merchantMenuInfo)
  return merchantInfo;
}

let allGroupsName = [];

function formatFoodProps(foodItem) { 
  let propsGroups = foodItem.sub_goods_group || [];
  
  let propsRes = propsGroups.map(groupItem => {
    let groupId = groupItem.group_id;
    let groupObj = subGroups[groupId]


    let groupTemp = {}
    groupTemp.name = groupObj.name;
    allGroupsName.indexOf(groupItem.categoryName) == -1 ? (allGroupsName.push(groupTemp.name)) : "";

    console.log(allGroupsName, groupItem.categoryName)
    
    groupTemp.values = groupItem.specifications.map(specificationItem => {
      let specificationItemVal = specifications[specificationItem] || {};
      return {
        value: specificationItemVal.name,
        price: specificationItemVal.price,
        propName:groupTemp.name,
        isMul:true
      }
    })
    return groupTemp
  })
  //TODO 属性的排序可以在此操作

  if (foodItem.categoryName!="肠粉\/汤粉加料区"&&foodItem.categoryName!="饮料") {
    propsRes.push({
      name: "就餐类型",
      values:[{
        value: "打包",
        price: 1,
        propName:"就餐类型",
        isMul:true
      }]
    })
  }
  
  
  return propsRes;
  
}
// 爬取的数据中进行信息提取
async function  handleRequestData(requestMenuData) {

  
  try {
    // 商户信息
    let merchantInfo = {
      shopName: shopeInfo.name,
      shop_pic: "",
      categories:[]
    }

    // 菜品目录
    let categories = [], categoriesObjTemp = {}
     
    Object.keys(foodList).forEach(foodId => {
      let foodItem = foodList[foodId]
      let categoryId = foodItem.cateId;
      if (categoriesObjTemp[categoryId]) {
        categoriesObjTemp[categoryId].push(JSON.parse(JSON.stringify(foodItem)))
      } else { 
        categoriesObjTemp[categoryId] = [JSON.parse(JSON.stringify(foodItem))]
      } 
    })
     

    categories = requestMenuData.categories.map(categoryItem => { 
      let categoryData = {
        name: "",
        foods:[]
      };
      categoryData.name = categoryItem.name;
      let categoryId = categoryItem.id;
      // console.log(categoriesObj,categoriesObj[categoryId])
      // (categoriesObjTemp[categoryId]==undefined)&&console.log("categoryId---",categoriesObjTemp[categoryId],categoryId)
      categoryData.foods = requestMenuData.categoryGoods[categoryId].reduce((res, goodItem) => {
        goodItem = foodList[goodItem]
        if (goodItem&&!goodItem.hide) { 
          let foodData = {
            name:goodItem.name || "",
            picUrl: goodItem.icon || "",
            price:goodItem.price/100 || "",
            unit: goodItem.dishesUnit || "份",
            categoryName:  categoryData.name,
            props:[],
          };
          goodItem.categoryName = foodData.categoryName;
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
  await logInfo(merchantInfo)
  // return;
  let { shopName} = merchantInfo
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)


  console.log("所有属性组---",allGroupsName)

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
