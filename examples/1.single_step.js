const plotlib = require('nodeplotlib');

const Smove = require('..');

const SAMPLE_RATE = 0.1; // 100 ms

const smove = new Smove({ xf: 1.0, a: 1.0 });
const s = smove.sample(SAMPLE_RATE);

const velocity = { x: [], y: [], name: 'velocity' };
const position = { x: [], y: [], name: 'position' };
for(let i = 0; i < s.length; ++i) {
    velocity.x.push(i * SAMPLE_RATE);
    position.x.push(i * SAMPLE_RATE);

    // Graph velocity
    const v = s[i];
    velocity.y.push(v);

    // Graph position
    const v_last = (i == 0) ? 0 : velocity.y[i-1];
    const x_last = (i == 0) ? 0 : position.y[i-1];
    const dx = (v_last + v) / 2 * SAMPLE_RATE;

    position.y.push(x_last + dx);
}

plotlib.plot([velocity, position]);
