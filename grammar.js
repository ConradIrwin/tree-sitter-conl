/**
 * @file CONL is a post-minimalist, human-centric configuration language.
 * @author Conrad Irwin <conrad.irwin@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "conl",
  extras: ($) => [],
  externals: ($) => [
    $._newline,
    $._endfile,
    $._indent,
    $._outdent,
    $.line_comment,
  ],

  rules: {
    source_file: ($) =>
      seq(
        optional($._line_comments),
        optional($._newline),
        optional($._section),
        $._endfile,
      ),

    _section: ($) => choice($.map, $.list),
    map: ($) => seq($.pair, repeat(seq($._newline, $.pair))),
    list: ($) => seq($._item, repeat(seq($._newline, $._item))),

    _space: ($) => /[ \t]+/,
    comment: ($) => /;[^\r\n]*/,
    _equals: ($) => seq(/[ \t]+/, "="),
    escape_sequence: ($) => /\\(\\|"|r|n|t|\{[0-9a-fA-F]{1,8}\})/,
    _quoted_literal: ($) =>
      seq('"', repeat(choice(/[^"\\\r\n]+/, $.escape_sequence)), '"'),
    _unquoted_value: ($) => /[^"; \t\r\n]([^; \t\r\n]|[ \t]+[^; \t\r\n])*/,
    empty: ($) => '"{}',

    key: ($) =>
      choice(
        $._quoted_literal,
        /[^"=; \t\r\n]([^=; \t\r\n]|[ \t]+[^=; \t\r\n])*/,
      ),

    value: ($) => choice($._quoted_literal, $._unquoted_value),

    _line_comments: ($) => repeat1($.line_comment),

    multiline_value: ($) =>
      seq(
        '"""',
        optional($._space),
        optional($.multiline_hint),
        optional($._space),
        optional($.comment),
        $._indent,
        alias($._multiline_fragment, $.multiline_content),
        $._outdent,
      ),

    multiline_hint: ($) => /[^; \t\r\n]([^; \t\r\n]|[ \t]+[^; \t\r\n])*/,

    _multiline_fragment: ($) =>
      prec.right(
        seq(
          /[^\r\n]+/,
          repeat(
            choice(
              seq($._newline, $._multiline_fragment),
              seq($._indent, $._multiline_fragment, $._outdent),
            ),
          ),
        ),
      ),

    _item: ($) =>
      seq(
        "=",
        optional($._space),
        choice(
          seq(
            $.value,
            optional($._space),
            optional($.comment),
            optional($._line_comments),
          ),
          seq($.multiline_value, optional($._line_comments)),
          seq(
            optional($.comment),
            optional($._line_comments),
            optional(seq($._indent, $._section, $._outdent)),
          ),
        ),
      ),

    pair: ($) =>
      seq(
        $.key,
        choice(
          seq(optional($._space), $._item),
          seq(
            optional($._space),
            optional($.comment),
            optional($._line_comments),
            optional(seq($._indent, $._section, $._outdent)),
          ),
        ),
      ),
  },
});
