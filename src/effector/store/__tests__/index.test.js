//@flow

import {createStore} from '..'
import {createEvent} from 'effector/event'
import {createEffect} from 'effector/effect'

test('createStore', () => {
  expect(() => createStore(undefined)).toThrowErrorMatchingSnapshot()
})

test('.map', () => {
  const spy = jest.fn()
  const newWord = createEvent/*:: <string> */()
  const a = createStore('word').on(newWord, (_, word) => word)

  const b = a.map(word => word.length)

  const sum = b.map((ln, prevLn) => ln + prevLn, 0)

  sum.watch(spy)

  expect(a.getState()).toBe('word')
  expect(b.getState()).toBe(4)
  expect(sum.getState()).toBe(4)

  newWord('lol')

  expect(a.getState()).toBe('lol')
  expect(b.getState()).toBe(3)
  expect(sum.getState()).toBe(7)

  newWord('long word')

  expect(a.getState()).toBe('long word')
  expect(b.getState()).toBe(9)
  expect(sum.getState()).toBe(16)

  expect(spy).toHaveBeenCalledTimes(3)

  newWord('')

  expect(spy).toHaveBeenCalledTimes(3)
})

describe('.watch', () => {
  it('supports functions', () => {
    const spy = jest.fn()
    const newWord = createEvent/*:: <string> */()
    const a = createStore('word').on(newWord, (_, word) => word)

    const b = a.map(word => word.length)

    const sum = b.map((ln, prevLn) => ln + prevLn, 0)

    sum.watch(spy)

    newWord('lol')

    newWord('long word')

    expect(spy).toHaveBeenCalledTimes(3)

    newWord('')

    expect(spy).toHaveBeenCalledTimes(3)
  })
  it('returns unsubscribe function', () => {
    const spy = jest.fn()
    const newWord = createEvent/*:: <string> */()
    const a = createStore('word').on(newWord, (_, word) => word)

    const b = a.map(word => word.length)

    const sum = b.map((ln, prevLn) => ln + prevLn, 0)

    const unsub = sum.watch(sum => {
      console.warn('summ called', sum)
      spy(sum)
    })

    newWord('lol')

    newWord('long word [1]')
    console.log(spy.mock.calls)
    expect(spy).toHaveBeenCalledTimes(3)

    unsub()

    newWord('long word _ [2]')
    expect(spy).toHaveBeenCalledTimes(3)
  })
  it('supports events', () => {
    const spy = jest.fn()
    const newWord = createEvent/*:: <string> */('new word')
    const spyEvent = createEvent('spy event')
    const a = createStore('word').on(newWord, (_, word) => word)

    const b = a.map(word => word.length)

    const sum = b.map((ln, prevLn) => ln + prevLn, 0)

    sum.watch(spyEvent, (store, event) => spy(store, event))

    newWord('lol')
    expect(spy).toHaveBeenCalledTimes(0)
    spyEvent(1)
    spyEvent(2)
    expect(spy).toHaveBeenCalledTimes(2)

    newWord('')
    expect(spy).toHaveBeenCalledTimes(2)
    newWord(' ')
    expect(spy).toHaveBeenCalledTimes(2)

    spyEvent(3)
    newWord('long word')
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls).toEqual([[7, 1], [7, 2], [8, 3]])
  })
  it('supports effects', () => {
    const spy = jest.fn()
    const newWord = createEvent/*:: <string> */('new word')
    const spyEvent = createEffect('spy effect')
    spyEvent.use(args => (console.log(args), args))
    const a = createStore('word').on(newWord, (_, word) => word)

    const b = a.map(word => word.length)

    const sum = b.map((ln, prevLn) => ln + prevLn, 0)

    sum.watch(spyEvent, (store, event) => spy(store, event))

    newWord('lol')
    expect(spy).toHaveBeenCalledTimes(0)
    spyEvent(1)
    spyEvent(2)
    expect(spy).toHaveBeenCalledTimes(2)

    newWord('')
    expect(spy).toHaveBeenCalledTimes(2)
    newWord(' ')
    expect(spy).toHaveBeenCalledTimes(2)

    spyEvent(3)
    newWord('long word')
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls).toEqual([[7, 1], [7, 2], [8, 3]])
  })
})

test('.off', () => {
  const spy = jest.fn()
  const newWord = createEvent/*:: <string> */()
  const a = createStore('word').on(newWord, (_, word) => word)

  const b = a.map(word => word.length)

  const sum = b.map((ln, prevLn) => ln + prevLn, 0)

  sum.watch(spy)

  expect(a.getState()).toBe('word')
  expect(b.getState()).toBe(4)
  expect(sum.getState()).toBe(4)

  newWord('lol')

  expect(a.getState()).toBe('lol')
  expect(b.getState()).toBe(3)
  expect(sum.getState()).toBe(7)

  a.off(newWord)

  newWord('long word')

  expect(a.getState()).toBe('lol')
  expect(b.getState()).toBe(3)
  expect(sum.getState()).toBe(7)

  expect(spy).toHaveBeenCalledTimes(2)

  newWord('')

  expect(spy).toHaveBeenCalledTimes(2)
})
