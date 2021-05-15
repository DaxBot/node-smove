#!/usr/bin/env node

const plotlib = require('nodeplotlib');
const Smove = require('..');

const s = new Smove({ xf: 1.0, a: 1.0, v_min: 0.2, v_max: 0.68 });
const data = s.sample(0.01);

const velocity = { x: [], y: [], name: 'velocity' };
const position = { x: [], y: [], name: 'position' };

for(let i = 0; i < data.length; ++i) {
    // Graph velocity
    velocity.x.push(data[i].t);
    velocity.y.push(data[i].v);

    // Graph position
    position.x.push(data[i].t);
    position.y.push(data[i].x);
}

plotlib.plot([velocity, position]);
