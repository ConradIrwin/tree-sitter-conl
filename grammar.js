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
        repeat($.line_comment),
        optional($._newline),
        optional($._section),
        $._endfile,
      ),

    _section: ($) => choice($.map, $.list),
    map: ($) => seq($._pair, repeat(seq($._newline, $._pair))),
    list: ($) => seq($._item, repeat(seq($._newline, $._item))),

    _space: ($) => /[ \t]+/,
    comment: ($) => /;[^\r\n]*/,
    escape_sequence: ($) => /\\(\\|"|r|n|t|\{[0-9a-fA-F]{1,8}\})/,
    _quoted_literal: ($) =>
      seq('"', repeat(choice(/[^"\\\r\n]+/, $.escape_sequence)), '"'),
    _unquoted_value: ($) => /[^"; \t\r\n]([^; \t\r\n]|[ \t]+[^; \t\r\n])*/,
    _unquoted_key: ($) => /[^"=; \t\r\n]([^=; \t\r\n]|[ \t]+[^=; \t\r\n])*/,

    key: ($) => choice($._quoted_literal, $._unquoted_key),
    value: ($) => choice($._quoted_literal, $._unquoted_value),

    multiline_hint: ($) => $._unquoted_value,
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
            repeat($.line_comment),
          ),
          seq($.multiline_value, repeat($.line_comment)),
          seq(
            optional($.comment),
            repeat($.line_comment),
            optional(seq($._indent, $._section, $._outdent)),
          ),
        ),
      ),

    _pair: ($) =>
      seq(
        $.key,
        choice(
          seq(optional($._space), $._item),
          seq(
            optional($._space),
            optional($.comment),
            repeat($.line_comment),
            optional(seq($._indent, $._section, $._outdent)),
          ),
        ),
      ),
  },
});
