import { assertEquals } from "https://deno.land/std@0.136.0/testing/asserts.ts";
import { _internals } from "./path.ts";

// test: getWordFilter
[
  {
    escapeChars: "",
    patterns: [
      { input: "abc", expected: "abc" },
      { input: "a b c", expected: "a b c" },
      { input: "a\\b c", expected: "a\\b c" },
    ],
  },
  {
    escapeChars: " ",
    patterns: [
      { input: "abc", expected: "abc" },
      { input: "a b c", expected: "a\\ b\\ c" },
      { input: "a\\b c", expected: "a\\b\\ c" },
    ],
  },
  {
    escapeChars: " \\",
    patterns: [
      { input: "abc", expected: "abc" },
      { input: "a b c", expected: "a\\ b\\ c" },
      { input: "a\\b c", expected: "a\\\\b\\ c" },
    ],
  },
  {
    escapeChars: "[a-z]",
    patterns: [
      { input: "abc", expected: "\\abc" },
      { input: "a b c", expected: "\\a b c" },
      { input: "a-b-c", expected: "\\a\\-b\\-c" },
    ],
  },
  {
    escapeChars: ` !"#$%&'()*+,-./<=>?@[\\]_\`{|}~`,
    patterns: [
      { input: "abc", expected: "abc" },
      { input: "a b c", expected: "a\\ b\\ c" },
      { input: "a][b}{c", expected: "a\\]\\[b\\}\\{c" },
    ],
  },
].forEach(({ escapeChars, patterns }) => {
  for (const { input, expected } of patterns) {
    Deno.test({
      name: `getWordFilter() escapeChars=${escapeChars} input=${input}`,
      fn() {
        const wordFilter = _internals.getWordFilter(escapeChars);
        const actual = wordFilter(input);
        assertEquals(actual, expected);
      },
    });
  }
});

// test: isValidUnixPath
[
  {
    path: "foo/bar baz",
    escapeChars: "",
    expected: true,
  },
  {
    path: "foo/bar baz",
    escapeChars: " ",
    expected: false,
  },
  {
    path: "foo/bar\\ baz",
    escapeChars: " ",
    expected: true,
  },
  {
    path: "foo\\bar\\baz",
    escapeChars: "",
    expected: true,
  },
  {
    path: "foo\\bar\\baz",
    escapeChars: " ",
    expected: true,
  },
  {
    path: "foo\\bar\\baz",
    escapeChars: "\\",
    expected: false,
  },
  {
    path: "foo\\\\bar\\\\baz",
    escapeChars: "\\",
    expected: true,
  },
  {
    path: "f%oo/b ar/ba#z",
    escapeChars: " %#",
    expected: false,
  },
  {
    path: "f\\%oo/b\\ ar/ba\\#z",
    escapeChars: " %#",
    expected: true,
  },
  {
    path: "f%oo\\b ar\\ba#z",
    escapeChars: " %#",
    expected: false,
  },
  {
    path: "f\\%oo\\b\\ ar\\ba\\#z",
    escapeChars: " %#",
    expected: true,
  },
  {
    path: "C:/foo/bar/baz",
    escapeChars: " %#",
    expected: true,
  },
  {
    path: "C:foo/bar/baz",
    escapeChars: " %#",
    expected: true,
  },
  {
    path: "foo/C:/bar/baz",
    escapeChars: " %#",
    expected: true,
  },
  {
    path: "foo*bar",
    escapeChars: " %#",
    expected: true,
  },
  {
    path: "foo?bar",
    escapeChars: " %#",
    expected: true,
  },
  {
    path: 'foo"bar',
    escapeChars: " %#",
    expected: true,
  },
  {
    path: "foo<bar",
    escapeChars: " %#",
    expected: true,
  },
  {
    path: "foo>bar",
    escapeChars: " %#",
    expected: true,
  },
  {
    path: "foo|bar",
    escapeChars: " %#",
    expected: true,
  },
].forEach(({ path, escapeChars, expected }) => {
  Deno.test({
    name: `isValidUnixPath() path=${path} escapeChars=${escapeChars}`,
    fn() {
      const actual = _internals.isValidUnixPath(path, escapeChars);
      assertEquals(actual, expected);
    },
  });
});

// test: isValidWindowsPath
[
  {
    path: "foo/bar baz",
    escapeChars: "",
    expected: true,
  },
  {
    path: "foo/bar baz",
    escapeChars: " ",
    expected: false,
  },
  {
    path: "foo/bar\\ baz",
    escapeChars: " ",
    expected: true,
  },
  {
    path: "foo\\bar\\baz",
    escapeChars: "",
    expected: true,
  },
  {
    path: "foo\\bar\\baz",
    escapeChars: " ",
    expected: true,
  },
  {
    path: "foo\\bar\\baz",
    escapeChars: "\\",
    expected: false,
  },
  {
    path: "foo\\\\bar\\\\baz",
    escapeChars: "\\",
    expected: true,
  },
  {
    path: "f%oo/b ar/ba#z",
    escapeChars: " %#",
    expected: false,
  },
  {
    path: "f\\%oo/b\\ ar/ba\\#z",
    escapeChars: " %#",
    expected: true,
  },
  {
    path: "f%oo\\b ar\\ba#z",
    escapeChars: " %#",
    expected: false,
  },
  {
    path: "f\\%oo\\b\\ ar\\ba\\#z",
    escapeChars: " %#",
    expected: true,
  },
  {
    path: "C:\\foo\\bar\\baz",
    escapeChars: " %#",
    expected: true,
  },
  {
    path: "C:foo\\bar\\baz",
    escapeChars: " %#",
    expected: true,
  },
  {
    path: "foo\\C:\\bar\\baz",
    escapeChars: " %#",
    expected: false,
  },
  {
    path: "foo*bar",
    escapeChars: " %#",
    expected: false,
  },
  {
    path: "foo?bar",
    escapeChars: " %#",
    expected: false,
  },
  {
    path: 'foo"bar',
    escapeChars: " %#",
    expected: false,
  },
  {
    path: "foo<bar",
    escapeChars: " %#",
    expected: false,
  },
  {
    path: "foo>bar",
    escapeChars: " %#",
    expected: false,
  },
  {
    path: "foo|bar",
    escapeChars: " %#",
    expected: false,
  },
].forEach(({ path, escapeChars, expected }) => {
  Deno.test({
    name: `isValidWindowsPath() path=${path} escapeChars=${escapeChars}`,
    fn() {
      const actual = _internals.isValidWindowsPath(path, escapeChars);
      assertEquals(actual, expected);
    },
  });
});
