import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import path from 'path'

describe('registry installability', () => {
  let registryJsonPath: string

  beforeAll(() => {
    // Build the registry
    execSync('pnpm registry:build', { cwd: process.cwd(), stdio: 'pipe' })
    registryJsonPath = path.resolve('public/r/prompt-area.json')
  })

  it('builds a valid registry JSON file', () => {
    expect(existsSync(registryJsonPath)).toBe(true)
    const json = JSON.parse(readFileSync(registryJsonPath, 'utf-8'))
    expect(json.name).toBe('prompt-area')
    expect(json.type).toBe('registry:component')
    expect(json.files).toHaveLength(7)
    // Main component file contains PromptArea
    const mainFile = json.files.find((f: { path: string }) => f.path.endsWith('prompt-area.tsx'))
    expect(mainFile).toBeDefined()
    expect(mainFile.content).toContain('PromptArea')
  })

  it('registry JSON contains valid component source', () => {
    const json = JSON.parse(readFileSync(registryJsonPath, 'utf-8'))
    const mainFile = json.files.find((f: { path: string }) => f.path.endsWith('prompt-area.tsx'))
    const source = mainFile.content

    // Has named export via forwardRef
    expect(source).toContain('export const PromptArea')
    // Has forwardRef
    expect(source).toContain('forwardRef')
    // Has displayName
    expect(source).toContain('PromptArea.displayName')
    // Uses cn utility
    expect(source).toContain('@/lib/utils')
  })

  it('registry JSON conforms to shadcn schema', () => {
    const json = JSON.parse(readFileSync(registryJsonPath, 'utf-8'))
    expect(json.$schema).toBe('https://ui.shadcn.com/schema/registry-item.json')
    expect(json).toHaveProperty('name')
    expect(json).toHaveProperty('type')
    expect(json).toHaveProperty('files')
    expect(json.files[0]).toHaveProperty('path')
    expect(json.files[0]).toHaveProperty('content')
    expect(json.files[0]).toHaveProperty('type')
  })
})
