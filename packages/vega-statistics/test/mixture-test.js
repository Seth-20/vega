const tape = require('tape');
const d3 = require('d3-array');
const stats = require('../');
const gaussian = stats.randomNormal();

// seeded RNG for deterministic tests
stats.setRandom(stats.randomLCG(123456789));

function closeTo(t, a, b, delta) {
  t.equal(Math.abs(a - b) < delta, true);
}

function check(t, u, s, values) {
  const sum = values.reduce(function (a, b) {
    return a + b;
  }, 0);
  const avg = sum / values.length;
  let dev = values.reduce(function (a, b) {
    return a + (b - avg) * (b - avg);
  }, 0);
  dev = dev / (values.length - 1);

  // mean within 99.9% confidence interval
  closeTo(t, u, avg, (4 * dev) / Math.sqrt(values.length));
}

function samples(dist, n) {
  const a = Array(n);
  while (--n >= 0) a[n] = dist.sample();
  return a;
}

tape('mixture generates samples', function (t) {
  const dists = [stats.randomNormal(), stats.randomNormal()];
  let mix = stats.randomMixture(dists);
  check(t, 0, 1, samples(mix, 1000));

  mix = stats.randomMixture(dists, [2, 1]);
  check(t, 0, 1, samples(mix, 1000));

  mix = stats.randomMixture([stats.randomNormal(), stats.randomUniform()], [1, 0]);
  check(t, 0, 1, samples(mix, 1000));

  t.end();
});

tape('mixture evaluates the pdf', function (t) {
  const mix = stats.randomMixture([stats.randomNormal(), stats.randomNormal()]);
  const domain = d3.range(-5, 5.1, 0.5);
  const error = domain.reduce(function (sum, x) {
    return sum + Math.abs(mix.pdf(x) - gaussian.pdf(x));
  }, 0);

  t.ok(error / domain.length < 0.01);
  t.end();
});

tape('mixture approximates the cdf', function (t) {
  const mix = stats.randomMixture([stats.randomNormal(), stats.randomNormal()]);
  const domain = d3.range(-5, 5.1, 0.5);
  const error = domain.reduce(function (sum, x) {
    return sum + Math.abs(mix.cdf(x) - gaussian.cdf(x));
  }, 0);

  t.ok(error / domain.length < 0.01);
  t.end();
});

tape('mixture does not support the inverse cdf', function (t) {
  const mix = stats.randomMixture([stats.randomNormal(), stats.randomUniform(-1, 1)]);
  t.throws(function () {
    mix.icdf(0.5);
  });
  t.end();
});
