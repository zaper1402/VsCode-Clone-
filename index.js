let $ = require('jquery');
require('jstree');
const nodePath = require('path');
const fs = require('fs');
const { get } = require('https');

$(document).ready(function(){

    let currPath = process.cwd();
    console.log(currPath);  
    let data = [];
    let baseobj = {
        id : currPath,
        parent:'#',
        text : getNameFromPath(currPath)
    }

    let rootChildren = getCurrentDirectories(currPath);
    data = data.concat(rootChildren);
    data.push(baseobj);

    $("#jstree").jstree({
        "core" : {
          // so that create works
          "check_callback" : true,
           "data": data
        }
    }).on('open_node.jstree', function(e, data) {
        // console.log(data.node.children);
        data.node.children.forEach(ele =>{
            let childDirectories = getCurrentDirectories(ele);

            childDirectories.forEach(child=>{
                $('#jstree').jstree().create_node(ele , child, "last", function(){
                    // alert("done");
                 });
            })
        })

    });
})

function getNameFromPath(path){
    return nodePath.basename(path);
}

function getCurrentDirectories(path){
    if(fs.lstatSync(path).isFile() ){
        return [];
    }
    let files= fs.readdirSync(path);
    console.log(files);

    let rv=[];
    for(let i=0;i<files.length;i++){
        let file = files[i];

        rv.push({
            id:nodePath.join(path,file),
            parent: path,
            text: file
        })
    }

    return rv;
}