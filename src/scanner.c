#include "tree_sitter/parser.h"
#include "tree_sitter/array.h"

enum TokenType {
  NEWLINE,
  ENDFILE,
  INDENT,
  OUTDENT,
};

typedef struct {
    Array(int8_t) indents;
} Scanner;

void *tree_sitter_conl_external_scanner_create(void) {
    Scanner *scanner = calloc(1, sizeof(Scanner));
    return (void*) scanner;
}

void tree_sitter_conl_external_scanner_destroy(void *payload) {
    Scanner *scanner = (Scanner *)payload;
    array_delete(&scanner->indents);
    free(scanner);
}

unsigned tree_sitter_conl_external_scanner_serialize(
  void *payload,
  char *buffer
) {
    Scanner *scanner = (Scanner *)payload;

    size_t len = scanner->indents.size;
    if (len > TREE_SITTER_SERIALIZATION_BUFFER_SIZE) {
        len = TREE_SITTER_SERIALIZATION_BUFFER_SIZE;
    }

    memcpy(buffer, scanner->indents.contents, len);
    return len;
}

void tree_sitter_conl_external_scanner_deserialize(
  void *payload,
  char *buffer,
  unsigned length
) {
    Scanner *scanner = (Scanner *)payload;
    if (length == 0) {
        return;
    }
    scanner->indents.size = length;
    memcpy(scanner->indents.contents, buffer, length);
}

#define CHAR_MASK (0x7F)
#define STOP_MASK (0x80)

static bool is_same_char(uint8_t a, uint8_t b) {
    return (a & CHAR_MASK) == (b & CHAR_MASK);
}
static bool is_stop(uint8_t a) {
    return (a & STOP_MASK) == STOP_MASK;
}
static bool is_newline(int32_t c) {
    return c == '\n' || c == '\r';
}
static bool is_indent(int32_t c) {
    return c == ' ' || c == '\t';
}

bool tree_sitter_conl_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
    Scanner *scanner = (Scanner *)payload;

    Array(char) new_indent = array_new();

    if (!(is_newline(lexer->lookahead) || lexer->eof(lexer))) {
        return false;
    }

    while (is_newline(lexer->lookahead)) {
        lexer->mark_end(lexer);
        lexer->advance(lexer, true);
        array_clear(&new_indent);

        while (is_indent(lexer->lookahead)) {
            array_push(&new_indent, lexer->lookahead);
            lexer->advance(lexer, false);
        }
    }

    size_t last_stop = 0;

    bool is_true_prefix = true;
    size_t len = scanner->indents.size > new_indent.size ? new_indent.size : scanner->indents.size;
    for (size_t i = 0; i < len; i++) {
        is_true_prefix &= is_same_char(*array_get(&new_indent, i), *array_get(&scanner->indents, i));
    }

    if (!is_true_prefix || new_indent.size < scanner->indents.size) {
        array_pop(&scanner->indents);
        while (scanner->indents.size && !is_stop(*array_back(&scanner->indents))) {
            array_pop(&scanner->indents);
        }
        array_delete(&new_indent);
        lexer->result_symbol = OUTDENT;
        return true;
    }

    if (lexer->eof(lexer)) {
        lexer->result_symbol = ENDFILE;
    } else if (new_indent.size == scanner->indents.size) {
        lexer->result_symbol = NEWLINE;
    } else {
        lexer->result_symbol = INDENT;

        while (new_indent.size > scanner->indents.size) {
            array_push(&scanner->indents, *array_get(&new_indent, scanner->indents.size));
        }
        *array_back(&scanner->indents) |= STOP_MASK;
    }

    array_delete(&new_indent);
    lexer->mark_end(lexer);
    return true;
}
