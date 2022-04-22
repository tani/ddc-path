import { assertEquals } from "https://deno.land/std@0.136.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/x/test_suite@0.16.1/mod.ts";
import { _internals } from "./path.ts";

describe("getWordFilter()", () => {
  const parametrize = [
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
  ];

  for (const { escapeChars, patterns } of parametrize) {
    for (const { input, expected } of patterns) {
      it(`escapeChars=${escapeChars} input=${input}`, () => {
        const wordFilter = _internals.getWordFilter(escapeChars);
        const actual = wordFilter(input);
        assertEquals(actual, expected);
      });
    }
  }
});

describe("isValidUnixPath()", () => {
  const parametrize = [
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
  ];

  for (const { path, escapeChars, expected } of parametrize) {
    it(`path=${path} escapeChars=${escapeChars}`, () => {
      const actual = _internals.isValidUnixPath(path, escapeChars);
      assertEquals(actual, expected);
    });
  }
});

describe("isValidWindowsPath()", () => {
  const parametrize = [
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
  ];

  for (const { path, escapeChars, expected } of parametrize) {
    it(`path=${path} escapeChars=${escapeChars}`, () => {
      const actual = _internals.isValidWindowsPath(path, escapeChars);
      assertEquals(actual, expected);
    });
  }
});

describe("getCompletePosition()", () => {
  const parametrize = [
    {
      os: "windows",
      escapeChars: " ",
      patterns: [
        { input: "", expected: 0 },
        { input: "foo", expected: 0 },
        { input: "foo  ", expected: 5 },
        { input: "foo  bar", expected: 5 },
        { input: "foo  \\ bar", expected: 5 },
        { input: "foo  \\ bar\\", expected: 5 },
        { input: "foo  \\ bar\\ ", expected: 5 },
        { input: "   ", expected: 3 },
        { input: "   foo", expected: 3 },
        { input: "   foo  ", expected: 8 },
        { input: "   foo  bar", expected: 8 },
        { input: "   foo  \\ bar", expected: 8 },
        { input: "   foo  \\ bar\\", expected: 8 },
        { input: "   foo  \\ bar\\ ", expected: 8 },
        { input: "C:/foo/bar", expected: 0 },
        { input: "C:/foo/b ar", expected: 9 },
        { input: "C:/foo/ bar", expected: 8 },
        { input: "C:/foo// bar", expected: 9 },
        { input: "foo/C:/bar", expected: 4 },
        { input: "/foo/C:/bar", expected: 5 },
        { input: "  C:/foo/bar", expected: 2 },
        { input: "  C:/foo/b ar", expected: 11 },
        { input: "  C:/foo/ bar", expected: 10 },
        { input: "  C:/foo// bar", expected: 11 },
        { input: "  foo/C:/bar", expected: 6 },
        { input: "  /foo/C:/bar", expected: 7 },
        { input: "C:\\foo\\bar", expected: 0 },
        { input: "C:\\foo\\b ar", expected: 9 },
        { input: "C:\\foo\\ bar", expected: 0 },
        { input: "C:\\foo\\\\ bar", expected: 0 },
        { input: "foo\\C:\\bar", expected: 4 },
        { input: "\\foo\\C:\\bar", expected: 5 },
        { input: "  C:\\foo\\bar", expected: 2 },
        { input: "  C:\\foo\\b ar", expected: 11 },
        { input: "  C:\\foo\\ bar", expected: 2 },
        { input: "  C:\\foo\\\\ bar", expected: 2 },
        { input: "  foo\\C:\\bar", expected: 6 },
        { input: "  \\foo\\C:\\bar", expected: 7 },
      ],
    },
    {
      os: "windows",
      escapeChars: "",
      patterns: [
        { input: "", expected: 0 },
        { input: "foo", expected: 0 },
        { input: "foo  ", expected: 0 },
        { input: "foo  bar", expected: 0 },
        { input: "foo  \\ bar", expected: 0 },
        { input: "foo  \\ bar\\", expected: 0 },
        { input: "foo  \\ bar\\ ", expected: 0 },
        { input: "   ", expected: 3 },
        { input: "   foo", expected: 3 },
        { input: "   foo  ", expected: 3 },
        { input: "   foo  bar", expected: 3 },
        { input: "   foo  \\ bar", expected: 3 },
        { input: "   foo  \\ bar\\", expected: 3 },
        { input: "   foo  \\ bar\\ ", expected: 3 },
        { input: "C:/foo/bar", expected: 0 },
        { input: "C:/foo/b ar", expected: 0 },
        { input: "C:/foo/ bar", expected: 0 },
        { input: "C:/foo// bar", expected: 0 },
        { input: "foo/C:/bar", expected: 4 },
        { input: "/foo/C:/bar", expected: 5 },
        { input: "  C:/foo/bar", expected: 2 },
        { input: "  C:/foo/b ar", expected: 2 },
        { input: "  C:/foo/ bar", expected: 2 },
        { input: "  C:/foo// bar", expected: 2 },
        { input: "  foo/C:/bar", expected: 6 },
        { input: "  /foo/C:/bar", expected: 7 },
        { input: "C:\\foo\\bar", expected: 0 },
        { input: "C:\\foo\\b ar", expected: 0 },
        { input: "C:\\foo\\ bar", expected: 0 },
        { input: "C:\\foo\\\\ bar", expected: 0 },
        { input: "foo\\C:\\bar", expected: 4 },
        { input: "\\foo\\C:\\bar", expected: 5 },
        { input: "  C:\\foo\\bar", expected: 2 },
        { input: "  C:\\foo\\b ar", expected: 2 },
        { input: "  C:\\foo\\ bar", expected: 2 },
        { input: "  C:\\foo\\\\ bar", expected: 2 },
        { input: "  foo\\C:\\bar", expected: 6 },
        { input: "  \\foo\\C:\\bar", expected: 7 },
      ],
    },
    {
      os: "linux",
      escapeChars: " ",
      patterns: [
        { input: "", expected: 0 },
        { input: "foo", expected: 0 },
        { input: "foo  ", expected: 5 },
        { input: "foo  bar", expected: 5 },
        { input: "foo  \\ bar", expected: 5 },
        { input: "foo  \\ bar\\", expected: 5 },
        { input: "foo  \\ bar\\ ", expected: 5 },
        { input: "   ", expected: 3 },
        { input: "   foo", expected: 3 },
        { input: "   foo  ", expected: 8 },
        { input: "   foo  bar", expected: 8 },
        { input: "   foo  \\ bar", expected: 8 },
        { input: "   foo  \\ bar\\", expected: 8 },
        { input: "   foo  \\ bar\\ ", expected: 8 },
        { input: "C:/foo/bar", expected: 0 },
        { input: "C:/foo/b ar", expected: 9 },
        { input: "C:/foo/ bar", expected: 8 },
        { input: "C:/foo// bar", expected: 9 },
        { input: "foo/C:/bar", expected: 0 },
        { input: "/foo/C:/bar", expected: 0 },
        { input: "  C:/foo/bar", expected: 2 },
        { input: "  C:/foo/b ar", expected: 11 },
        { input: "  C:/foo/ bar", expected: 10 },
        { input: "  C:/foo// bar", expected: 11 },
        { input: "  foo/C:/bar", expected: 2 },
        { input: "  /foo/C:/bar", expected: 2 },
        { input: "C:\\foo\\bar", expected: 0 },
        { input: "C:\\foo\\b ar", expected: 9 },
        { input: "C:\\foo\\ bar", expected: 0 },
        { input: "C:\\foo\\\\ bar", expected: 0 },
        { input: "foo\\C:\\bar", expected: 0 },
        { input: "\\foo\\C:\\bar", expected: 0 },
        { input: "  C:\\foo\\bar", expected: 2 },
        { input: "  C:\\foo\\b ar", expected: 11 },
        { input: "  C:\\foo\\ bar", expected: 2 },
        { input: "  C:\\foo\\\\ bar", expected: 2 },
        { input: "  foo\\C:\\bar", expected: 2 },
        { input: "  \\foo\\C:\\bar", expected: 2 },
      ],
    },
    {
      os: "linux",
      escapeChars: "",
      patterns: [
        { input: "", expected: 0 },
        { input: "foo", expected: 0 },
        { input: "foo  ", expected: 0 },
        { input: "foo  bar", expected: 0 },
        { input: "foo  \\ bar", expected: 0 },
        { input: "foo  \\ bar\\", expected: 0 },
        { input: "foo  \\ bar\\ ", expected: 0 },
        { input: "   ", expected: 3 },
        { input: "   foo", expected: 3 },
        { input: "   foo  ", expected: 3 },
        { input: "   foo  bar", expected: 3 },
        { input: "   foo  \\ bar", expected: 3 },
        { input: "   foo  \\ bar\\", expected: 3 },
        { input: "   foo  \\ bar\\ ", expected: 3 },
        { input: "C:/foo/bar", expected: 0 },
        { input: "C:/foo/b ar", expected: 0 },
        { input: "C:/foo/ bar", expected: 0 },
        { input: "C:/foo// bar", expected: 0 },
        { input: "foo/C:/bar", expected: 0 },
        { input: "/foo/C:/bar", expected: 0 },
        { input: "  C:/foo/bar", expected: 2 },
        { input: "  C:/foo/b ar", expected: 2 },
        { input: "  C:/foo/ bar", expected: 2 },
        { input: "  C:/foo// bar", expected: 2 },
        { input: "  foo/C:/bar", expected: 2 },
        { input: "  /foo/C:/bar", expected: 2 },
        { input: "C:\\foo\\bar", expected: 0 },
        { input: "C:\\foo\\b ar", expected: 0 },
        { input: "C:\\foo\\ bar", expected: 0 },
        { input: "C:\\foo\\\\ bar", expected: 0 },
        { input: "foo\\C:\\bar", expected: 0 },
        { input: "\\foo\\C:\\bar", expected: 0 },
        { input: "  C:\\foo\\bar", expected: 2 },
        { input: "  C:\\foo\\b ar", expected: 2 },
        { input: "  C:\\foo\\ bar", expected: 2 },
        { input: "  C:\\foo\\\\ bar", expected: 2 },
        { input: "  foo\\C:\\bar", expected: 2 },
        { input: "  \\foo\\C:\\bar", expected: 2 },
      ],
    },
  ];

  for (const { os, escapeChars, patterns } of parametrize) {
    for (const { input, expected } of patterns) {
      it(`os=${os} escapeChars=${escapeChars} input=${input}`, () => {
        const isValidPath = os === "windows"
          ? _internals.isValidWindowsPath
          : _internals.isValidUnixPath;
        const isPath = (path: string) => isValidPath(path, escapeChars);
        const actual = _internals.getCompletePosition(input, isPath);
        assertEquals(actual, expected);
      });
    }
  }
});
