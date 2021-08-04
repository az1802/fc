
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
  '4484': '优惠活动',
  '3112': '小吃',
  '2017': '仇婆抄手',
  '2018': '仇婆-面',
  '3110': '米线',
  '2042': '饮料酒水',
  '2021': '套餐类',
  '2020': '明星小吃',
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
    console.log('skuObj',skuObj)
    if (skuObj.values.length) {
      res.push(skuObj)
      console.log("规格菜----",foodItem.spuName)
      addPropsGroupArr(propsGroupArr,"规格")
    }
  }
  console.log('res', res)
  return res;
}

// 爬取的数据中进行信息提取
async function  handleRequestData(requestMenuData) {
  try {
    // 商户信息
    let merchantInfo = {
      shopName: '仇婆抄手',
      shop_pic: 'https://img.quick-touch.com/Uploads/0912D7C1-953F-4464-884E-4F2BD61B2F63/image/20200509/160340_4422.jpg',
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
      if(categoryData.name == '优惠活动'){
        categoryData.sort = 0
      }
      if(categoryData.name == '小吃'){
        categoryData.sort = 1
      }
      if(categoryData.name == '仇婆抄手'){
        categoryData.sort = 2
      }
      if(categoryData.name == '仇婆-面'){
        categoryData.sort = 3
      }
      if(categoryData.name == '米线'){
        categoryData.sort = 4
      }
      if(categoryData.name == '饮料酒水'){
        categoryData.sort = 5
      }
      if(categoryData.name == '套餐类'){
        categoryData.sort = 6
      }
      if(categoryData.name == '明星小吃'){
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
    return merchantInfo;
  }  catch (err) { 
    console.log(err, `格式化转换菜品发生错误${menuRequestUrl}`)
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
  let { shopName} = merchantInfo
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)

  // // mkShopDir(merchantInfo)
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
