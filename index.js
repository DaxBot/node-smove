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
        xf, a, x0=0, v0=0, x_min=null, x_max=null, v_min=null, v_max=null
    }) {
        let s = [ Smove.calculate(x0, xf, v0, a) ];

        if(v_min !== null)
            s = Smove.limitMinVelocity(s, v_min);

        if(x_min !== null && x_max !== null)
            s = Smove.limitPosition(s, x_min, x_max);

        if(v_max !== null)
            s = Smove.limitMaxVelocity(s, v_max);

        this.sequence = s;
    }

    get time() {
        const s = this.sequence[this.sequence.length - 1];
        return s.t0 + s.dt;
    }

    /**
     * Sample the sequence every 'period' seconds and return an array of
     * velocity values.
     *
     * @param {number} period - sampling period (s).
     * @returns Array<number> sampled velocity data.
     */
    sample(period) {
        let data = []
        let t = 0;

        while(t <= this.time) {
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
        for(let i = 0; i < this.sequence.length; ++i) {
            const s = this.sequence[i];
            if((t - s.t0) > s.dt)
                continue;

            if(s.A === undefined)
                return s.v0; // Constant velocity

            const { A, f, phi } = s;
            return -A * f * sin((f * (t - s.t0)) + phi);
        }

        return 0;
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
        const t0 = 0;                       // Start time

        // Final position
        xf = A * cos((f * dt) + phi) - m + x0;
        if(isNaN(xf))
            throw RangeError("Failed to calculate end-point");

        return { x0, xf, v0, a, A, f, phi, m, t0, dt };
    }

    /**
     * Adjust a s move for minimum and maximum position constraints.
     *
     * @param {Object} s - smove to adjust.
     * @param {number} x_min - position lower limit (m).
     * @param {number} x_max - position upper limit (m).
     * @returns {Array}
     */
    static limitPosition(s, x_min, x_max) {
        if(Array.isArray(s)) {
            let sequence = [];
            for(let i = 0; i < s.length; ++i) {
                const result = Smove.limitPosition(s[i], x_min, x_max);
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
     * Adjust a smove for maximum velocity constraints.
     *
     * @param {Object} s - smove to adjust.
     * @param {number} v_max - maximum velocity.
     * @returns {Array}
     */
    static limitMaxVelocity(s, v_max) {
        if(Array.isArray(s)) {
            let sequence = [];
            for(let i = 0; i < s.length; ++i) {
                const result = Smove.limitMaxVelocity(s[i], v_max);
                sequence = sequence.concat(result);
            }

            return sequence;
        }

        if(s.A === undefined)
            return [ s ];

        // Unpack initial values
        const { x0, xf, A, f, phi, m } = s;

        const v_peak = abs(A * f);
        if(v_peak <= v_max)
            return [ s ];

        // Deep copy s1
        const s1 = JSON.parse(JSON.stringify(s));

        // Change end-point to when v_max occurs.
        s1.dt = (asin(v_max / abs(A * f)) - phi) / f

        const dx = A * cos((f * s1.dt) + phi) - m;
        s1.xf = dx + x0;

        // Deep copy s2
        const s2 = JSON.parse(JSON.stringify(s1));

        // Change end-point to when v=0 occurs.
        s2.x0 = s1.xf;
        s2.xf = dx + s2.x0;

        if((xf - x0) > 0)
            s2.phi = PI - asin(-v_max / (A * f));
        else
            s2.phi = PI - asin(v_max / (A * f));

        // Calculate delay
        const dt = (abs(xf - x0) - (2 * dx)) / v_max;

        const delay = {
            x0: s1.xf,
            xf: s1.xf + (v_max * dt),
            v0: v_max,
            t0: s1.t0 + s1.dt,
            dt: dt,
        }

        // Shift phase 2 to be after delay
        s2.x0 = delay.xf;
        s2.xf = delay.xf + dx;
        s2.t0 = delay.t0 + delay.dt;

        return [ s1, delay, s2 ];
    }

    /**
     * Adjust a smove for minimum velocity constraints.
     *
     * @param {Object} s - smove to adjust.
     * @param {number} v_min - minimum velocity.
     * @returns {Array}
     */
    static limitMinVelocity(s, v_min) {
        if(Array.isArray(s)) {
            let sequence = [];
            for(let i = 0; i < s.length; ++i) {
                const result = Smove.limitMinVelocity(s[i], v_min);
                sequence = sequence.concat(result);
            }

            return sequence;
        }

        // Unpack initial values
        const { x0, xf, a, A, f, phi, m, t0 } = s;

        // Check peak velocity
        const v_peak = abs(A * f);
        if(v_peak <= v_min) {
            return [{
                x0: x0,
                xf: xf,
                v0: v_min,
                t0: t0,
                dt: abs(x0 - xf) / v_min,
            }];
        }

        // Find the time when v_min occurs.
        const t_min = (asin(v_min / abs(A * f)) - phi) / f;
        if(Number.isNaN(t_min) || t_min <= s.t0 || t_min > s.dt)
            return [ s ]

        // Calculate the position change during t_min
        const dx = A * cos((f * t_min) + phi) - m + x0;

        // Re-calculate smove
        if((xf - x0) > 0)
            s = Smove.calculate(dx, xf-dx, v_min, a);
        else
            s = Smove.calculate(dx, xf-dx, -v_min, a);

        const dt = abs(dx / v_min);
        s.t0 = dt;
        s.dt -= t_min;

        // Calculate delays
        const delay1 = {
            x0: x0,
            xf: dx,
            v0: v_min,
            t0: 0,
            dt: dt,
        }

        const delay2 = {
            x0: s.xf,
            xf: s.xf + dx,
            v0: v_min,
            t0: s.t0 + s.dt,
            dt: dt,
        }

        // Shift the graph to begin after delay
        if((xf - x0) > 0)
            s.phi = asin(-v_min / (A * f));
        else
            s.phi = asin(v_min / (A * f));

        return [ delay1, s, delay2 ];
    }
}

module.exports=exports=Smove;
