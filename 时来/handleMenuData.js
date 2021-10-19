function processDishes(requestMenuData) {
  let dishes = requestMenuData.dishes, dishNameMap = {}
  
  // 过滤掉下线的菜品
  dishes.forEach((dishCategory) => {
    dishCategory.dishList = dishCategory.dishList.filter(dishItem => dishItem.status != 'OFFLINE')
  })

  dishes.forEach((dishCategory) => {
    dishCategory.dishList.forEach((dish) => {
      if (dish.name in dishNameMap) {
        dishNameMap[dish.name].push(dish)
      } else {
        dishNameMap[dish.name] = [dish]
      }
      // 将菜品的规格属性组移动到第一位
      let skuAttrGroupIndex = dish.attrList.findIndex(attrGroupItem=>{
        return attrGroupItem.attrs[0]&&attrGroupItem.attrs[0].type=="SPECIFICATION"
      })
      if(skuAttrGroupIndex!=-1){
        let temp = dish.attrList.splice(skuAttrGroupIndex,1);
        dish.attrList.unshift(...temp);
      }
    })
  })

  // 对于规格类菜品，需要进行多菜品合并(受客如云原始数据格式限制)
  let attrDishMap = {}, needAdjustGroupId = "", needAdjustIndex = "";
    
  for (var name in dishNameMap) {
    if (dishNameMap[name].length > 1) {
      let attrMap = {}
      dishNameMap[name].forEach((dish, index) => {
        if (index > 0) {
          dish.customHidden = true
        }
        dish.attrList.forEach((attrItem) => {
          // attrItem.attrs.forEach((attr) => {
          //   if (attr.type === 'SPECIFICATION') {
          //     attrDishMap[dish.name + attr.id] = dish
          //   }
          // })
          if (attrItem.attrs[0] && attrItem.attrs[0].type === 'SPECIFICATION') {
            // 处理这个规格属性的价格
            attrItem.attrs[0].skuPrice = dish.price + attrItem.attrs[0];

          }
          if (attrItem.groupId in attrMap) {
            if (attrItem.attrs.length > 0 && attrItem.attrs[0].type === 'SPECIFICATION') { //处理规格属性
              attrMap[attrItem.groupId] = [...attrMap[attrItem.groupId]];//后续调整该groupId至最前面
              for(let i = 0 ; i < attrItem.attrs.length ;i++){
                let attrTemp = attrItem.attrs[i] || {};
               
                let hasAttr = attrMap[attrItem.groupId].some(attrMapItem=>{
                  return attrMapItem.id == attrTemp.id
                })
                if(!hasAttr){
                  attrMap[attrItem.groupId].push(JSON.parse(JSON.stringify(attrTemp)));
                }
              }
              needAdjustGroupId = attrItem.groupId
            }
          } else {
            attrMap[attrItem.groupId] = [...attrItem.attrs]
          }
        })
      })

      dishNameMap[name][0].attrList.forEach((attrItem,index) => {
        attrItem.attrs = attrMap[attrItem.groupId];
        if(needAdjustGroupId == attrItem.groupId){
          needAdjustIndex = index
        }
      })
       // 将合并的规格属性调整到最前面
      dishNameMap[name][0].attrList.unshift(...dishNameMap[name][0].attrList.splice(needAdjustIndex, 1))
      
    }
  }

  dishes.forEach((dishCategory) => {
    dishCategory.dishList = dishCategory.dishList.filter(dishItem => !dishItem.customHidden)
  })

}


// 处理菜品属性
function formatFoodProps(foodItem,menuSetting) {
  let propsRes = [],
    props = foodItem.attrList;
  for (let k = 0; k < props.length; k++) {
    let { groupName ,attrs} = props[k];
    if (menuSetting.propsGroupSort.indexOf(groupName) == -1) {
      if (attrs[0] && attrs[0].type == 'SPECIFICATION') {
        menuSetting.specifications.push(groupName)
        menuSetting.propsGroupSort.unshift(groupName)
      } else {
        menuSetting.practice.push(groupName)
        menuSetting.propsGroupSort.push(groupName)
      }
    }

    let propTemp = {
      name: props[k].groupName,
      values: props[k].attrs.map(propValItem => {
        let tempPrice = propValItem.reprice;
        if (attrs[0].type == 'SPECIFICATION') {
          tempPrice = parseFloat(propValItem.reprice) + parseFloat(foodItem.price)
          console.log(foodItem.name,propValItem.reprice,foodItem.price)
        } 
        return {
          value: propValItem.name,
          price: parseFloat(tempPrice/ 100),
          propName: props[k].groupName,
          isMul: true
        }
      })
    }
    if(propTemp.values){
      propsRes.push(propTemp);
    }
  }

  let supplyCondiments = foodItem.supplyCondiments;
  let condimentTemp = {
    name: "加料",
    values: supplyCondiments.map(item => {
      return {
        value: item.name,
        price: (parseFloat(item.marketPrice) / 100),
        propName: "加料",
        isMul: true,
        type: "supplyCondiment"
      }
    })
  }
  if ( menuSetting.feeding.indexOf("加料")==-1) {
    menuSetting.feeding.push("加料")
    menuSetting.propsGroupSort.push("加料")
  }
  
  
  if(condimentTemp.values.length>0){
    propsRes.push(condimentTemp)
  }
  return propsRes;
}

// 爬取的数据中进行信息提取
async function handleMenuData(requestShopData, requestMenuData, menuSetting) {
  processDishes(requestMenuData);
  try {
    // 商户信息
    let merchantInfo = {
      shopName: requestShopData.name,
      shop_pic: requestShopData.logoUrl,
      categories: []
    }
    // 菜品目录
    let categories = []
    categories = requestMenuData.dishes.map(categoryItem => {
      let categoryData = {
        name: "",
        foods: []
      };
      categoryData.name = categoryItem.category.name;
      categoryData.foods = categoryItem.dishList.reduce((res, foodItem) => {
        if (foodItem) {
          let foodData = {
            name: (foodItem.name || ""),
            picUrl: foodItem.image || foodItem.thumbImage || "",
            price: (parseFloat(foodItem.price) / 100) || "",
            unit: foodItem.unit || "份",
            categoryName: categoryItem.category.name,
            props: [],
          };
          foodData.name = foodData.name.trim().replace(/\//ig, "-")
          foodData.props = formatFoodProps(foodItem, menuSetting)
          res.push(foodData)
        }
        return res;
      }, [])
      return categoryData
    })
    categories.map(item =>{
      let nameArr = []
      let foodsArr = []
      item.foods.map(foodsItem =>{
        if(!nameArr.includes(foodsItem.name)){
          nameArr.push(foodsItem.name)
          foodsArr.push(foodsItem)
          foodsArr.map(foodsArrItem=>{
            foodsArrItem.props.map(foodsArrItemProps=>{
              if(foodsArrItemProps.name == '规格'){
                // let price = foodsItem.price
                foodsArrItem.price = ''
                // foodsArrItemProps.values[0].price = price
              }
            })
          })
        } else {
          foodsArr.map(foodsArrItem =>{
           if(foodsArrItem.name == foodsItem.name){
            foodsArrItem.props.map(foodsArrItemProps =>{
              if(foodsArrItemProps.name == '规格'){
                foodsItem.props.map(foodsItemProps =>{
                  if(foodsItemProps.name == '规格'){
                    // let price = foodsItem.price
                    foodsArrItem.price = ''
                    // foodsItemProps.values[0].price = price
                    // foodsArrItemProps.values.push(foodsItemProps.values[0])
                  }
                })
              }
            })
           }
          })
        }
      })
      item.foods = foodsArr
    })
    
    merchantInfo.categories = categories
    return merchantInfo;
  } catch (err) {
    console.log(err, `格式化转换菜品发生错误`)
  }
}

module.exports = {
  handleMenuData
}