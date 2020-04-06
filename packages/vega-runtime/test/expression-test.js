const tape = require('tape');
const util = require('vega-util');
const vega = require('vega-dataflow');
const transforms = require('vega-transforms');
const runtime = require('../');

tape('Parser parses expressions', function (t) {
  const values = [
    {x: 1, y: 28},
    {x: 2, y: 43},
    {x: 3, y: 81},
    {x: 4, y: 19}
  ];

  const spec = {
    operators: [
      {id: 0, type: 'Operator', value: 50},
      {id: 1, type: 'Operator', update: '2 * _.foo', params: {foo: {$ref: 0}}},
      {id: 2, type: 'Collect', value: {$ingest: values}},
      {
        id: 3,
        type: 'Formula',
        params: {
          expr: {
            $expr: 'datum.x * datum.y',
            $fields: ['x', 'y']
          },
          as: 'z',
          pulse: {$ref: 2}
        }
      },
      {
        id: 4,
        type: 'Filter',
        params: {
          expr: {
            $expr: 'datum.z > _.bar',
            $fields: ['z'],
            $params: {bar: {$ref: 1}}
          },
          pulse: {$ref: 3}
        }
      },
      {id: 5, type: 'Collect', params: {pulse: {$ref: 4}}}
    ]
  };

  const df = new vega.Dataflow();
  const ctx = runtime.parse(spec, runtime.context(df, transforms));
  const ops = ctx.nodes;
  const ids = Object.keys(ops);
  const z = util.field('z');

  t.equal(ids.length, spec.operators.length);

  df.run();
  t.equal(
    ids.reduce(function (sum, id) {
      return sum + +(ops[id].stamp === df.stamp());
    }, 0),
    spec.operators.length
  );

  t.equal(typeof ops[1]._update, 'function');
  t.equal(ops[1].value, 100);

  t.deepEqual(ops[2].value.map(z), [28, 86, 243, 76]);
  t.deepEqual(ops[5].value.map(z), [243]);

  t.end();
});
