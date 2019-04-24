//@flow

import {
  restore,
  restoreEvent,
  restoreEffect,
  restoreObject,
} from 'effector/store'
import {createEvent} from 'effector/event'
import {createEffect, type Effect} from 'effector/effect'

describe('separate functions', () => {
  test('restore object', () => {
    const shape = restoreObject({
      foo: ('foo': 'foo'),
      bar: 0,
    })
    expect(shape.foo.getState()).toBe('foo')
    expect(shape.bar.getState()).toBe(0)
  })

  test('restore event', () => {
    const event = createEvent<string>('e1')

    const shape = restoreEvent(event, 'def')
    expect(shape.getState()).toBe('def')
    event('foo')
    expect(shape.getState()).toBe('foo')
  })

  test('restore effect', async() => {
    const spy = jest.fn()
    const fx: Effect<string, number, string> = createEffect('fx1')
    fx.use(text => text.length)
    const shape = restoreEffect(fx, -1)
    shape.watch(spy)
    expect(shape.getState()).toBe(-1)
    await fx('foo')
    expect(shape.getState()).toBe(3)
    expect(spy).toHaveBeenCalledTimes(2)
    fx.use(() => {
      throw 'err'
    })
    await expect(fx('bar')).rejects.toBe('err')
    expect(spy).toHaveBeenCalledTimes(2)
  })
})

describe('single function', () => {
  test('restore object', () => {
    const shape = restore({
      foo: ('foo': 'foo'),
      bar: 0,
    })
    expect(shape.foo.getState()).toBe('foo')
    expect(shape.bar.getState()).toBe(0)
  })

  test('restore event', () => {
    const event = createEvent<string>('e1')

    const shape = restore(event, 'def')
    expect(shape.getState()).toBe('def')
    event('foo')
    expect(shape.getState()).toBe('foo')
  })

  test('restore effect', async() => {
    const spy = jest.fn()
    const fx: Effect<string, number, string> = createEffect('fx1')
    fx.use(text => text.length)
    const shape = restore(fx, -1)
    shape.watch(spy)
    expect(shape.getState()).toBe(-1)
    await fx('foo')
    expect(shape.getState()).toBe(3)
    expect(spy).toHaveBeenCalledTimes(2)
    fx.use(() => {
      throw 'err'
    })
    await expect(fx('bar')).rejects.toBe('err')
    expect(spy).toHaveBeenCalledTimes(2)
  })
  test('all together', () => {
    const keyPressed = createEvent<string>()

    const calculate = createEffect()
    const shape = restore({
      index: 0,
      press: restore(keyPressed, ' '),
      sqrt: restore(calculate, '0'),
    })
    calculate.use(n => Promise.resolve((n * n).toString()))
    expect(shape.index.getState()).toBe(0)
  })
})
