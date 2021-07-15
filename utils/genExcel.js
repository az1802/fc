
var path = require("path");
var fs = require("fs");
const { resolve } = require("path");
var xlsx = require('node-xlsx');
var dirName = path.join(__dirname, "huanXiongMenusJsons")
const {getFiles,getFileJson,genExcel} = require("./index")


// 剥离数据获取菜单关键信息
async function handleMenuJson(menuJson) { 
  let res = [];
  let sales = menuJson.sales;
  for (let i = 0; i < sales.length; i++) { 
    let item = sales[i]
    // if (item.props.length > 0 || item.prop_prices.length > 0) { 
    //   continue;
    // }
    res.push({
      menuName:"销量排行",
      name: item.name,
      unit: "份",
      price:item.curr_price
    })
  }

  let menuItems = menuJson.items;
  menuItems.forEach((menuItem) => { 
    let menuObj = {
      menuname: menuItem.itemname,
      foods:[]
    }

    let products = menuItem.products
    let foods = menuObj.foods;
    for (let i = 0; i < products.length; i++) { 
      let productItem = products[i];
      // if (productItem.props.length > 0 || productItem.prop_prices.length > 0) { 
      //   continue;
      // }
      res.push({
        menuName:menuItem.itemname,
        name: productItem.name,
        unit: "份",
        price:productItem.curr_price
      })
    }
  })
  return res;
}

// 生成表格
async function getExcel() { 
  let filePath = path.join(__dirname,"edianJsons","1000720-博今店唐穆私房牛肉面.json")
  let menuJson = await getFileJson(filePath)
  if (!menuJson) { return }

  let shopName = menuJson.shopname
  let resJson = await handleMenuJson(menuJson);

  let title = ["商品名称","一级分类","二级分类","标准单位","品牌定价"];
  let data = []
  for (let i = 0; i < resJson.length; i++) { 
    let foodItem = resJson[i]
    data.push([foodItem.name,"默认",foodItem.menuName,"份",parseFloat(foodItem.price).toFixed(2)])
  }

  genExcel({
    title,
    data,
    excelPath:`./${shopName}-客如云菜品导入.xlsx`
  })

}


getExcel()
