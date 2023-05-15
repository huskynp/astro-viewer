let aladin;

const limitFov = fov => {
    if(fov[0]>70){
        aladin.setFov(70);
        return 70;
    }
    else if(fov[0]<(1/60)){
        aladin.setFov(1/60);
        return 1/60;
    }
    return aladin.getFov()[0];
}

const rad = Math.PI/180;
function orientationToAngles(e) {

    var _x = e.beta  ? e.beta  * rad : 0;
    var _y = e.gamma ? e.gamma * rad : 0;
    var _z = e.alpha ? e.alpha * rad : 0;

    var cX = Math.cos( _x/2 );
    var cY = Math.cos( _y/2 );
    var cZ = Math.cos( _z/2 );
    var sX = Math.sin( _x/2 );
    var sY = Math.sin( _y/2 );
    var sZ = Math.sin( _z/2 );

    // ZXY quaternion construction.

    var w = cX * cY * cZ - sX * sY * sZ;
    var x = sX * cY * cZ - cX * sY * sZ;
    var y = cX * sY * cZ + sX * cY * sZ;
    var z = cX * cY * sZ + sX * sY * cZ;

    return new Quaternion(w,x,y,z).toEuler();
}

let ra = 0;
let dec = 0;
const hundredPercentMovement = 70; // deg fov
const moveSpeed = fov => {
    return fov/hundredPercentMovement;
};

let paused = false;
const pauseFunc = (val=null) => {
    if(val){paused = !val;}
    if(paused){ // unpause
        $("#pause").text("Pause");
    } else { // pause
        $("#pause").text("Play");
    }
    paused = !paused;
}
$("#pause").click(() => {pauseFunc()});

addEventListener("deviceorientation", e => {
    if(!aladin){return;} // not ready yet
    let fov = aladin.getFov();
    fov = limitFov(fov);

    if(paused){
        const angles = orientationToAngles(e);
        const x = (180/Math.PI)*angles.h;
        const y = ((180/Math.PI)*angles.g) - 90;
        //const z = (180/Math.PI)*angles.pitch;

        let dra = x - ra;
        let ddec = y - dec;
        ra += dra * moveSpeed(fov);
        dec += ddec * moveSpeed(fov);
        console.log(dra, ddec, ra, dec, fov);
        
        aladin.gotoRaDec(ra,dec);
        //$("#angle").text(`${x} ${y}`);
    };
});

const createGPS = (newRa, newDec) => {
    aladin.removeLayers(); // remove any previous
    const overlay = A.graphicOverlay({color:"red", lineWidth:2});
    aladin.addOverlay(overlay);
    overlay.add(A.polyline([[ra,dec], [newRa,newDec]]));
}

let dialogObjInfo = {
    "name": "",
    "imageSrc": "",
    "dist": "",
    "description": "",
    "type": "",
    "ra": 0,
    "dec": 0,
};

const numberToWords = num => {
    if(num === "unknown"){ return "unknown"; }

    let suffix = "";
    if(num > 1000000){ 
        suffix = "million";
        num /= 1000000;
        if(num > 1000){ // 1000 mil = 1 bil
            suffix = "billion";
            num /= 1000;
        }
        if(num < 10){ // eg. 1.2 million
            num = num.toFixed(1);
        }else{ // eg. 24 million
            num = Math.round(num);
        }
        return `${num} ${suffix}`;
    }
    if(num > 100){ // eg. 729,000
        return Math.round(num).toLocaleString("en-US");
    }
    return num.toFixed(2).toString(); // eg. 4.27
}

const showInfoDialog = (objName, imgSrc, dist, desc, type, nra, ndec) => {
    dialogObjInfo = {
        "name": objName,
        "imageSrc": imgSrc,
        "dist": dist,
        "description": desc,
        "type": type,
        "ra": nra,
        "dec": ndec
    };
    $("#infodialog").prop("title", objName);
    $("#dialog-img").prop("src", imgSrc);
    $("#dialog-desc").text(desc);
    $("#dialog-distance").text(`Distance to Earth: ${numberToWords(dist)} light years`);
    $("#dialog-type").text(`Type: ${type}`);
    $("#dialog-nav").off('click').on('click', e => {
        e.preventDefault();
        createGPS(nra, ndec);
        $("#infodialog").dialog("close");
        $("#exploremenu").hide(); // basically go back to main screen
    });
    $("#infodialog").dialog({closeText: "X", title:objName}).dialog("open");
};

import { cool_objects } from "./cool-objects.js";

// add all cool objects to explore menu
cool_objects.forEach((obj, i) => {
    let html = `<div class="menuItem" id="${i}">
    <img src="${obj.img}" />
    <h2>${obj.name}</h2>
    <button class="menuButton">Info</button>
</div>`
    $(".table").append(html);
});

$(".menuButton").on("click", function(){
    let id = parseInt($(this).parent().prop("id"));
    console.log($(this).parent());
    let o = cool_objects[id];
    showInfoDialog(o.name,o.img,o.dist,o.desc,o.type,o.ra,o.dec);
})

$("#startbut").prop("disabled", true);
// $("#exploremenu").hide();
$("#search>.X").on("click", () => {$("#exploremenu").fadeOut()});
$("#explore").on("click", ()=>{
    $("#exploremenu").fadeIn();
    pauseFunc(true);
})

const config = {survey: "https://skies.esac.esa.int/DSSColor/", fov:70, cooFrame:"ICRSd", showReticle:false,showProjectionControl:false,showZoomControl:false,showFullscreenControl:false,showLayersControl:false,showGotoControl:false,showFrame:false}
A.init.then(() => {
    console.log("STARTED");
    $("#startbut").prop("disabled", true);
    //$("#startbut").on("click", e => {
    console.log("hi");
    $("#start").hide();
    $("#panorama").removeClass("#broken");
    aladin = A.aladin('#panorama', config);
    aladin.setProjection("AIT");
    aladin.setFovRange(0,10);
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {DeviceOrientationEvent.requestPermission();}
    //});
});