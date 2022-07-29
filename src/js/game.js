/*
TODO:  Prioritized
finish cleanup
document retrobuffer functions
make retrobuffer a class
add fillpoly and drawpoly to retrobuffer
put

*/

// import Stats from './Stats.js';
// stats = new Stats();
// stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
// document.body.appendChild( stats.dom );



import RetroBuffer from './core/RetroBuffer.js';
import MusicPlayer from './musicplayer.js';

//sound assets
import cellComplete from './sounds/cellComplete.js';
import tada from './sounds/tada.js';

import { playSound, Key } from './core/utils.js';
import Splode from './splode.js';

document.body.style="margin:0; background-color:black; overflow:hidden";
if(innerWidth < 800){
  w = innerWidth;
h = innerHeight;
}else if(innerWidth < 1300){
  w = Math.floor(innerWidth/2);
  h = Math.floor(innerHeight/2);
}else  {
  w = Math.floor(innerWidth/3.5);
h = Math.floor(innerHeight/3.5);
}

view = {
  x: 0,
  y: 0,
}

screenCenterX = w/2; screeenCenterY = h/2;
gamestate=0;
paused = false;
started=false;

const atlasURL = 'DATAURL:src/img/palette.webp';
atlasImage = new Image();
atlasImage.src = atlasURL;

atlasImage.onload = function(){ 
  let c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  let ctx = c.getContext('2d');
  ctx.drawImage(this, 0, 0);
  atlas = new Uint32Array( ctx.getImageData(0,0,64, 64).data.buffer );
  window.r = new RetroBuffer(w, h, atlas, 10);
  gameInit();
};

function gameInit(){
  window.playSound = playSound;
  gamebox = document.getElementById("game");
  gamebox.appendChild(r.c);
  gameloop();
}

window.t = 1;
splodes = [];

sounds = {};
soundsReady = 0;
totalSounds = 2;
audioTxt = "";
debugText = "";

const PRELOAD = 0;
const GAME = 1;
const TITLESCREEN = 2;


function initGameData(){

}

function initAudio(){
  audioCtx = new AudioContext;
  audioMaster = audioCtx.createGain();
  compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-60, audioCtx.currentTime);
    compressor.knee.setValueAtTime(40, audioCtx.currentTime); 
    compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
    compressor.attack.setValueAtTime(0, audioCtx.currentTime);
    compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

  audioMaster.connect(compressor);
  compressor.connect(audioCtx.destination);

  sndData = [
    {name:'cellComplete', data: cellComplete},
    {name:'tada', data: tada},

  ]
  totalSounds = sndData.length;
  soundsReady = 0;
  sndData.forEach(function(o){
    var sndGenerator = new MusicPlayer();
    sndGenerator.init(o.data);
    var done = false;
    setInterval(function () {
      if (done) {
        return;
      }
      done = sndGenerator.generate() == 1;
      soundsReady+=done;
      if(done){
        let wave = sndGenerator.createWave().buffer;
        audioCtx.decodeAudioData(wave, function(buffer) {
          sounds[o.name] = buffer;
        })
      }
    },0)
  })
}

function updateGame(){
  t+=1;
  splodes.forEach(e=>e.update());
  pruneDead(splodes);

  if(Key.justReleased(Key.r)){
    resetGame();
  }
}

function drawGame(){
  r.clr(3, r.SCREEN)
  let text = "GAME PLAY STATE"
  r.text([text, w/2-2, 100, 1, 3, 'center', 'top', 1, 22]);

  r.render();
}

function resetGame(){
  window.t = 1;
  splodes = [];
  initGameData();
  gameState = 2;
}

function preload(){
  r.clr(0, r.SCREEN)

  r.text([audioTxt, w/2-2, 100, 1, 3, 'center', 'top', 1, 22]);
 
  audioTxt = "CLICK TO INITIALIZE\nGENERATION SEQUENCE";
  if(soundsReady == totalSounds){
    audioTxt="ALL SOUNDS RENDERED.\nPRESS UP/W/Z TO CONTINUE";
  } else if (started){
    audioTxt = "SOUNDS RENDERING... " + soundsReady;
  } else {
    audioTxt = "CLICK TO INITIALIZE\nGENERATION SEQUENCE";
  }

  if(Key.justReleased(Key.UP) || Key.justReleased(Key.w) || Key.justReleased(Key.z)){
      playSound(sounds.tada);
      gamestate = TITLESCREEN
    
  }; 
  r.render();
}

function titlescreen(){
  if(Key.justReleased(Key.UP) || Key.justReleased(Key.w) || Key.justReleased(Key.z)){
    gamestate = 1;
  }

  r.clr(3, r.SCREEN)
  let text = "TITLE SCREEN"
  r.text([text, w/2-2, 100, 1, 3, 'center', 'top', 1, 22]);

  r.render();
}


//initialize  event listeners--------------------------
window.addEventListener('keyup', function (event) {
  Key.onKeyup(event);
}, false);
window.addEventListener('keydown', function (event) {
  Key.onKeydown(event);
}, false);
window.addEventListener('blur', function (event) {
  paused = true;
}, false);
window.addEventListener('focus', function (event) {
  paused = false;
}, false);

onclick=e=>{
  x=e.pageX;y=e.pageY;
  paused = false;
  switch(gamestate){
      case PRELOAD: 
        if(soundsReady == 0 && !started){
          initGameData();
          initAudio();
          started = true;
        }
      break;
      case 1: 
      case 2: 
      case 3: 
  }
}

function pruneDead(entitiesArray){
  for(let i = 0; i < entitiesArray.length; i++){
    let e = entitiesArray[i];
    if(!e.alive){
      entitiesArray.splice(i,1);
    }
  }
}

function pruneScreen(entitiesArray){
  for(let i = 0; i < entitiesArray.length; i++){
    let e = entitiesArray[i];
    if(!inView(e)){
      entitiesArray.splice(i,1);
    }
  }
}


function gameloop(){
  if(1==1){
  // stats.begin();
    switch(gamestate){
      case PRELOAD: 
        preload();
        break;
      case GAME: 
        updateGame();
        drawGame();
        break;
      case TITLESCREEN: 
        titlescreen();
        break;
    }
    Key.update();
  //  stats.end();
    requestAnimationFrame(gameloop);
  }
}

