import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import reactHooks from 'eslint-plugin-react-hooks'

const eslintConfig = [
  { ignores: ['next-env.d.ts'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/immutability': 'warn',
    },
  },
]

export default eslintConfig
