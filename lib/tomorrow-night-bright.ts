import type { ThemeRegistration } from 'shiki'

export const tomorrowNightBright: ThemeRegistration = {
  name: 'tomorrow-night-bright',
  type: 'dark',
  colors: {
    'editor.background': '#000000',
    'editor.foreground': '#DEDEDE',
  },
  tokenColors: [
    {
      scope: 'comment',
      settings: { foreground: '#969896' },
    },
    {
      scope: ['keyword.operator.class', 'constant.other', 'source.php.embedded.line'],
      settings: { foreground: '#EEEEEE' },
    },
    {
      scope: [
        'variable',
        'support.other.variable',
        'string.other.link',
        'string.regexp',
        'entity.name.tag',
        'entity.other.attribute-name',
        'meta.tag',
        'declaration.tag',
        'markup.deleted.git_gutter',
      ],
      settings: { foreground: '#D54E53' },
    },
    {
      scope: [
        'constant.numeric',
        'constant.language',
        'support.constant',
        'constant.character',
        'variable.parameter',
        'punctuation.section.embedded',
        'keyword.other.unit',
      ],
      settings: { foreground: '#E78C45' },
    },
    {
      scope: ['entity.name.class', 'entity.name.type.class', 'support.type', 'support.class'],
      settings: { foreground: '#E7C547' },
    },
    {
      scope: [
        'string',
        'constant.other.symbol',
        'entity.other.inherited-class',
        'entity.name.filename',
        'markup.heading',
        'markup.inserted.git_gutter',
      ],
      settings: { foreground: '#B9CA4A' },
    },
    {
      scope: ['keyword.operator', 'constant.other.color'],
      settings: { foreground: '#70C0B1' },
    },
    {
      scope: [
        'entity.name.function',
        'meta.function-call',
        'support.function',
        'keyword.other.special-method',
        'meta.block-level',
        'markup.changed.git_gutter',
      ],
      settings: { foreground: '#7AA6DA' },
    },
    {
      scope: ['keyword', 'storage', 'storage.type', 'entity.name.tag.css'],
      settings: { foreground: '#C397D8' },
    },
    {
      scope: 'invalid',
      settings: { foreground: '#CED2CF', background: '#DF5F5F' },
    },
  ],
}
