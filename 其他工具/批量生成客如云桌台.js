function insertScript() {
  let setScript = document.createElement("script");
  setScript.setAttribute("type", "text/javascript");
  setScript.setAttribute("src", "https://unpkg.com/axios@0.21.1/dist/axios.min.js");
  setScript.setAttribute("id", "aa");
  document.body.insertBefore(setScript, document.body.lastChild);
}

async function sleep() {
  return new Promise((resolve, reject) => {
    setTimeout(resolve,3000)
  })
}

// 生成桌台
async function getAreaCode() {
  let instance = window._shilaiInstance;
  let url = 'https://b.keruyun.com/mind/bui/commercial/tableSetting/getAreaCode';
  let res = await instance.post(url)
  console.log("res----",res)
  if (res.data.code=="200") {
    return res.data.data.areaCode
  }
  return false
}

async function genArea(tableAreaName) {
  let areaCode = await getAreaCode()
  console.log("areaCode---",areaCode)
  if (!areaCode) {
    return;
  }
  let instance = window._shilaiInstance;
  let url = "https://b.keruyun.com/mind/bui/commercial/tableSetting/saveArea";
  
  let res = await instance.post(url, {
    areaCode: areaCode,
    areaName: tableAreaName,
    floor: "+1",
    isSmoking: "1",
    memo: "",
  })

  if (res.data.code==200) {
    return res.data.data;
  } else {
    return false;
  }

  console.log("生成的桌台区域信息",res)
}

async function getTableTypeList() {
  let instance = window._shilaiInstance;
  let url = "https://b.keruyun.com/mind/bui/commercial/tableTypeSetting/getTableTypeList";

  let res = await instance.get(url);
  if (res.data.code == 200) {
    let tableList = res.data.data;
    let tableTypeId = "",tableType=""
    tableList.forEach(item => {
      if (item.tableTypeName=="大厅") {
        tableTypeId = item.tableTypeId;
        tableType = item.tableType
      }
    })


    return tableTypeId ? {
      tableTypeId,
      tableType
    } : {};
  } else {
    return {};
  }
  
}

async function batchCreateTable(tablesArr, areaIds) {
  let { tableTypeId, tableType } = await getTableTypeList()
  if (!tableTypeId) {
    return;
  }
  console.log("tableTypeId---",tableTypeId)

  let instance = window._shilaiInstance;
  let url = "https://b.keruyun.com/mind/bui/commercial/tableSetting/batchCreateTable";

  await sleep(2000)
  let res = await instance.post(url, {
    areaIds: areaIds,
    canBooking: 0,
    excludeNums: [],
    isReset: 1,
    memo: "",
    minConsum: 0,
    seatNames: ["S1", "S2", "S3", "S4"],
    tableNames:tablesArr,
    tablePersonCount: "4",
    tableStatus: "0",
    tableType: tableType,
    tableTypeId: tableTypeId,
  })
  
  console.log("批量生成桌台信息",res)
}


async function genTables(tableAreaName,tablesArr) {
  if (!window.axios) {
    insertScript()
  }
  for (let i = 0; i < 10; i++) {
    if (window.axios) {
      break;
    } else {
      await sleep(1000);
    }
  }
  const instance = axios.create({});
  window._shilaiInstance = instance
  let areaRes = await genArea(tableAreaName)
  if (!areaRes) {
    return;
  }
  let { commercialArea} = areaRes

  await batchCreateTable(tablesArr,[commercialArea.id])
  
}

let tablesStr = "01 02 03 04";
let tableAreaName = "sj_01"
let tablesArr = tablesStr.split(" ");
genTables(tableAreaName,tablesArr)
