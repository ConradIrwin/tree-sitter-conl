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
  externals: ($) => [$._newline, $._endfile, $._indent, $._outdent],

  rules: {
    source_file: ($) =>
      seq(optional($._newline), optional($._section), $._endfile),

    _section: ($) => choice($.map, $.list),
    map: ($) =>
      seq(
        choice($.pair, $.comment),
        repeat(seq($._newline, choice($.pair, $.comment))),
      ),
    list: ($) =>
      seq(
        repeat($.comment),
        $._item,
        repeat(seq($._newline, choice($._item, $.comment))),
      ),

    _space: ($) => /[ \t]+/,
    comment: ($) => /#[^\r\n]*/,
    _equals: ($) => seq(/[ \t]+/, "="),
    escape_sequence: ($) => /"(["#=_>\\\/]|\{[0-9a-fA-F]{1,6}\})/,
    empty: ($) => '"{}',

    key: ($) =>
      choice(
        $.empty,
        seq(
          choice($.escape_sequence, /[^ \t\r\n#="]/),
          repeat(
            choice(/[^ \t\r\n"]/, $.escape_sequence, /[ \t]+[^ \t\r\n#=]/),
          ),
        ),
      ),

    value: ($) =>
      choice(
        $.empty,
        seq(
          choice($.escape_sequence, /[^ \t\r\n#"]/),
          repeat(choice(/[^ \t\r\n"]/, $.escape_sequence, /[ \t]+[^ \t\r\n#]/)),
        ),
      ),

    multiline_value: ($) =>
      seq(
        '"""',
        optional($._space),
        optional($.multiline_indicator),
        optional($._space),
        optional($.comment),
        $._indent,
        $._multiline_fragment,
        $._outdent,
      ),

    multiline_indicator: ($) => /[^ \t\r\n"#=_>\\\/][^ \t\r\n"]*/,

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
          seq($.value, optional(seq($._space, optional($.comment)))),
          seq($.multiline_value),
          seq(optional($.comment), $._indent, $._section, $._outdent),
        ),
      ),

    pair: ($) =>
      seq(
        $.key,
        choice(
          seq(optional($._space), $._item),
          seq(
            optional(seq($._space, optional($.comment))),
            $._indent,
            $._section,
            $._outdent,
          ),
        ),
      ),
  },
});
