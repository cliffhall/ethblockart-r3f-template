import React, { useRef, useState, useEffect, useMemo } from 'react';
import MersenneTwist from 'mersenne-twister';
import { BigNumber } from "ethers";
import Color from 'color';
import * as THREE from 'three';
import { TorusKnot } from '@react-three/drei';
import { extend, useThree, useFrame } from 'react-three-fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass'

extend({ EffectComposer, ShaderPass, RenderPass, UnrealBloomPass, FilmPass })


// Required style metadata
const styleMetadata = {
  name: 'The Blockness of Space',
  description: `Space isn't empty. Any fixed volume at any given moment varies from the next in content of matter, gas, radiation, temperature, pressure, and field effects. Equally various and unique are the blocks of Ethereum.`,
  image: '',
  creator_name: 'Cliff Hall',
  options: {
    mod1: 0.65,
    mod2: 0.1,
    mod3: 0.4,
    color1: '#4f83f1',
    color2: '#aa0909',
    color3: '#45cc66',
    background: '#000',
  },
};
export { styleMetadata };

// Get a fresh, seeded MersenneTwist instance for the given block
function getTwister(block) {
  const { hash } = block;
  const seed = parseInt(hash.slice(0, 16), 16);
  return new MersenneTwist(seed);
}

export default function CustomStyle({
    block,
    attributesRef,
    mod1,
    mod2,
    mod3,
    color1,
    color2,
    color3,
    background,
  }) {
  console.log(`rendering`);

  // Local state
  const [analysis, setAnalysis] = useState();
  const [attribs, setAttribs] = useState();
  const [settings, setSettings] = useState();

  // Refs
  const group = useRef();

  // Three
  const { size, camera } = useThree();
  const { width, height } = size;

  // Handle correct scaling of scene as canvas is resized, and when generating upscaled version.
  useEffect(() => {
    console.log(`updating camera...`);
    let DEFAULT_SIZE = 500;
    let DIM = Math.min(width, height);
    let M = DIM / DEFAULT_SIZE;
    camera.zoom = M * 200;
    camera.updateProjectionMatrix();
  }, [camera, width, height]);

  // Update the mods group, when a mod changes
  useEffect(() => {
    setSettings({mods:[mod1, mod2, mod3], colors:[color1, color2, color3, background]});
  }, [mod1, mod2, mod3, color1, color2, color3, background, setSettings])

  // Analyze block when it changes
  useEffect( () => {

    if (!!block) {
      console.log(`analyzing block...`);
      const ba = new BlockAnalysis(block);
      setAnalysis(ba);
      //ba.log();
    }

  },[block]);

  // Compute custom style attributes when block analysis is complete or settings change
  useEffect( () => {

    if (!!analysis) {
      console.log('updating attributes...');
      const twister = getTwister(analysis.block);

      // Create the custom attributes
      const charm = settings.mods[0] / 10;
      const luck = settings.mods[2] * 12
      const deepness = (twister.random() / 100) *  100;
      const magic = (settings.mods[1] + 0.001) * twister.random() * 500;
      const force = analysis
          .txStats
          .highest.nonce
          .sub(analysis.txStats.average.gasPrice)
          .lt(analysis.txStats.average.gasPrice.sub(analysis.txStats.lowest.gasPrice))
              ? "Vengeance"
              : "Calm";
      const glow = Color([
          Color(settings.colors[0]).color[0],
          Color(settings.colors[1]).color[1],
          Color(settings.colors[2]).color[2]]
      ).hex();
      const custom = { magic, charm, luck, deepness, force, glow };

      // Update the custom attribute metadata
      attributesRef.current = () => {
        function properCase(me) {
          return me.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
          });
        }

        return {
          attributes: !!custom
              ? Object.keys(custom).map(key => {
                const trait_type = properCase(key);
                const value = custom[key];
                return (typeof value === 'string')
                    ? {
                      trait_type,
                      value
                    }
                    : {
                      display_type: 'number',
                      trait_type,
                      value
                    }
              })
              : []
        }
      };

      // Set the attribs and force re-render
      setAttribs(custom);
    }

  // eslint-disable-next-line
  }, [analysis, settings]);

  // Generate scene content when the attributes change
  const content = useMemo(() => {
    const c = (!!attribs && !!analysis)
        ? new Content(analysis, attribs, settings)
        : undefined
    console.log(c);
    return c;
  // eslint-disable-next-line
  }, [attribs]);

  function Effects({...props}) {
    const composer = useRef()
    const { scene, gl, size, camera } = useThree()
    const aspect = useMemo(() => new THREE.Vector2(512, 512), [])
    useEffect(() => void composer.current.setSize(size.width, size.height), [size])
    useFrame(() => composer.current && composer.current.render(), 1)
    return (
        <effectComposer ref={composer} args={[gl]}>
          <renderPass attachArray="passes" scene={scene} camera={camera} />
          <unrealBloomPass attachArray="passes" args={[aspect, 1, 1, 0]} />
        </effectComposer>
    )
  }

  // Render the content
  const renderContent = () => {
    return (
        <group ref={group} position={[-0, 0, 0]} rotation={[0, settings.mods[1], 0]}>
          <ambientLight intensity={1} color={attribs.glow} />
          {content.payload.map((sp, index) => {
            return (
                <group key={index} position={sp}>
                  <TorusKnot
                      args={[attribs.deepness, attribs.charm, attribs.magic, attribs.luck]}
                  >
                    <meshNormalMaterial attach="material" />
                  </TorusKnot>
                </group>
            );
          })}
          <Effects/>
        </group>
    );
  }

  // Render the content if it exists, or an empty div otherwise
  return (
      !!content ? renderContent() : <></>
  );

}

class Content {
  constructor(analysis, attribs, settings) {
    console.log(`creating content...`);
    this.analysis = analysis;
    this.attribs = attribs;
    this.settings = settings;
    this.twister = getTwister(analysis.block);
    this.payload = this.createContent();

  }

  createContent() {
    return this.analysis.txs.map((tx, i) => {
      const mul = 1.5;
      const flip = i % 2 ? -1 : 1;
      const flip2 = i % 3 ? -1 : 1;
      const flip3 = i % 4 ? -1 : 1;
      return [
        this.twister.random() * mul * flip,
        this.twister.random() * mul * flip2,
        this.twister.random() * mul * flip3,
      ];
    });
  }
}

class BlockAnalysis {

  constructor (block) {

    // Ref to the block
    this.block = block;

    // Extract block-level Traits
    this.timestamp = new Date(this.block.timestamp * 1000);
    this.txCount = this.block.transactions.length;

    this.blockNum = BigNumber.from(this.block.number);
    this.hash = BigNumber.from(this.block.hash);
    this.gas = BigNumber.from(this.block.gasUsed.hex);
    this.gasLimit = BigNumber.from(this.block.gasLimit.hex);
    this.difficulty = BigNumber.from(this.block.difficulty);
    this.miner = BigNumber.from(this.block.miner);
    this.nonce = BigNumber.from(this.block.nonce);
    this.extra = BigNumber.from(this.block.extraData);

    // Extract transaction-level traits
    const zero = () => BigNumber.from(0);
    const numTx = () => BigNumber.from(this.txCount);

    this.txs = this.block.transactions.map(tx => ({
      hash: BigNumber.from(tx.hash),
      gasPrice: BigNumber.from(tx.gasPrice.hex),
      gasLimit: BigNumber.from(tx.gasLimit.hex),
      value: BigNumber.from(tx.value.hex),
      nonce: BigNumber.from(tx.nonce),
      data: tx.data
    }))
    this.txStats = {
      highest: {
        gasLimit: this.txs.reduce((a, t) => a.lt(t.gasPrice) ? t.gasPrice : a, zero()),
        gasPrice: this.txs.reduce((a, t) => a.lt(t.gasLimit) ? t.gasLimit : a, zero()),
        value: this.txs.reduce((a, t) => a.lt(t.value) ? t.value : a, zero()),
        nonce: this.txs.reduce((a, t) => a.lt(t.nonce) ? t.nonce : a, zero()),
      },
      lowest: {
        gasLimit: this.txs.reduce((a, t) => a.gt(zero()) && a.lt(t.gasPrice) ? a : t.gasPrice, zero()),
        gasPrice: this.txs.reduce((a, t) => a.gt(zero()) && a.lt(t.gasLimit) ? a : t.gasLimit, zero()),
        value: this.txs.reduce((a, t) => a.gt(zero()) && a.lt(t.value) ? a : t.value, zero()),
        nonce: this.txs.reduce((a, t) => a.gt(zero()) && a.lt(t.nonce) ? a : t.nonce, zero()),
      },
      average: {
        gasLimit: this.txs.reduce((a, t) => a.add(t.gasPrice), zero()).div(numTx()),
        gasPrice: this.txs.reduce((a, t) => a.add(t.gasLimit), zero()).div(numTx()),
        value: this.txs.reduce((a, t) => a.add(t.value), zero()).div(numTx()),
        nonce: this.txs.reduce((a, t) => a.add(t.nonce), zero()).div(numTx())
      },
      nonces: this.txs.map(t => t.nonce),
      values: this.txs.map(t => t.value),
      gasPrices: this.txs.map(t => t.gasPrice),
      gasLimits: this.txs.map(t => t.gasLimit)
    }
  }

  log() {
    console.log('Block Traits')
    console.table({
      blockNum: this.blockNum.toNumber(),
      hash: this.hash.toString(),
      gas: this.gas.toNumber(),
      gasLimit: this.gasLimit.toNumber(),
      difficulty: this.difficulty.toNumber(),
      miner: this.miner.toString(),
      nonce: this.nonce.toString(),
      extra: this.extra.toString(),
      timestamp: this.timestamp.toDateString(),
      txCount: this.txCount
    });

    console.log('Transaction Traits')
    console.log(`Highest`)
    console.table(this.txStats.highest)

    console.log(`Lowest`)
    console.table(this.txStats.lowest)

    console.log(`Average`)
    console.table(this.txStats.average)

    console.log(`Gas Prices`)
    console.table(this.txStats.gasPrices)

    console.log(`Gas Limits`)
    console.table(this.txStats.gasLimits)

    console.log(`Tx Values`)
    console.table(this.txStats.values)

    console.log(`Tx Nonces`)
    console.table(this.txStats.nonces)
  }

}