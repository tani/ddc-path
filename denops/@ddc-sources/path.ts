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
import type { Denops } from "https://deno.land/x/denops_std@v3.3.0/mod.ts";

type UserData = Record<string, never>;
type DirSeparator = "slash" | "backslash";
type Params = {
  cmd: string[];
  absolute: boolean;
  dirSeparator: DirSeparator | "";
  escapeChars: string;
};
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

function getWordFilter(escapeChars: string): WordFilter {
  const regexpsrc = `[${escapeChars.replaceAll(/[-\\\]]/g, "\\$&")}]`
  const escapeRegex = new RegExp(regexpsrc, "g");
  return (word) => word.replaceAll(escapeRegex, "\\$&");
}

export class Source extends BaseSource<Params, UserData> {
  override async getCompletePosition(
    { context, denops, sourceParams }: GetCompletePositionArguments<Params>,
  ): Promise<number> {
    const isValidPath = Deno.build.os === "windows"
      ? isValidWindowsPath
      : isValidUnixPath;
    for (let i = 0; i < context.input.length; i++) {
      if (isValidPath(context.input.slice(i), sourceParams.escapeChars)) {
        return i;
      }
    }
    return context.input.length;
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
    if (await this._getDirSeparator(denops, sourceParams) === "backslash") {
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

  private async _getDirSeparator(
    denops: Denops,
    sourceParams: Params,
  ): Promise<DirSeparator> {
    const { dirSeparator } = sourceParams;
    if (dirSeparator === "slash" || dirSeparator === "backslash") {
      return dirSeparator;
    }
    return await denops.eval(
      "!exists('+completeslash') ? 'slash' :" +
        "&completeslash !=# '' ? &completeslash :" +
        "&shellslash ? 'slash' : 'backslash'",
    ) as DirSeparator;
  }
}

export const _internals = {
  getWordFilter,
  isValidUnixPath,
  isValidWindowsPath,
};
