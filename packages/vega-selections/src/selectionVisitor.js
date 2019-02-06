import {Intersect} from './constants';
import {Literal} from 'vega-expression';
import {error, peek} from 'vega-util';

const DataPrefix = ':',
      IndexPrefix = '@';

export function selectionVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) error('First argument to selection functions must be a string literal.');

  const data = args[0].value,
        op = args.length >= 2 && peek(args).value,
        field = 'unit',
        indexName = IndexPrefix + field,
        dataName = DataPrefix + data;

  if (op === Intersect && !params.hasOwnProperty(indexName)) {
    params[indexName] = scope.getData(data).indataRef(scope, field);
  }

  if (!params.hasOwnProperty(dataName)) {
    params[dataName] = scope.getData(data).tuplesRef();
  }
}