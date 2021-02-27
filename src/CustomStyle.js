import React, { useEffect, useMemo, useRef } from 'react';
import { useThree } from 'react-three-fiber';
import MersenneTwist from 'mersenne-twister';
import { TorusKnot } from '@react-three/drei';
import Color from 'color';

/*
Create your Custom style to be turned into a EthBlock.art BlockStyle NFT

Basic rules:
 - use a minimum of 1 and a maximum of 4 "modifiers", modifiers are values between 0 and 1,
 - use a minimum of 1 and a maximum of 3 colors, the color "background" will be set at the canvas root
 - Use the block as source of entropy, no Math.random() allowed!
 - You can use a "shuffle bag" using data from the block as seed, a MersenneTwister library is provided

 Arguments:
  - block: the blockData, in this example template you are given 3 different blocks to experiment with variations, check App.js to learn more
  - mod[1-3]: template modifier arguments with arbitrary defaults to get your started
  - color: template color argument with arbitrary default to get you started

Getting started:
 - Write react-three-fiber code, consuming the block data and modifier arguments,
   make it cool and use no random() internally, component must be pure, output deterministic
 - Customize the list of arguments as you wish, given the rules listed below
 - Provide a set of initial /default values for the implemented arguments, your preset.
 - Think about easter eggs / rare attributes, display something different every 100 blocks? display something unique with 1% chance?

 - check out react-three-fiber documentation for examples!
*/

// Required style metadata
const styleMetadata = {
  name: 'The Blockness of Space',
  description: `Space isn't empty. Any given fixed volume at any given moment varies from the next in content of matter, gas, radiation, temperature, pressure, and field effects. Equally various and unique are the blocks of Ethereum and their content.`,
  image: '',
  creator_name: 'Cliff Hall',
  options: {
    mod1: 0.4,
    mod2: 0.1,
    mod3: 0.4,
    color1: '#fff000',
    background: '#000000',
  },
};

export { styleMetadata };

export default function CustomStyle({
  block,
  attributesRef,
  mod1 = 0.75,
  mod2 = 0.25,
  mod3 = 0.4,
  color1 = '#4f83f1',
  background = '#ccc',
}) {
  console.log(`rendering`);

  // Refs
  const shuffleBag = useRef();
  const group = useRef();
  const hoistedValue = useRef();

  // Three
  const { size, camera } = useThree();
  const { width, height } = size;

  // Update custom attributes related to style when the modifiers change
  useEffect(() => {
        console.log('updating attributes...');
        attributesRef.current = () => {
          function properCase(me) {
            return me.replace(/\w\S*/g, function (txt) {
              return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
          }

          return {
            attributes: hoistedValue.current
                ? Object.keys(hoistedValue.current).map(key => {
                  const trait_type = properCase(key);
                  const value = hoistedValue.current[key];
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
          };
        };
      }, [hoistedValue, attributesRef]);

  // Handle correct scaling of scene as canvas is resized, and when generating upscaled version.
  useEffect(() => {
    console.log(`updating camera...`);
    let DEFAULT_SIZE = 500;
    let DIM = Math.min(width, height);
    let M = DIM / DEFAULT_SIZE;
    camera.zoom = M * 200;
    camera.updateProjectionMatrix();
  }, [camera, width, height]);

  // Shuffle the random number bag when block changes
  const [color, scale, tori] = useMemo(() => {
    console.log(`shuffling...`);
    const { hash } = block;
    const seed = parseInt(hash.slice(0, 16), 16);
    shuffleBag.current = new MersenneTwist(seed);
    const color = Color([ran255(), ran255(), ran255()]).hex();
    const scale = shuffleBag.current.random() / 100;
    const tori = block.transactions.map((tx, i) => {
      const mul = 1.5;
      const flip = i % 2 ? -1 : 1;
      const flip2 = i % 3 ? -1 : 1;
      const flip3 = i % 4 ? -1 : 1;
      return [
        shuffleBag.current.random() * mul * flip,
        shuffleBag.current.random() * mul * flip2,
        shuffleBag.current.random() * mul * flip3,
      ];
    });

    function ran255() {
      return Math.floor(255 * shuffleBag.current.random());
    }

    hoistedValue.current = {
        magic: 10,
        charm: 5,
        luck: 3,
        deepness: "Abiding",
        calm: "Approaching",
        vengeance: "Ultimate"
    };

    return [color, scale, tori];

    }, [block]);

  // Render the scene
  return (
    <group ref={group} position={[-0, 0, 0]} rotation={[0, mod2, 0]}>
      <ambientLight intensity={1} color={color} />
      {tori.map((sp, index) => {
        return (
          <group key={index} position={sp}>
            <TorusKnot
              args={[scale * 100, mod1 / 10, (mod2 + 0.001) * 500, mod3 * 12]}
            >
              <meshNormalMaterial attach="material" />
            </TorusKnot>
          </group>
        );
      })}
    </group>
  );
}
