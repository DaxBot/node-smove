#!/usr/bin/env node

const plotlib = require('nodeplotlib');
const Smove = require('..');

const START_POSITION = 0.0;
const END_POSITION = 1.0;
const ACCELERATION = 1.0;
const SAMPLE_RATE = 0.1; // 100 ms

const smove = new Smove({
    x0: START_POSITION,
    xf: END_POSITION,
    a: ACCELERATION
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
