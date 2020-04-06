const tape = require('tape');
const field = require('vega-util').field;
const range = require('d3-array').range;
const vega = require('vega-dataflow');
const tx = require('../');
const Sequence = tx.sequence;

tape('Sequence generates sequences', function (t) {
  const df = new vega.Dataflow();
  const start = df.add(0);
  const stop = df.add(11);
  const step = df.add(null);
  const as = df.add(null);
  const s = df.add(Sequence, {start: start, stop: stop, step: step, as: as});

  // -- initial run
  df.run();
  t.equal(s.value.length, 11);
  t.deepEqual(s.value.map(field('data')), range(0, 11));
  t.deepEqual(s.pulse.add.map(field('data')), range(0, 11));
  t.deepEqual(s.pulse.rem, []);

  // -- set step size
  df.update(step, 2).run();
  t.equal(s.value.length, 6);
  t.deepEqual(s.value.map(field('data')), range(0, 11, 2));
  t.deepEqual(s.pulse.add.map(field('data')), range(0, 11, 2));
  t.deepEqual(s.pulse.rem.map(field('data')), range(0, 11));

  // -- set output field name
  df.update(as, 'foo').run();
  t.equal(s.value.length, 6);
  t.deepEqual(s.value.map(field('foo')), range(0, 11, 2));
  t.deepEqual(s.pulse.add.map(field('foo')), range(0, 11, 2));
  t.deepEqual(s.pulse.rem.map(field('data')), range(0, 11, 2));

  t.end();
});
