/*
 * Copyright (c) 2021 TANIGUCHI Masaya. All rights reserved.
 * This work is licensed under the MIT license. git.io/mit-license
 */
import {
  BaseSource,
  Candidate,
} from "https://lib.deno.dev/x/ddc_vim@v0/types.ts";
import {
  GatherCandidatesArguments,
  GetCompletePositionArguments,
} from "https://lib.deno.dev/x/ddc_vim@v0/base/source.ts";
import * as fn from "https://deno.land/x/denops_std@v2.1.1/function/mod.ts";

type UserData = Record<string, never>;
type Params = {
  cmd: string[];
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
  override async gatherCandidates(
    args: GatherCandidatesArguments<Params>,
  ): Promise<Candidate<UserData>[]> {
    const decoder = new TextDecoder();
    const cwd = await fn.getcwd(args.denops) as string;
    const proc = Deno.run({
      cwd,
      cmd: args.sourceParams.cmd,
      stdout: "piped",
      stderr: "null",
    });
    const output = await proc.output();
    const text = decoder.decode(output);
    return text.split("\n").map((item) => ({
      word: `${cwd.trim()}/${item.trim().replace(/^\.\//, '')}`.replaceAll(" ", "\\ "),
      abbr: `${cwd.trim()}/${item.trim().replace(/^\.\//, '')}`,
      mark: "path",
    }));
  }
  params(): Params {
    return {
      // cmd: ["fd", "--max-depth", "3"]
      cmd: ["find", "-maxdepth", "3"],
    };
  }
}
