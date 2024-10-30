package tree_sitter_conl_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_conl "github.com/conradirwin/tree-sitter-conl/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_conl.Language())
	if language == nil {
		t.Errorf("Error loading Conl grammar")
	}
}
