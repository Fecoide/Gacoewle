/**
 * @file fgfh grammar
 * @author hyy
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "fgfh",

  extras: $ => [
    /\s/,
    $.line_comment,
    $.quote_comment
  ],

  conflicts: $ => [
    [$.gac_stem, $.operator],
  ],

  word: $ => $.identifier,

  rules: {
    fgfh_file: $ => repeat($.statement),

    statement: $ => choice(
      seq($.function_block, ';'),
      $.dash_comment,
      ';'
    ),

    function_block: $ => choice(
      $.include,
      $.shape,
      $.hold,
      $.shift,
      $.flow,
      $.melt
    ),
    
    line_comment: $ => token(seq('//', /.*/)),

    dash_comment: $ => token(seq(
      '----',
      repeat(choice(
        /[^-]+/,
        /-(?!---)/  // 单个 - 但不是 ----
      )),
      '----'
    )),

    quote_comment: $ => token(seq(
      '"',
      repeat(choice(
        /[^"\\]/,
        /\\./
      )),
      '"'
    )),

    include: $ => seq(
      '#[',
      field('file', $.include_file),
      ']'
    ),

    include_file: $ => choice(
      $.string,
      $.quoted_string
    ),

    quoted_string: $ => seq(
      '"',
      field('content', /[^"]*/),
      '"'
    ),
    
    shape: $ => choice(
      $.shape_pure,
      $.shape_block
    ),

    shape_pure: $ => seq(
      field('left', $.expression),
      '::',
      field('right', $.expression)
    ),

    shape_block: $ => seq(
      field('left', $.expression),
      '::',
      '{',
      optional(field('body', $.block_body)),
      '}'
    ),

    hold: $ => choice(
      $.hold_pure,
      $.hold_block
    ),

    hold_pure: $ => seq(
      field('left', $.expression),
      '<-',
      field('right', $.expression)
    ),

    hold_block: $ => seq(
      field('left', $.expression),
      '<-',
      '{',
      optional(field('body', $.block_body)),
      '}'
    ),

    shift: $ => choice(
      $.shift_pure,
      $.shift_block
    ),

    shift_pure: $ => seq(
      field('left', $.expression),
      '->',
      field('right', $.expression)
    ),

    shift_block: $ => seq(
      field('left', $.expression),
      '->',
      '{',
      optional(field('body', $.block_body)),
      '}'
    ),

    flow: $ => choice(
      $.flow_pure,
      $.flow_block
    ),

    flow_pure: $ => seq(
      field('left', $.expression),
      '>>',
      field('right', $.expression)
    ),

    flow_block: $ => seq(
      field('left', $.expression),
      '>>',
      '{',
      optional(field('body', $.block_body)),
      '}'
    ),

    melt: $ => choice(
      $.melt_pure,
      $.melt_block
    ),

    melt_pure: $ => seq(
      field('left', $.expression),
      '@>',
      field('right', $.expression)
    ),

    melt_block: $ => seq(
      field('left', $.expression),
      '@>',
      '{',
      optional(field('body', $.block_body)),
      '}'
    ),
    
    expression: $ => choice(
      $.datatype,
      $.fycoide,
      $.pointer_ref
    ),

    block_body: $ => choice(
      commaSep1($.block_element),
      trailingCommaSep1($.block_element)
    ),

    block_element: $ => choice(
      $.expression,
      $.function_block
    ),
    
    datatype: $ => choice(
      $.type_desc,
      $.type_word
    ),

    type_desc: $ => seq(
      '\'',
      field('description', $.string),
      '\''
    ),

    type_word: $ => choice(
      $.proto_gac_word,
      $.std_gac_word
    ),

    proto_gac_word: $ => seq(
      '*[',
      field('content', $.gac_string),
      ']',
      optional(field('pointer', $.pointer))
    ),

    std_gac_word: $ => seq(
      '[',
      field('content', $.gac_string),
      ']',
      optional(field('pointer', $.pointer))
    ),
    
    gac_string: $ => repeat1($.gac_stem),

    gac_stem: $ => choice(
      $.fycoide,
      $.pointer_ref,
      $.operator,
      $.identifier,
      $.gac_prefix,
      $.gac_suffix,
      $.gac_synonym,
      $.gac_nested
    ),

    gac_prefix: $ => choice(
      seq(field('prefix', $.identifier), '='),
      seq(field('prefix', $.identifier), '<|')
    ),

    gac_suffix: $ => choice(
      seq('-', field('suffix', $.identifier)),
      seq('+', field('suffix', $.identifier))
    ),

    gac_synonym: $ => seq(
      '|>',
      field('synonym', $.identifier)
    ),

    gac_nested: $ => seq(
      '[',
      field('content', $.gac_string),
      ']'
    ),
    
    fycoide: $ => seq(
      '#(',
      field('name', $.string),
      ')'
    ),

    pointer_ref: $ => seq(
      '@',
      field('id', $.pointer_id)
    ),

    pointer: $ => seq(
      '@',
      field('id', $.pointer_id)
    ),

    pointer_id: $ => choice(
      $.number,
      $.pointer_expression
    ),

    pointer_expression: $ => seq(
      '[',
      field('expression', repeat1(choice(
        $.number,
        $.operator,
        $.arithmetic_op
      ))),
      ']'
    ),
    
    operator: $ => choice(
      '|',   // or
      '&',   // and
      '?',   // optional
      '!',   // not
      '_',   // placeholder
      '=',   // equals (context dependent)
      ','    // separator
    ),

    arithmetic_op: $ => choice(
      '+',
      '-',
      '*',
      '/',
      '%'
    ),
    
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_\-]*/,
    
    string: $ => choice(
      $.identifier,
      $.unicode_string
    ),

    unicode_string: $ => /[a-zA-Z0-9_\-\.\u4e00-\u9fa5]+/,

    number: $ => choice(
      $.integer,
      $.float
    ),

    integer: $ => /[0-9]+/,

    float: $ => /[0-9]+\.[0-9]+/,
  }
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function trailingCommaSep1(rule) {
  return seq(
    rule,
    repeat(seq(',', rule)),
    optional(',')
  );
}

function trailingCommaSep(rule) {
  return optional(trailingCommaSep1(rule));
}
