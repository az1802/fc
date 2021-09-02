
const fs = require("fs");
const path = require("path");


const { requestUrl,genImgs,genExcel,genExcelAll,genWord,genSpecificationsWord,formatFileName,delDirSync,mkdirSync, genShilaiExcelAll} = require("../utils/index")
const {unique} = require("../utils/common.js")





// const exportMode = "keruyun"
// const exportMode = "feie"
const exportMode = "shilai"


let requestMenuData = require("./menuData.json");
const { isRegExp } = require("util");

const idMap = {
  '-1': '折扣商品',
  '4468': '优惠活动',
  '1978': '本店招牌',
  '1974': '拌面类',
  '1975': '米族类',
  '1979': '套餐类',
  '1973': '特色小菜',
  '1976': '小吃类',
  '2012': '冰镇饮料',
  '2447': '本店招牌套餐(超实惠)',
}
const outputDir = path.join(__dirname, "merchantInfos")

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications: ['规格'], //规格
  practice: [
    '默认','特殊要求'
  ], //做法
  feeding: ['加料'],
  remarks: [], //备注
  propsGroupSort: [
    '默认','口味必选', '特殊要求', '打包', '口味'
  ],
  propsSort: {
    // "口味必选":["清汤","红汤","干拌",],
    // "特殊要求":["不要葱","加煎蛋","骨汤蔬菜","加卤鸡腿","加卤蛋", "加青菜", "鸡汤素菜"],
  }
}

// 打印日志到test.json 文件夹
async function logInfo(info,fileName="test.json") { 
  fs.writeFileSync(`./${fileName}.json`,JSON.stringify(info,null,'\t'))
}

// 获取原始数据
async function getMerchantInfo() { 
  let merchantInfo = await handleRequestData(requestMenuData)
  await logInfo(merchantInfo, "merchantRes")
  return merchantInfo;
}

// 处理菜品属性
function formatFoodProps(categoryItem) {
  let Marks = categoryItem.Marks;
  let res = []
  let skuObj = {
    name: "规格",
    values:[]
  }
  // 处理规格菜
  if (Marks&&Marks.length>0) {
    Marks && Marks.forEach(propItem => {
      skuObj.values.push({
        "value": propItem.MarkName,
        "price": propItem.Price,
        "propName": "规格",
        "isMul": true
      })
    })
    // if (skuObj.values.length) {
    //   res.push(skuObj)
    //   console.log("规格菜----",foodItem.spuName)
    //   addPropsGroupArr(propsGroupArr,"规格")
    // }
  }
  return res;
}

// 爬取的数据中进行信息提取
async function  handleRequestData(requestMenuData) {
  try {
    // 商户信息
    let merchantInfo = {
      shopName: '闹堡兰州牛肉面',
      shop_pic: '',
      categories:[]
    }
    // 菜品目录
    let categories = []
    categories = requestMenuData.map(categoryItem => {
      let categoryData = {
        name: idMap[categoryItem.Dtid],
        Dtid: categoryItem.Dtid,
        sort: 0,
        foods:[]
      };
      if(categoryData.name == '折扣商品'){
        categoryData.sort = 0
      }
      if(categoryData.name == '优惠活动'){
        categoryData.sort = 1
      }
      if(categoryData.name == '本店招牌'){
        categoryData.sort = 2
      }
      if(categoryData.name == '拌面类'){
        categoryData.sort = 3
      }
      if(categoryData.name == '米族类'){
        categoryData.sort = 4
      }
      if(categoryData.name == '套餐类'){
        categoryData.sort = 5
      }
      if(categoryData.name == '特色小菜'){
        categoryData.sort = 6
      }
      if(categoryData.name == '小吃类'){
        categoryData.sort = 7
      }
      if(categoryData.name == '冰镇饮料'){
        categoryData.sort = 7
      }
      if(categoryData.name == '本店招牌套餐(超实惠)'){
        categoryData.sort = 7
      }
      return categoryData
    })
    let categoriesUnique = unique(categories, 'name')
    categoriesUnique.map(item =>{
      let foods = []
      requestMenuData.map(categoryItem=>{
        if(item.Dtid === categoryItem.Dtid){
          let obj = {
            name: categoryItem.FoodName,
            picUrl: `https://img.quick-touch.com/${categoryItem.FoodImage}`,
            price: categoryItem.Price,
            unit: '',
            categoryName: idMap[categoryItem.Dtid],
            props: []
          }
          obj.props = formatFoodProps(categoryItem)
          foods.push(obj)
        }
      })
      item.foods = foods
    })
    let categoriesSort = categories.sort((a,b) =>{ return a.sort - b.sort})
    merchantInfo.categories = categoriesSort
    // console.log('merchantInfo', merchantInfo)
    return merchantInfo;
  }  catch (err) { 
    // console.log(err, `格式化转换菜品发生错误${menuRequestUrl}`)
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
  let { shopName } = merchantInfo
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)
  if (exportMode == "feie") {
    genImgs(merchantInfo,outputDir);
    genExcel(merchantInfo, outputDir);
    genExcelAll(merchantInfo,outputDir,menuSetting)
  } else if (exportMode == "shilai"){
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting, false)
  } else {
    genWord(merchantInfo, outputDir)
  }
}



genImgsAndExcel();
