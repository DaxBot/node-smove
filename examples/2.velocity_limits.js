#!/usr/bin/env node

const plotlib = require('nodeplotlib');
const Smove = require('..');

const SAMPLE_RATE = 0.01; // 100 ms
const smove = new Smove({ xf: 2.0, a: 1.2, v_min: 0.2, v_max: 1.0});
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
        position.y.push(0);
        continue;
    }

    const v_last = velocity.y[i-1];
    const x_last = position.y[i-1];
    const dx = (v_last + v_last) / 2 * SAMPLE_RATE;
    position.y.push(x_last + dx);
}

plotlib.plot([velocity, position]);
