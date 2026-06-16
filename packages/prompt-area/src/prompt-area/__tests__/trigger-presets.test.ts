import { describe, it, expect } from 'vitest'
import { mentionTrigger, commandTrigger, hashtagTrigger, callbackTrigger } from '../trigger-presets'

describe('trigger-presets', () => {
  describe('mentionTrigger()', () => {
    it('returns sensible defaults', () => {
      const config = mentionTrigger()
      expect(config.char).toBe('@')
      expect(config.position).toBe('any')
      expect(config.mode).toBe('dropdown')
      expect(config.chipStyle).toBe('pill')
      expect(config.accessibilityLabel).toBe('mention')
    })

    it('allows overriding onSearch', () => {
      const onSearch = () => []
      const config = mentionTrigger({ onSearch })
      expect(config.onSearch).toBe(onSearch)
    })

    it('allows overriding the trigger character', () => {
      const config = mentionTrigger({ char: '+' })
      expect(config.char).toBe('+')
    })

    it('allows overriding chipClassName', () => {
      const config = mentionTrigger({ chipClassName: 'bg-blue-100' })
      expect(config.chipClassName).toBe('bg-blue-100')
    })
  })

  describe('commandTrigger()', () => {
    it('returns sensible defaults', () => {
      const config = commandTrigger()
      expect(config.char).toBe('/')
      expect(config.position).toBe('start')
      expect(config.mode).toBe('dropdown')
      expect(config.chipStyle).toBe('inline')
      expect(config.accessibilityLabel).toBe('command')
    })

    it('allows overriding emptyMessage', () => {
      const config = commandTrigger({ emptyMessage: 'No commands found' })
      expect(config.emptyMessage).toBe('No commands found')
    })
  })

  describe('hashtagTrigger()', () => {
    it('returns sensible defaults with resolveOnSpace', () => {
      const config = hashtagTrigger()
      expect(config.char).toBe('#')
      expect(config.position).toBe('any')
      expect(config.mode).toBe('dropdown')
      expect(config.chipStyle).toBe('pill')
      expect(config.resolveOnSpace).toBe(true)
      expect(config.accessibilityLabel).toBe('tag')
    })

    it('allows disabling resolveOnSpace', () => {
      const config = hashtagTrigger({ resolveOnSpace: false })
      expect(config.resolveOnSpace).toBe(false)
    })
  })

  describe('callbackTrigger()', () => {
    it('creates a callback-mode trigger', () => {
      const onActivate = () => {}
      const config = callbackTrigger({ char: '!', onActivate })
      expect(config.char).toBe('!')
      expect(config.mode).toBe('callback')
      expect(config.position).toBe('start')
      expect(config.onActivate).toBe(onActivate)
    })

    it('allows overriding position', () => {
      const config = callbackTrigger({ char: '!', position: 'any' })
      expect(config.position).toBe('any')
    })
  })
})
