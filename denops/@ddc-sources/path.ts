/*
 * Copyright (c) 2021 TANIGUCHI Masaya. All rights reserved.
 * This work is licensed under the MIT license. git.io/mit-license
 */
import {
  BaseSource,
  DdcGatherItems,
} from "https://deno.land/x/ddc_vim@v2.2.0/types.ts";
import {
  GatherArguments,
  GetCompletePositionArguments,
} from "https://deno.land/x/ddc_vim@v2.2.0/base/source.ts";
import * as fn from "https://deno.land/x/denops_std@v3.3.0/function/mod.ts";
import * as op from "https://deno.land/x/denops_std@v3.3.0/option/mod.ts";
import type { Denops } from "https://deno.land/x/denops_std@v3.3.0/mod.ts";

type UserData = Record<string, never>;
type DirSeparator = "slash" | "backslash";
type Params = {
  cmd: string[];
  absolute: boolean;
  dirSeparator: DirSeparator | "";
  escapeChars: string;
};
type PathChecker = (path: string) => boolean;
type WordFilter = (word: string) => string;

function isValidUnixPath(path: string, escapeChars: string): boolean {
  for (let i = 0; i < path.length; ++i) {
    if (
      path[i] === "\\" && (i + 1) < path.length &&
      escapeChars.includes(path[i + 1])
    ) {
      ++i;
    } else if (escapeChars.includes(path[i])) {
      return false;
    }
  }
  return true;
}

function isValidWindowsPath(path: string, escapeChars: string): boolean {
  // allow both '/' and '\'
  const invalidChars = ':*?"<>|' + escapeChars;
  let i = 0;
  if (/^[a-zA-Z]:/.test(path)) {
    i = 2;
  }
  for (; i < path.length; ++i) {
    if (
      path[i] === "\\" && (i + 1) < path.length &&
      escapeChars.includes(path[i + 1])
    ) {
      ++i;
    } else if (invalidChars.includes(path[i])) {
      return false;
    }
  }
  return true;
}

function getCompletePosition(input: string, isPath: PathChecker): number {
  // skip leading whitespace
  const startIndex = input.search(/\S/);
  const trimedInput = startIndex < 0 ? "" : input.slice(startIndex);
  const index = Array.from(trimedInput).findIndex((_, i) =>
    isPath(trimedInput.slice(i))
  );
  return index < 0 ? input.length : (startIndex + index);
}

function getWordFilter(escapeChars: string): WordFilter {
  const regexpsrc = `[${escapeChars.replaceAll(/[-\\\]]/g, "\\$&")}]`
  const escapeRegex = new RegExp(regexpsrc, "g");
  return (word) => word.replaceAll(escapeRegex, "\\$&");
}

export class Source extends BaseSource<Params, UserData> {
  override getCompletePosition(
    { context, sourceParams }: GetCompletePositionArguments<Params>,
  ): Promise<number> {
    const isValidPath = Deno.build.os === "windows"
      ? isValidWindowsPath
      : isValidUnixPath;
    const { escapeChars } = sourceParams;
    const isPath = (path: string) => isValidPath(path, escapeChars);
    const index = getCompletePosition(context.input, isPath);
    return Promise.resolve(index);
  }

  override async gather(
    { denops, sourceParams }: GatherArguments<Params>,
  ): Promise<DdcGatherItems<UserData>> {
    const decoder = new TextDecoder();
    let cwd = await fn.getcwd(denops) as string;
    const proc = Deno.run({
      cwd,
      cmd: sourceParams.cmd,
      stdout: "piped",
      stderr: "null",
    });
    const output = await proc.output();
    let text = decoder.decode(output);

    // fix Windows directory separator to Unix
    if (Deno.build.os === "windows") {
      cwd = cwd.replaceAll("\\", "/");
      text = text.replaceAll("\\", "/");
    }

    let words = text.split("\n").map((word) => word.replace(/^\.\//, ""));

    // change relative path to absolute
    if (sourceParams.absolute) {
      words = words.map((word) => `${cwd}/${word}`);
    }

    // change directory separator to backslash
    if (await this.getDirSeparator(denops, sourceParams) === "backslash") {
      words = words.map((word) => word.replaceAll("/", "\\"));
    }

    const wordFilter = getWordFilter(sourceParams.escapeChars);
    return words.map((word) => ({
      word: wordFilter(word),
      abbr: word,
    }));
  }

  params(): Params {
    return {
      // cmd: ["fd", "--max-depth", "3"]
      cmd: ["find", "-maxdepth", "3"],
      absolute: true,
      dirSeparator: "",
      escapeChars: " ",
    };
  }

  private async getDirSeparator(
    denops: Denops,
    sourceParams: Params,
  ): Promise<DirSeparator> {
    const { dirSeparator } = sourceParams;
    if (dirSeparator === "slash" || dirSeparator === "backslash") {
      return dirSeparator;
    }
    if (!await fn.exists(denops, "+completeslash")) {
      return "slash";
    }
    const completeslash = await op.completeslash.get(denops);
    if (completeslash !== "") {
      return completeslash as DirSeparator;
    }
    return await op.shellslash.get(denops) ? "slash" : "backslash";
  }
}

export const _internals = {
  getCompletePosition,
  getWordFilter,
  isValidUnixPath,
  isValidWindowsPath,
};
