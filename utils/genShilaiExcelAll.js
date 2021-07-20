

var path = require("path");
const request = require('request')
var fs = require("fs");
const { resolve } = path;
var xlsx = require('node-xlsx');
const JSZIP = require('jszip');
var officegen = require('officegen');
var docx = officegen('docx');//word
var {genExportDirs ,genImgs,handleFoodAttrs} = require('./common');



const excelTitle = ["商品名称", "菜品分类","售卖价", "菜品类型", "规格", "属性组", "属性", "加料", "打包盒"];




function handleSkusText(skus = []) {

  return skus.map(skuItem => {
    return skuItem.values.map(item => {
      return `${item.value}:${item.price}`
    }).join('/')
  }).join(',')

}

function handleAttrGroupsText(attrGroups =[]) {
  return attrGroups.map(groupItem => {
    return groupItem.name
  }).join(',')
}

function handleAttrsText(attrGroups = []) {
  return attrGroups.map(groupItem => {
    return groupItem.values.map(attrItem => {
      return `${attrItem.value}${attrItem.price > 0 ? (':'+attrItem.price) : ''}`
    }).join('/')
  }).join(',')
}

function handleSpecsText(specs = []) {
  return specs.map(specItem => {
    return specItem.values.map(item => {
      return `${item.value}:${item.price}`
    }).join('/')
  }).join(',')
}


function handlePacksText(packs = []) {
  return packs.map(packItem => {
    return packItem.values.map(item => {
      return `${item.value}:${item.price}`
    }).join('/')
  }).join(',')

}


// 生成时来收银模式的excel 
async function genShilaiExcelAll(merchantInfo, outputDir,menuSetting) { 
  let { categories, shopName } = merchantInfo;
  let { propsGroupSort } = menuSetting
  let {shopDir, foodsImgsDir} = genExportDirs(outputDir,shopName)

  let excelData = []; //默认添加一套数据作为是否有属性的分割线

  // 下载所有菜品的图片,用于菜品的批量单导入
  genImgs(categories, {shopDir}) 

  let allAttrGroups = new Set();
  categories.forEach(categoryItem => {
    if (!categoryItem) { 
      return;
    }
    categoryItem.foods.forEach(foodItem => {
      foodItem.props.forEach(groupItem => {
        allAttrGroups.add(groupItem.name)
      })
      handleFoodAttrs(foodItem, menuSetting, allAttrGroups);
    })
  })
  categories.forEach(categoryItem => {
    if (!categoryItem) {
      return;
    }
    categoryItem.foods.forEach(foodItem => {
      let rowData = {
        name:foodItem.name,
        categoryName:foodItem.categoryName,
        price: parseFloat(foodItem.price || 0).toFixed(2),
        type: foodItem.skus.length > 0 ? "规格菜" : "单品",
        skus: handleSkusText(foodItem.skus),
        attrGroups:  handleAttrGroupsText(foodItem.attrGroups),
        attrs: handleAttrsText(foodItem.attrGroups),
        specs: handleSpecsText(foodItem.specs),
        packs:handlePacksText(foodItem.packs),
      }
    excelData.push(Object.values(rowData))
    })
  })


  console.log([...allAttrGroups])

  let buffer = xlsx.build([
    {
        name:'sheet1',
        data:[excelTitle].concat(excelData)
    }
  ]);
  fs.writeFileSync(path.join(shopDir, `${shopName}-时来收银机菜品导入.xlsx`), buffer, { 'flag': 'w' });
}


module.exports = {
  genShilaiExcelAll
}