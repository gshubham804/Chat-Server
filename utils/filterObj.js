const filterObj = (Obj,...allowedFields)=>{
    const newObj = {};
    Object.keys(Obj).forEach((el)=>{
        if(allowedFields.includes(el)) newObj[el] = Obj[e];
    })

    return newObj;
}

module.exports = filterObj;