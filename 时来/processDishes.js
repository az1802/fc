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
    
  // console.log(dishNameMap["五指毛桃炖瘦肉汤"])
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
            attrItem.attrs[0].skuPrice = dish.price;
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



module.exports = {
  processDishes
}