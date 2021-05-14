#!/usr/bin/env node

const plotlib = require('nodeplotlib');
const Smove = require('..');


const START_POSITION = 0.0; // m
const END_POSITION = 2.0;   // m
const ACCELERATION = 1.2;   // m/s^2
const MIN_VELOCITY = 0.2;   // m/s
const MAX_VELOCITY = 1.0;   // m/s
const SAMPLE_RATE = 0.1;    // s

const smove = new Smove({
    x0: START_POSITION,
    xf: END_POSITION,
    a: ACCELERATION,
    v_min: MIN_VELOCITY,
    v_max: MAX_VELOCITY,
});

const s = smove.sample(SAMPLE_RATE);
const velocity = { x: [], y: [], name: 'velocity' };
const position = { x: [], y: [], name: 'position' };

for(let i = 0; i < s.length; ++i) {
    const n = i * SAMPLE_RATE;
    velocity.x.push(n);
    position.x.push(n);

    // Graph velocity
    const v = s[i];
    velocity.y.push(v);

    // Graph position
    if(i == 0) {
        position.y.push(START_POSITION);
        continue;
    }

    const v_last = velocity.y[i-1];
    const x_last = position.y[i-1];
    const dx = (v_last + v_last) / 2 * SAMPLE_RATE;
    position.y.push(x_last + dx);
}

plotlib.plot([velocity, position]);
