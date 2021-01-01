import ReactDOM from 'react-dom'
import React, { useRef, useState } from 'react'
import Sketch from "react-p5";
import blocks from './blocks'

const keccak256 = require('keccak256')

const SIZE = 1280
const RANDOM = false //set this to false to start using block data instead of random

const DOGGERWIDTH = 75
const SHIPDEPTH = SIZE/4
const FISH_DENSITY = 42
const MAXGAS = 15000000

const FOREST = 1
const GRASS = 2
const DOCK = 3
const MOREGRASS = 4
const RIVER = 5
const EVENMOREGRASS = 6
const SETTLERSDOCK = 7
const COPPERMTN = 8
const CORN = 9
const DEADGRASS = 10
const SETTLERS = 11
const DEADMTN = 12
const MOREDEADGRASS = 13
const DEADTIMBER = 14
const MOREMOREDEADGRASS = 15
const MOREDEADMTN = 16
const FISHMONGER = 17
const COURTHOUSE = 18
const MOREMOREMOREDEADGRASS = 19
const HARBOR = 20
const MARKET = 21
const TIMBERMILL = 22
const MININGCAMP = 23
const MININGSHAFT = 24
const MTN = 25
const SILVERMTNCAMP = 26
const SILVERMTN = 27
const TIMBERCAMP = 28
const VILLAGERS = 29
const VILLAGERSDOCK = 30
const WARRIORS = 31
const WARRIORSDOCK = 32


const CustomStyle = ({ fakeRandomHash, block = blocks[2]}) => {

  const width = SIZE
  const height = SIZE
  const horizon = SIZE/2


  if(!fakeRandomHash){
    return <div>hashing it out...</div>
  }else{
    console.log("fakeRandomHash is ",fakeRandomHash)
  }
  //const { hash } = block
  const hash = fakeRandomHash

  let cloudSizes = [
    [400,152],
    [600,228],
    [901,250],
    [810,280],
    [810,280],
    [810,280],
    [810,280],
  ];

  let possibleLetters = "ABCDEF1234567890xaabcdef" //<-- notice two a's in a row to load both

  let sky;
  let sea;
  let clouds=[];
  let oceanCover=[];
  let doggers=[];
  let fish=[];
  let tiles=[]
  let topLeftCorner
  let topRightCorner
  let rightEdge
  let leftEdge
  let handwriting = {}

  let lastChar
  const translateChracterToPath = (character)=>{

    let image = "handwritten/";

    if(character == "#"){
      image = character+".png"
    }else if(character == " "){
      image = image+"space.png"
    }else if(character == "."){
      image = image+"dot.png"
    }else if(character == ","){
      image = image+"comma.png"
    }else if(character == ":"){
      image = image+"colon.png"
    }else if(character == "-"){
      image = image+"dash.png"
    }else if (character == character.toUpperCase()) {
      image = image+character+".png"
    }else{
      if((character=="a"||character=="l"||character=="s")&&lastChar==character){
        image = image+character+"_2.png"
      }else{
        image = image+character+"_.png"
      }
    }
    lastChar = character

    return image
  }

  function preload(p5)  {
    sky = p5.loadImage('sky.jpg');
    sea = p5.loadImage('oceanblackblur.jpg');
    topLeftCorner = p5.loadImage('topleftcorner.png');
    topRightCorner = p5.loadImage('toprightcorner.png');
    rightEdge = p5.loadImage('rightedge.png');
    leftEdge = p5.loadImage('leftedge.png');
    for(let c=0;c<7;c++){
      clouds[c] = p5.loadImage('cloud'+(c+1)+'_smaller.png');
    }
    for(let c=0;c<4;c++){
      oceanCover[c] = p5.loadImage('oceancover'+(c+1)+'.png');
    }

    for(let c=0;c<6;c++){
      doggers[c] = p5.loadImage('dogger'+(c+1)+'.png');
    }
    for(let c=0;c<10;c++){
      fish[c] = p5.loadImage('fish'+(c+1)+'.png');
    }
    for(let c=0;c<32;c++){
      tiles[c] = p5.loadImage('tile'+(c+1)+'.png');
    }

    for(let l in possibleLetters){
      let path = translateChracterToPath(possibleLetters[l])
      //console.log("LOADING",path)
      handwriting[path] = p5.loadImage(path);
    }
  }

  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(SIZE, SIZE).parent(canvasParentRef);
  };

  const draw = (p5) => {

    let currentHash = hash
    let currentEntropyPointer = 2
    const takeTwoBytesOfEntropy = ()=>{
      let twoBytes = currentHash[currentEntropyPointer++]+currentHash[currentEntropyPointer++]+currentHash[currentEntropyPointer++]+currentHash[currentEntropyPointer++]
      twoBytes = parseInt(twoBytes,16)
      if(currentEntropyPointer>=60){
        currentHash = keccak256(currentHash).toString('hex')
        currentEntropyPointer = 2
      }
      if(!RANDOM) return twoBytes
      return Math.random()*65535
    }

    p5.background(0);
    p5.image(sky, 0, 0, 4000, SIZE/2);
    p5.image(sea, 0, SIZE/2, 4000, SIZE/2);

    for(let c=1;c<8;c++){
      let blocksTraveled = 0;

      let speed = 32
      let startingLocation = takeTwoBytesOfEntropy()

      let location = startingLocation + blocksTraveled*speed;
      let cloudSize = cloudSizes[c-1];
      let cloudwidth = cloudSize[0];
      let cloudheight = cloudSize[1];
      location = width * (location/65535);
      while(location>width)
      {
        location-=(width+cloudwidth);
      }
      while(location<(cloudwidth*-1))
      {
        location+=(width+cloudwidth);
      }
      let top = (horizon-cloudheight+2);
      if(c>=6) top=0;
      else{
        //top+= (height-horizon)*take2BytesOfEntropy()/65535;
      }
      p5.image(clouds[c-1], location, top, cloudwidth, cloudheight);
    }

    let landHorizon = horizon-64

    let underwater = true

    let tileList = []

    for(let t=0;t<16;t++){
      const tileRandomish = takeTwoBytesOfEntropy()
      if(underwater){
        if(tileRandomish>40000 && t<10){
          p5.image(leftEdge, (t)*87, landHorizon, 87, 125);
          underwater = false
        }
      }else{


        const commonTiles = [  FOREST, GRASS, RIVER, GRASS, FOREST, MTN,/*3, 4, , 6, 9, 19, 18, 25 */]
        const keyResourceTiles = [ FOREST, CORN, MTN, TIMBERCAMP ]
        const exoticResourceTiles = [ COPPERMTN, TIMBERMILL, TIMBERCAMP, MININGCAMP, SILVERMTN ]
        const settlersTiles = [ SETTLERS, SETTLERSDOCK ]
        const villageTiles = [ VILLAGERS, VILLAGERSDOCK ]
        const castleTiles = [ WARRIORS, WARRIORSDOCK ]
        if(tileRandomish>55000 || t>13 && tileRandomish>40000 || t>14 && tileRandomish>20000 || t>=14 ){
          underwater=true
          tileList[t] = 0
          p5.image(rightEdge, (t)*87, landHorizon, 87, 125);
        }else if(tileRandomish>20000){
          tileList[t] = commonTiles[tileRandomish%commonTiles.length]
          p5.image(tiles[tileList[t]-1], (t)*87, landHorizon, 87, 125);
        }else if(tileRandomish>15000){
          tileList[t] = exoticResourceTiles[tileRandomish%exoticResourceTiles.length]
          p5.image(tiles[tileList[t]-1], (t)*87, landHorizon, 87, 125);
        }else if(tileRandomish>10000){
          tileList[t] = settlersTiles[tileRandomish%settlersTiles.length]
          p5.image(tiles[tileList[t]-1], (t)*87, landHorizon, 87, 125);
        }else if(tileRandomish>8000){
          tileList[t] = villageTiles[tileRandomish%villageTiles.length]
          p5.image(tiles[tileList[t]-1], (t)*87, landHorizon, 87, 125);
        }else if(tileRandomish>7000){
          tileList[t] = castleTiles[tileRandomish%castleTiles.length]
          p5.image(tiles[tileList[t]-1], (t)*87, landHorizon, 87, 125);
        }else {
          tileList[t] = tileRandomish%tiles.length
          p5.image(tiles[tileList[t]-1] , (t)*87, landHorizon, 87, 125);
        }
      }
    }

    let gasUsed = block.gasUsed

    let currentGasEntropyPointer = 2
    let currentGasEntropy = keccak256(gasUsed).toString('hex')
    //console.log("startingGasEntropy",currentGasEntropy)
    const getGasEntropy = ()=>{
      if(currentGasEntropyPointer>=59){//lol
        currentGasEntropyPointer=0
        currentGasEntropy = keccak256(currentGasEntropy).toString('hex')
      }
      let twoBytes = currentGasEntropy[currentGasEntropyPointer++]+currentGasEntropy[currentGasEntropyPointer++]+currentGasEntropy[currentGasEntropyPointer++]+currentGasEntropy[currentGasEntropyPointer++]
      twoBytes = parseInt(twoBytes,16)
      if(!RANDOM) return twoBytes
      return Math.random()*65535
    }

    let orderedFish = []

    for(let f=0;f<FISH_DENSITY*parseInt(gasUsed,16)/MAXGAS;f++){

      let fishType
      const randish = getGasEntropy()
      if(randish>30000){
        fishType = 3
      }else if(randish>15000){
        fishType = 2
      }else if(randish>10000){
        fishType = 1
      }else if(randish>1000){
        fishType = 0
      }else {
        fishType = 4
      }

      if(getGasEntropy()%2==1){
        fishType+=5
      }

      orderedFish.push(
        [fish[ fishType ], width * getGasEntropy() / 65535, height-SIZE/4*getGasEntropy()/65535, 64, 32]
      )
    }

    orderedFish.sort((a, b) => {
      return a[2]-b[2]
    })

    for(let f in orderedFish){
      p5.image(...orderedFish[f]);
    }



    for(let c=1;c<5;c++){
      let blocksTraveled = 0;

      let speed = 32
      let startingLocation = takeTwoBytesOfEntropy()

      let location = startingLocation + blocksTraveled*speed;
      let cloudSize = cloudSizes[c-1];
      let cloudwidth = cloudSize[0];
      let cloudheight = cloudSize[1];
      location = SIZE * (location/65535);
      while(location>width)
      {
        location-=(width+cloudwidth);
      }
      while(location<(cloudwidth*-1))
      {
        location+=(width+cloudwidth);
      }
      let top = (horizon-cloudheight+2);
      if(c>=6) top=0;
      else{
        //top+= (height-horizon)*take2BytesOfEntropy()/65535;
      }
      p5.image(oceanCover[c-1], location, height-cloudheight, cloudwidth*2, cloudheight);
    }



    let orderedShips = []
    for(let t in block.transactions){
      const transaction = block.transactions[t]
      let currentTransactionEntropyPointer = 2
      const takeOneByteOfTransactionEntropy = ()=>{
        let byte = transaction[currentTransactionEntropyPointer++]+transaction[currentTransactionEntropyPointer++]
        byte = parseInt(byte,16)
        if(!RANDOM) return byte
        return Math.random()*256
      }
      orderedShips.push(
        [doggers[takeOneByteOfTransactionEntropy() % doggers.length], width * takeOneByteOfTransactionEntropy() / 255, horizon+32+SHIPDEPTH*takeOneByteOfTransactionEntropy()/256, DOGGERWIDTH, DOGGERWIDTH*.9]
      )
    }

    orderedShips.sort((a, b) => {
      return a[2]-b[2]
    })

    for(let s in orderedShips){
      p5.image(...orderedShips[s]);
    }

    let TEXTSIZE = 32
    let LETTER_SPACING = 32
    let someString = "0x"+fakeRandomHash;
    let textStart = (width/2 - (someString.length*TEXTSIZE)/4)-TEXTSIZE/4
    for(let l in someString){
      //console.log("WRITINGE:",someString[l])
      p5.image( handwriting[translateChracterToPath(someString[l])] ,textStart + (TEXTSIZE/2)*l, horizon/5 ,TEXTSIZE,TEXTSIZE);
    }

    TEXTSIZE = 64
    LETTER_SPACING = 64
    someString = ""+parseInt(block.number,16);
    textStart = (width/2 - (someString.length*TEXTSIZE)/4)-TEXTSIZE/4
    for(let l in someString){
      //console.log("WRITINGE:",someString[l])
      p5.image( handwriting[translateChracterToPath(someString[l])] ,textStart + (TEXTSIZE/2)*l, horizon/12 ,TEXTSIZE,TEXTSIZE);
    }

    TEXTSIZE = 32
    LETTER_SPACING = 32
    someString = ""+parseInt(block.timestamp,16);
    textStart = (width/2 - (someString.length*TEXTSIZE)/4)-TEXTSIZE/4
    for(let l in someString){
      //console.log("WRITINGE:",someString[l])
      p5.image( handwriting[translateChracterToPath(someString[l])] ,textStart + (TEXTSIZE/2)*l, horizon/3.77 ,TEXTSIZE,TEXTSIZE);
    }

    /*
    //given the list of rendered tiles we can do all sorts of stuff...
    // was thinking it could have a population and the population
    // would work on nearby tiles so each block has a different
    // bonus of resources

    console.log(tileList)

    const populationBonus = (tile)=>{
      if(tile==SETTLERS) return 1;
      if(tile==SETTLERSDOCK) return 2;
      if(tile==VILLAGERS) return 3;
      if(tile==VILLAGERSDOCK) return 4;
      if(tile==WARRIORS) return 5;
      if(tile==WARRIORSDOCK) return 6;
      return 0;
    }


    for(let t in tileList){
      let populationsAtWork = populationBonus(tileList[t])
      //if(populationsAtWork>0) console.log("There is a population of "+populationsAtWork+" at tile "+t+"...")
    }
    */

    p5.image(topRightCorner,width-400,0,400,396);
    p5.image(topLeftCorner,0,0,400,396);


  };


  return <Sketch setup={setup} draw={draw} preload={preload}/>;
}



function App() {
  const [ fakeRandomHash, setFakeRandomHash ] = useState(keccak256(Date.now()).toString('hex').substr(2))
  return (
    <div className="App" >
      <CustomStyle fakeRandomHash={fakeRandomHash}/>
    </div>
  );
}

export default App;
