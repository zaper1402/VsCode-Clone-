const $=jQuery= require('jquery');
require('jstree');
require('jquery-ui-dist/jquery-ui')
const nodePath = require('path');
const fs = require('fs');
var os = require('os');
// var pty = require('node-pty');
var Terminal = require('xterm').Terminal;

var tabsDb= new Map(),tabCounter=1;

$(document).ready(async function () {
    
    var tabs = $( "#tabs" ).tabs();

    tabs.on( "click", "span.ui-icon-close", function() {
        var panelId = $( this ).closest( "li" ).remove().attr( "aria-controls" );
        $( "#" + panelId ).remove();
        if(panelId.contains("Untitled")) tabCounter--;
        tabsDb.delete(panelId);
        let Lastpath = Array.from(tabsDb)[tabsDb.size-1][1];
        updateEditor(Lastpath);
        tabs.tabs( "refresh" );
    });

    tabs.on("click",'.ui-tabs-tab', function(){
        var panelId = $( this ).closest( "li" ).attr( "aria-controls" );
        updateEditor(tabsDb.get(panelId));
    })

    // New button function on click
    $("#New").on( "click", function( event ) {        
        let fileName="Untitled-"+tabCounter++;
        fs.writeFileSync(fileName, "Write your code here and update the extension of file" ); 
        // let path = nodePath.join(__dirname,fileName);
        // let path = process.cwd();
        updateEditor(path);
        addTab(path);
      });


    // Initialize node-pty with an appropriate shell
    // const shell = process.env[os.platform() === 'win32' ? 'COMSPEC' : 'SHELL'];
    // const ptyProcess = pty.spawn(shell, [], {
    //     name: 'xterm-color',
    //     cols: 80,
    //     rows: 30,
    //     cwd: process.cwd(),
    //     env: process.env
    // });

    // // Initialize xterm.js and attach it to the DOM
    // const xterm = new Terminal();
    // xterm.open(document.getElementById('terminal'));

    // // Setup communication between xterm.js and node-pty
    // xterm.onData(data => ptyProcess.write(data));
    // ptyProcess.on('data', function (data) {
    //     xterm.write(data);
    // });


    // "node-pty": "^0.9.0",
    let editor = await createEditor();

    let currPath = process.cwd();

    let data = [];
    let baseobj = {
        id: currPath,
        parent: '#',
        text: getNameFrompath(currPath)
    }

    let rootChildren = getCurrentDirectories(currPath);
    data = data.concat(rootChildren);

    data.push(baseobj);

    $('#jstree').jstree({
        "core": {
            // so that create works
            "check_callback": true,
            "data": data
        }
    }).on('open_node.jstree', function (e, data) {
        // console.log(data.node.children);

        data.node.children.forEach(function (child) {

            let childDirectories = getCurrentDirectories(child);
            // console.log('child directories are ');
            // console.log(childDirectories);

            for (let i = 0; i < childDirectories.length; i++) {
                let grandChild = childDirectories[i];
                $('#jstree').jstree().create_node(child, grandChild, "last");
            }

        })
    }).on("select_node.jstree", function (e, data) {
        // console.log(data.node.id);
        if (fs.lstatSync(data.node.id).isFile()) {
            updateEditor(data.node.id);
            addTab(data.node.id);
        }
        
    });

    function updateEditor(path){

        let fileName = getNameFrompath(path);
        let fileExtension = fileName.split('.')[1];

        if(fileExtension === 'js')
            fileExtension = 'javascript'
        
        let data = fs.readFileSync(path).toString();
        editor.setValue(data);

        monaco.editor.setModelLanguage(editor.getModel(), fileExtension);

    }

    function addTab(path) {
        
        let fileName = getNameFrompath(path);
    
        if(tabsDb.has(fileName)){
            return;
        }else{
            tabsDb.set(fileName,path);
        }
        
        var label = fileName;
        var  tabTemplate = "<li><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>";

        id = fileName;
        li = $( tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) ),
     
        tabs.find( ".ui-tabs-nav" ).append( li );
        tabs.append( "<div id='" + id + "'></div>" );
        tabs.tabs( "refresh" );

    }  
})



function getNameFrompath(path) {
    return nodePath.basename(path);
}

function getCurrentDirectories(path) {

    if (fs.lstatSync(path).isFile()) {
        return [];
    }

    let files = fs.readdirSync(path);
    // console.log(files);

    let rv = [];
    for (let i = 0; i < files.length; i++) {
        let file = files[i];

        rv.push({
            id: nodePath.join(path, file),
            parent: path,
            text: file
        })
    }

    return rv;
}

function createEditor() {

    return new Promise(function (resolve, reject) {
        let monacoLoader = require('./node_modules/monaco-editor/min/vs/loader.js');
        // console.log(monacoLoader);
        monacoLoader.require.config({ paths: { 'vs': './node_modules/monaco-editor/min/vs' } });

        monacoLoader.require(['vs/editor/editor.main'], function () {
            var editor = monaco.editor.create(document.getElementById('editor'), {
                value: [
                    'function x() {',
                    '\tconsole.log("Hello world!");',
                    '}'
                ].join('\n'),
                language: 'javascript'
            });

            resolve(editor);
        });
    })

}

