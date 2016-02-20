function ciexyz2ciergb(ciexyz) {

    var ciergb = [];

    var m = [2.36440, -0.89580, -0.46770, -0.51483, 1.42523, 0.08817, 0.00520, -0.01440, 1.00921];

    ciergb[0] = ciexyz[0] * m[0] + ciexyz[1] * m[1] + ciexyz[2] * m[2];
    ciergb[1] = ciexyz[0] * m[3] + ciexyz[1] * m[4] + ciexyz[2] * m[5];
    ciergb[2] = ciexyz[0] * m[6] + ciexyz[1] * m[7] + ciexyz[2] * m[8];

    return ciergb;
}

function ciergb2ciexyz(ciergb) {

    var ciexyz = [];

    var m = [0.490, 0.310, 0.200, 0.177, 0.813, 0.011, 0.000, 0.010, 0.990];

    ciexyz[0] = ciergb[0] * m[0] + ciergb[1] * m[1] + ciergb[2] * m[2];
    ciexyz[1] = ciergb[0] * m[3] + ciergb[1] * m[4] + ciergb[2] * m[5];
    ciexyz[2] = ciergb[0] * m[6] + ciergb[1] * m[7] + ciergb[2] * m[8];

    return ciexyz;
}

function ciexyz2srgb(ciexyz) {

    var srgb = [];

    var m = [3.2404542, -1.5371385, -0.4985314, -0.9692660, 1.8760108, 0.0415560, 0.0556434, -0.2040259, 1.0572252];

    srgb[0] = ciexyz[0] * m[0] + ciexyz[1] * m[1] + ciexyz[2] * m[2];
    srgb[1] = ciexyz[0] * m[3] + ciexyz[1] * m[4] + ciexyz[2] * m[5];
    srgb[2] = ciexyz[0] * m[6] + ciexyz[1] * m[7] + ciexyz[2] * m[8];

    srgb[0] = gamma_srgb(srgb[0]);
    srgb[1] = gamma_srgb(srgb[1]);
    srgb[2] = gamma_srgb(srgb[2]);

    return srgb;
}

function srgb2ciexyz(srgb) {

    var ciexyz = [];

    var r = inverse_gamma_srgb(srgb[0]);
    var g = inverse_gamma_srgb(srgb[1]);
    var b = inverse_gamma_srgb(srgb[2]);

    var m = [0.4124564, 0.3575761, 0.1804375, 0.2126729, 0.7151522, 0.0721750, 0.0193339, 0.1191920, 0.9503041];

    ciexyz[0] = r * m[0] + g * m[1] + b * m[2];
    ciexyz[1] = r * m[3] + g * m[4] + b * m[5];
    ciexyz[2] = r * m[6] + g * m[7] + b * m[8];

    return ciexyz;
}

function gamma_srgb(value) {
    var f = 0.0;
    var v = (value > 0) ? value : -value;

    if (v > 0.0031308) {
        f = 1.055 * Math.pow(v, 1.0 / 2.4) - 0.055;
    }
    else {
        f = 12.92 * v;
    }

    return (value > 0) ? f : -f;
}

function inverse_gamma_srgb(value) {
    var f = 0.0;
    var v = (value > 0) ? value : -value;

    if (v > 0.04045) {
        f = Math.pow((v + 0.055) / 1.055, 2.4);
    }
    else {
        f = v / 12.92;
    }

    return (value > 0) ? f : -f;
}
