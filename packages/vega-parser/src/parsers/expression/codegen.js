import {codegen, constants, functions} from 'vega-expression';
import {
  isArray, isBoolean, isDate, isNumber, isObject, isRegExp, isString,
  toBoolean, toDate, toNumber, toString,
  pad, stringValue, truncate
} from 'vega-util';
import {rgb, lab, hcl, hsl} from 'd3-color';
import {range as sequence} from 'd3-array';

import {
  format, utcFormat, timeFormat, utcParse, timeParse,
  monthFormat, monthAbbrevFormat,
  dayFormat, dayAbbrevFormat
} from './format';
import {quarter, utcquarter} from './quarter';
import {warn, info, debug} from './log';
import inScope from './inscope';
import clampRange from './clamp-range';
import {pinchDistance, pinchAngle} from './pinch';
import {screen, windowsize} from './window';
import span from './span';
import {range, domain, bandwidth, bandspace, copy, scale, invert, scaleVisitor} from './scale';
import scaleGradient from './scale-gradient';
import {geoArea, geoBounds, geoCentroid} from './geo';
import {data, indata, dataVisitor, indataVisitor} from './data';
import {treePath, treeAncestors} from './tree';
import inrange from './inrange';
import encode from './encode';
import modify from './modify';
import {vlPoint, vlInterval, vlPointDomain, vlIntervalDomain} from './selection';

// Expression function context object
export var functionContext = {
  isArray: isArray,
  isBoolean: isBoolean,
  isDate: isDate,
  isNumber: isNumber,
  isObject: isObject,
  isRegExp: isRegExp,
  isString: isString,
  toBoolean: toBoolean,
  toDate: toDate,
  toNumber: toNumber,
  toString: toString,
  pad: pad,
  truncate: truncate,
  rgb: rgb,
  lab: lab,
  hcl: hcl,
  hsl: hsl,
  sequence: sequence,
  format: format,
  utcFormat: utcFormat,
  utcParse: utcParse,
  timeFormat: timeFormat,
  timeParse: timeParse,
  monthFormat: monthFormat,
  monthAbbrevFormat: monthAbbrevFormat,
  dayFormat: dayFormat,
  dayAbbrevFormat: dayAbbrevFormat,
  quarter: quarter,
  utcquarter: utcquarter,
  warn: warn,
  info: info,
  debug: debug,
  inScope: inScope,
  clampRange: clampRange,
  pinchDistance: pinchDistance,
  pinchAngle: pinchAngle,
  screen: screen,
  windowsize: windowsize,
  span: span,
  bandspace: bandspace,
  inrange: inrange,
  encode: encode,
  modify: modify
};

var eventFunctions = ['view', 'item', 'group', 'xy', 'x', 'y'], // event functions
    eventPrefix = 'event.vega.', // event function prefix
    thisPrefix = 'this.', // function context prefix
    astVisitors = {}; // AST visitors for dependency analysis

export function expressionFunction(name, fn, visitor) {
  if (arguments.length === 1) {
    return functionContext[name];
  }

  // register with the functionContext
  functionContext[name] = fn;

  // if there is an astVisitor register that, too
  if (visitor) astVisitors[name] = visitor;

  // if the code generator has already been initialized,
  // we need to also register the function with it
  if (codeGenerator) codeGenerator.functions[name] = thisPrefix + name;
  return this;
}

// register expression functions with ast visitors
expressionFunction('bandwidth', bandwidth, scaleVisitor);
expressionFunction('copy', copy, scaleVisitor);
expressionFunction('domain', domain, scaleVisitor);
expressionFunction('range', range, scaleVisitor);
expressionFunction('invert', invert, scaleVisitor);
expressionFunction('scale', scale, scaleVisitor);
expressionFunction('gradient', scaleGradient, scaleVisitor);
expressionFunction('geoArea', geoArea, scaleVisitor);
expressionFunction('geoBounds', geoBounds, scaleVisitor);
expressionFunction('geoCentroid', geoCentroid, scaleVisitor);
expressionFunction('indata', indata, indataVisitor);
expressionFunction('data', data, dataVisitor);
expressionFunction('vlPoint', vlPoint, dataVisitor);
expressionFunction('vlInterval', vlInterval, dataVisitor);
expressionFunction('vlPointDomain', vlPointDomain, dataVisitor);
expressionFunction('vlIntervalDomain', vlIntervalDomain, dataVisitor);
expressionFunction('treePath', treePath, dataVisitor);
expressionFunction('treeAncestors', treeAncestors, dataVisitor);

// Build expression function registry
function buildFunctions(codegen) {
  var fn = functions(codegen);
  eventFunctions.forEach(function(name) { fn[name] = eventPrefix + name; });
  for (var name in functionContext) { fn[name] = thisPrefix + name; }
  return fn;
}

// Export code generator and parameters
export var codegenParams = {
  blacklist:  ['_'],
  whitelist:  ['datum', 'event', 'item'],
  fieldvar:   'datum',
  globalvar:  function(id) { return '_[' + stringValue('$' + id) + ']'; },
  functions:  buildFunctions,
  constants:  constants,
  visitors:   astVisitors
};

export var codeGenerator = codegen(codegenParams);