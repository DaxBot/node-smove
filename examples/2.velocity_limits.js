#!/usr/bin/env node

const plotlib = require('nodeplotlib');
const Smove = require('..');


const START_POSITION = 0.0; // m
const END_POSITION = 2.0;   // m
const ACCELERATION = 1.2;   // m/s^2
const MIN_VELOCITY = 0.2;   // m/s
const MAX_VELOCITY = 1.0;   // m/s
const SAMPLE_RATE = 0.01;   // s

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
    // Graph velocity
    velocity.x.push(s[i].t);
    velocity.y.push(s[i].v);

    // Graph position
    position.x.push(s[i].t);
    position.y.push(s[i].x);
}

plotlib.plot([velocity, position]);
