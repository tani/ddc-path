# ddc-path

Path completion for ddc.vim.
This source collects path names with GNU find or sharkdp/fd.

sharkdp/fd is a simple, fast and user-friendly alternative to 'find' .

To install this source,

```vim
Plug 'tani/ddc-path',

call ddc#custom#patch_global('sources', ['path'])
call ddc#custom#patch_global('sourceOptions', {
      \   'path': {'mark': 'P'},
      \ })
call ddc#custom#patch_global('sourceParams', {
      \   'path': {
      \     'cmd': ['fd', '--max-depth', '5'],
      \   }
      \ })
      " or  'cmd': ['find', '-maxdepth', '5'],
```

Copyright (c) 2021 TANIGUCHI Masaya. All rights reserved.

This work is licensed under the MIT license.
git.io/mit-license
