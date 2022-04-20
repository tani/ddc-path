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
};

function isValidUnixPath(path: string): boolean {
  let escape = false;
  for (let i = 0; i < path.length; i++) {
    if (!escape && path[i].match(/\s/)) {
      return false;
    }
    if (path[i] === "\\") {
      escape = !escape;
    } else {
      escape = false;
    }
  }
  return true;
}

export class Source extends BaseSource<Params, UserData> {
  override getCompletePosition(
    arg: GetCompletePositionArguments<Params>,
  ): Promise<number> {
    for (let i = 0; i < arg.context.input.length; i++) {
      if (isValidUnixPath(arg.context.input.slice(i))) {
        return Promise.resolve(i);
      }
    }
    return Promise.resolve(arg.context.input.length);
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

    return words.map((word) => ({
      word: word.replaceAll(" ", "\\ "),
      abbr: word,
    }));
  }

  params(): Params {
    return {
      // cmd: ["fd", "--max-depth", "3"]
      cmd: ["find", "-maxdepth", "3"],
      absolute: true,
      dirSeparator: "",
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
