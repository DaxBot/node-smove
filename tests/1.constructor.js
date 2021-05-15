const chai = require('chai');
const Smove = require('..');

const expect = chai.expect;

describe('Constructor', function() {
    it('should be constructable', function() {
        new Smove({xf: 1.0, a: 1.0 });
    });

    it('should required acceleration', function() {
        expect(() => new Smove({ xf: 1.0 })).to.throw();
    });

    it('should require final position', function() {
        expect(() => new Smove({ a: 1.0 })).to.throw();
    });

    it('should require v_min <= v_max', function() {
        expect(() => {
            new Smove({ xf: 1, a:1, v_min: 2, v_max: 1 });
        }).to.throw();
    });

    it('should require v_min >= 0', function() {
        expect(() => {
            new Smove({ xf: 1, a:1, v_min: -1 });
        }).to.throw();
    });

    it('should require v_max > 0', function() {
        expect(() => {
            new Smove({ xf: 1, a:1, v_max: -1 });
            new Smove({ xf: 1, a:1, v_max: 0 });
        }).to.throw();
    });
});