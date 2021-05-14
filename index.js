// Unpack Math
const { PI, sqrt, abs, asin, cos, sin } = Math

/**
 * Class for producing smooth sinusoidal movements between two points.
 *
 * @param {Object} o - input parameters.
 * @param {number} o.xf - end position (m).
 * @param {number} o.a - maximum acceleration (m/s^2).
 * @param {number} o.x0 - starting position (m).
 * @param {number} o.v0 - starting velocity (m/s).
 * @param {number} o.x_min - lower position limit (m).
 * @param {number} o.x_max - upper position limit (m).
 * @param {number} o.v_max - velocity limit (m/s).
 */
class Smove {
    constructor({
        xf, a, x0=0, v0=0, x_min=null, x_max=null, v_max=null
    }) {
        let s = [ Smove.calculate(x0, xf, v0, a) ];

        if(x_min !== null && x_max !== null)
            s = Smove.clampPosition(s, x_min, x_max);

        if(v_max !== null)
            s = Smove.clampVelocity(s, v_max);

        this.sequence = s;
    }

    get dt() {
        let dt = 0;
        for(let i = 0; i < this.sequence.length; ++i)
            dt += this.sequence[i].delay + this.sequence[i].dt;

        return dt;
    }

    /**
     * Sample the sequence at the rate of 'period' and return an array of
     * velocity values.
     *
     * @param {number} period - sampling period (s).
     * @returns Array<number> sampled velocity data.
     */
    sample(period) {
        let data = []
        let t = 0;

        while(t < this.dt) {
            data.push(this._process(t));
            t += period;
        }

        return data;
    }

    /**
     * Returns the velocity at time 't'.
     *
     * @param {number} t - point of time referenced from the start of the smove.
     * @returns {number} velocity.
     */
    _process(t) {
        const [s0, s1] = this.sequence;

        // Phase 1
        if(t < s0.dt) {
            const { A, f, phi } = s0;
            return -A * f * sin((f * t) + phi);
        }

        if(s1 === undefined)
            return 0.0;

        // Phase 2
        if(t < (s0.dt + s1.delay)) {
            const { A, f, phi, dt} = s0;
            return -A * f * sin((f * dt) + phi);
        }

        // Phase 3
        if(t < (s0.dt + s1.delay + s1.dt)) {
            const { A, f, phi, dt, delay} = s1;
            return -A * f * sin((f * (t - (dt + delay))) + phi);
        }

        return 0.0;
    }

    /**
     * Calculate a sinusoidal movement between two points.
     *
     * @param {number} x0 - start position (m).
     * @param {number} xf - end position (m).
     * @param {number} v0 - start velocity (m/s)
     * @param {number} a - acceleration (m/s^2)
     */
    static calculate(x0, xf, v0, a) {
        // Delta X
        const dx = xf - x0;
        if(dx == 0)
            return null;

        // Amplitude
        let A = -a * dx**2 / (a * 2 * abs(dx) - v0**2);
        if(dx < 0)
            A *= -1;

        const f = sqrt(abs(a / A));         // Frequency
        const phi = asin(-v0 / (A * f));    // Phase angle
        const m = A * cos(phi);             // Offset
        const dt = (PI - phi) / f;          // Delta time
        const delay = 0;                    // How long to delay the smove

        // Final position
        xf = A * cos((f * dt) + phi) - m + x0;
        if(isNaN(xf))
            throw RangeError("Failed to calculate end-point");

        return { x0, xf, a, A, f, phi, m, dt, delay};
    }

    /**
     * Attempt to adjust the smove for position and velocity constraints.
     *
     * @param {Object} s - smove to adjust.
     * @param {number} x_min - position lower limit (m).
     * @param {number} x_max - position upper limit (m).
     * @returns {Array}
     */
    static clampPosition(s, x_min, x_max) {
        if(Array.isArray(s)) {
            let sequence = [];
            for(let i = 0; i < s.length; ++i) {
                const result = Smove.clampPosition(s[i], x_min, x_max);
                sequence = sequence.concat(result);
            }

            return sequence;
        }

        // Unpack initial values
        const { x0, xf, A, m } = s;

        // Calculate peak position
        const x_peak = A + m + x0;

        if(x_max !== null && x_peak > x_max && x_peak > x0) {
            // Peak exceeds maximum
            const s1 = Smove.calculate(x0, x_max);
            const s2 = Smove.calculate(s1.xf, xf);
            return [ s1, s2 ];
        }

        if(x_min !== null && x_peak < x_min && x_peak < x0) {
            // Peak exceeds minimum
            const s1 = Smove.calculate(x0, x_min);
            const s2 = Smove.calculate(s1.xf, xf);
            return [ s1, s2 ]
        }

        return [ s ]
    }

    /**
     * Splits a smove into two phases to keep peak velocity below v_max.
     * @param {Object} s - smove to adjust.
     * @param {number} v_max - maximum velocity.
     * @returns {Array}
     */
    static clampVelocity(s, v_max) {
        if(Array.isArray(s)) {
            let sequence = [];
            for(let i = 0; i < s.length; ++i) {
                const result = Smove.clampVelocity(s[i], v_max);
                sequence = sequence.concat(result);
            }

            return sequence;
        }

        const v_peak = abs(s.A * s.f);
        if(v_peak <= v_max)
            return [ s ];

        // Unpack initial values
        const { x0, xf, A, f, phi, m, dt } = s;

        // Deep copy
        const s1 = JSON.parse(JSON.stringify(s));

        // Change end-point to when v_peak occurs.
        s1.dt = (asin(v_max / abs(A * f)) - phi) / f
        s1.xf = A * cos((f * s1.dt) + phi) - m + x0;

        // Deep copy
        const s2 = JSON.parse(JSON.stringify(s1));

        // Calculate phase 2
        s2.x0 = s1.xf;
        s2.xf = A * cos((f * s2.dt) + phi) - m + s2.x0;
        s2.delay = ((xf - s2.xf) / (-A * f * sin(f * s2.dt + phi)));

        if(xf - x0 > 0)
            s2.phi = PI - asin(-v_max / (A * f));
        else
            s2.phi = PI - asin(v_max / (A * f));

        return [ s1, s2 ];
    }
}

module.exports=exports=Smove;
