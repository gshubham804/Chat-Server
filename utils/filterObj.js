const filterObj = (Obj,...allowedFields)=>{
    const newObj = {};
    Object.keys(obj).forEach((el)=>{
        if(allowedFields.includes(el)) newObj[el] = obj[e];
    })

    return newObj;
}

module.exports = filterObj;