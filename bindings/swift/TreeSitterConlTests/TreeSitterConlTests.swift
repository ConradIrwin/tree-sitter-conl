import XCTest
import SwiftTreeSitter
import TreeSitterConl

final class TreeSitterConlTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_conl())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Conl grammar")
    }
}
